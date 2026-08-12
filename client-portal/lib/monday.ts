// Server-only. Never import this file from client components.
// Talks directly to the Monday.com API using a token stored server-side.

const MONDAY_API_URL = "https://api.monday.com/v2";

// --- Board / column IDs for this account (see project README for the map) ---
export const BOARDS = {
  CPA_REGISTER: "5101973727",
  CLIENT_DIRECTORY: "5101973728",
  TASK_SCHEDULE: "5101973730",
  ROTATION_CONTROL: "5101983486"
} as const;

export const CLIENT_COLS = {
  LISTING_TYPE: "color_mm64kbyq",
  ENTITY_TYPE: "color_mm6441h5",
  ASSIGNED_CPA: "board_relation_mm64xc50",
  CLIENT_STATUS: "color_mm651xhk",
  SERVICE_TYPE: "color_mm65sz12",
  CONTACT_NAME: "text_mm65qjb3",
  CONTACT_EMAIL: "email_mm65mn70",
  CONTACT_PHONE: "phone_mm65ezt2",
  ACCESS_CODE: "text_mm65m00p",
  ACCESS_CODE_EXPIRES: "text_mm6517nj",
  DOCUMENTS: "file_mm652h1f"
} as const;

export const TASK_COLS = {
  CLIENT: "board_relation_mm64cbc4",
  ASSIGNED_CPA: "board_relation_mm644md0",
  TASK_TYPE: "color_mm648hbh",
  DEADLINE: "date_mm64vers",
  STATUS: "color_mm64djre",
  DAYS_DELAYED: "numeric_mm64v98w"
} as const;

export const CPA_COLS = {
  EMPLOYMENT_STATUS: "color_mm64s75",
  ROTATION_ORDER: "numeric_mm64aevk"
} as const;

export const ROTATION_CONTROL_ITEM_ID = "3153353479";
export const ROTATION_CONTROL_COL = "board_relation_mm649t83";

function getToken(): string {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    throw new Error("MONDAY_API_TOKEN is not set in the environment.");
  }
  return token;
}

export async function mondayQuery<T = any>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken(),
      "API-Version": "2025-10"
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store"
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(
      "Monday API error: " + json.errors.map((e: any) => e.message).join("; ")
    );
  }
  return json.data as T;
}

/** Escapes a value for embedding inside a JSON string that itself sits inside a GraphQL string literal. */
export function columnValuesJSON(values: Record<string, unknown>): string {
  return JSON.stringify(JSON.stringify(values));
}
