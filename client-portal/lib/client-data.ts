import {
  mondayQuery,
  columnValuesJSON,
  BOARDS,
  CLIENT_COLS,
  TASK_COLS,
  CPA_COLS,
  ROTATION_CONTROL_ITEM_ID,
  ROTATION_CONTROL_COL
} from "./monday";

export interface ClientRecord {
  id: string;
  name: string;
  email: string | null;
}

/** Finds a Client Directory item whose Contact Email matches (case-insensitive). */
export async function findClientByEmail(email: string): Promise<ClientRecord | null> {
  const data = await mondayQuery<any>(
    `query ($boardId: [ID!]) {
      boards(ids: $boardId) {
        items_page(limit: 500) {
          items {
            id
            name
            email: column_values(ids: ["${CLIENT_COLS.CONTACT_EMAIL}"]) { text }
          }
        }
      }
    }`,
    { boardId: [BOARDS.CLIENT_DIRECTORY] }
  );

  const items = data.boards?.[0]?.items_page?.items ?? [];
  const normalized = email.trim().toLowerCase();
  const match = items.find(
    (it: any) => (it.email?.[0]?.text || "").trim().toLowerCase() === normalized
  );
  if (!match) return null;

  return { id: match.id, name: match.name, email: match.email?.[0]?.text ?? null };
}

import { scryptSync, timingSafeEqual } from "crypto";

