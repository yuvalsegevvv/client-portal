import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createClientRequest } from "@/lib/client-data";

const ALLOWED_TASK_TYPES = [
  "Monthly Report",
  "Annual Report",
  "Task Reduction",
  "Periodic Tax",
  "Annual Tax Return"
];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { taskType, notes } = await req.json();

    if (!taskType || !ALLOWED_TASK_TYPES.includes(taskType)) {
      return NextResponse.json({ error: "Choose a valid request type." }, { status: 400 });
    }

    const result = await createClientRequest(
      session.clientId,
      session.clientName,
      taskType,
      typeof notes === "string" ? notes : ""
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("Request submission error:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong submitting your request." },
      { status: 500 }
    );
  }
}