export async function verifyPassword(
  clientItemId: string,
  submittedPassword: string
): Promise<boolean> {
  const data = await mondayQuery<any>(
    `query ($ids: [ID!]) {
      items(ids: $ids) {
        password: column_values(ids: ["${CLIENT_COLS.ACCESS_CODE}"]) { text }
      }
    }`,
    { ids: [clientItemId] }
  );

  const stored = data.items?.[0]?.password?.[0]?.text;
  if (!stored || !stored.includes(":")) return false;

  const [salt, hashHex] = stored.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(submittedPassword, salt, 64);

  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export interface OpenTask {
  id: string;
  name: string;
  taskType: string | null;
  status: string | null;
  deadline: string | null;
  daysDelayed: number;
}

const DONE_LABEL = "Done";

/** All tasks linked to this client whose status is not "Done". */
export async function getOpenTasksForClient(clientItemId: string): Promise<OpenTask[]> {
  const data = await mondayQuery<any>(
    `query ($boardId: [ID!]) {
      boards(ids: $boardId) {
        items_page(
          limit: 100
          query_params: {
            rules: [{ column_id: "${TASK_COLS.CLIENT}", compare_value: [${clientItemId}], operator: any_of }]
          }
        ) {
          items {
            id
            name
            taskType: column_values(ids: ["${TASK_COLS.TASK_TYPE}"]) { text }
            status: column_values(ids: ["${TASK_COLS.STATUS}"]) { text }
            deadline: column_values(ids: ["${TASK_COLS.DEADLINE}"]) { text }
            delayed: column_values(ids: ["${TASK_COLS.DAYS_DELAYED}"]) { text }
          }
        }
      }
    }`,
    { boardId: [BOARDS.TASK_SCHEDULE] }
  );

  const items = data.boards?.[0]?.items_page?.items ?? [];
  return items
    .filter((it: any) => (it.status?.[0]?.text || "") !== DONE_LABEL)
    .map((it: any) => ({
      id: it.id,
      name: it.name,
      taskType: it.taskType?.[0]?.text ?? null,
      status: it.status?.[0]?.text ?? null,
      deadline: it.deadline?.[0]?.text ?? null,
      daysDelayed: Number(it.delayed?.[0]?.text || 0)
    }));
}

/** Finds the next Active CPA after the last-assigned rotation order, wrapping around. Mirrors the Make logic. */
async function getNextCpaId(): Promise<string> {
  const pointerData = await mondayQuery<any>(
    `query ($ids: [ID!]) {
      items(ids: $ids) {
        column_values(ids: ["${ROTATION_CONTROL_COL}"]) {
          ... on BoardRelationValue {
            linked_items {
              id
              column_values(ids: ["${CPA_COLS.ROTATION_ORDER}"]) { text }
            }
          }
        }
      }
    }`,
    { ids: [ROTATION_CONTROL_ITEM_ID] }
  );

  const lastOrder = Number(
    pointerData.items?.[0]?.column_values?.[0]?.linked_items?.[0]?.column_values?.[0]?.text || 0
  );

  const nextData = await mondayQuery<any>(
    `query ($boardId: [ID!]) {
      boards(ids: $boardId) {
        nextAfter: items_page(
          limit: 1
          query_params: {
            rules: [
              { column_id: "${CPA_COLS.ROTATION_ORDER}", compare_value: [${lastOrder}], operator: greater_than }
              { column_id: "${CPA_COLS.EMPLOYMENT_STATUS}", compare_value: [3], operator: any_of }
            ]
            operator: and
            order_by: [{ column_id: "${CPA_COLS.ROTATION_ORDER}", direction: asc }]
          }
        ) { items { id } }
        firstOverall: items_page(
          limit: 1
          query_params: {
            rules: [{ column_id: "${CPA_COLS.EMPLOYMENT_STATUS}", compare_value: [3], operator: any_of }]
            order_by: [{ column_id: "${CPA_COLS.ROTATION_ORDER}", direction: asc }]
          }
        ) { items { id } }
      }
    }`,
    { boardId: [BOARDS.CPA_REGISTER] }
  );

  const board = nextData.boards?.[0];
  const nextId = board?.nextAfter?.items?.[0]?.id ?? board?.firstOverall?.items?.[0]?.id;
  if (!nextId) throw new Error("No active CPA available to assign.");
  return nextId;
}

/** Creates a new task for the client, assigns the next CPA in rotation, and advances the pointer. */
export async function createClientRequest(
  clientItemId: string,
  clientName: string,
  taskType: string,
  notes: string
): Promise<{ taskId: string; assignedCpaId: string }> {
  const cpaId = await getNextCpaId();

  const columnValues = columnValuesJSON({
    [TASK_COLS.CLIENT]: { item_ids: [Number(clientItemId)] },
    [TASK_COLS.ASSIGNED_CPA]: { item_ids: [Number(cpaId)] },
    [TASK_COLS.TASK_TYPE]: { label: taskType },
    [TASK_COLS.STATUS]: { label: "Not Started" }
  });

  const data = await mondayQuery<any>(
    `mutation ($boardId: ID!, $itemName: String!, $values: JSON!) {
      create_item(board_id: $boardId, item_name: $itemName, column_values: $values, create_labels_if_missing: true) { id }
    }`,
    {
      boardId: BOARDS.TASK_SCHEDULE,
      itemName: `${clientName} - ${taskType}${notes ? ` (${notes.slice(0, 60)})` : ""}`,
      values: columnValues
    }
  );

  await mondayQuery(
    `mutation ($boardId: ID!, $itemId: ID!, $values: JSON!) {
      change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $values) { id }
    }`,
    {
      boardId: BOARDS.ROTATION_CONTROL,
      itemId: ROTATION_CONTROL_ITEM_ID,
      values: JSON.stringify({ [ROTATION_CONTROL_COL]: { item_ids: [Number(cpaId)] } })
    }
  );

  return { taskId: data.create_item.id, assignedCpaId: cpaId };
}

/** Uploads a file (multipart) to the client's Documents column via Monday's file mutation. */
export async function uploadClientDocument(
  clientItemId: string,
  file: File
): Promise<{ id: string }> {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) throw new Error("MONDAY_API_TOKEN is not set.");

  const query = `mutation ($file: File!) {
    add_file_to_column(item_id: ${clientItemId}, column_id: "${CLIENT_COLS.DOCUMENTS}", file: $file) { id }
  }`;

  const form = new FormData();
  form.append("query", query);
  form.append("map", JSON.stringify({ file: ["variables.file"] }));
  form.append("variables", JSON.stringify({ file: null }));
  form.append("file", file);

  const res = await fetch("https://api.monday.com/v2/file", {
    method: "POST",
    headers: { Authorization: token },
    body: form
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error("Monday upload error: " + json.errors.map((e: any) => e.message).join("; "));
  }
  return { id: json.data.add_file_to_column.id };
}
