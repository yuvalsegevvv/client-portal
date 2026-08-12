import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getOpenTasksForClient } from "@/lib/client-data";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const tasks = await getOpenTasksForClient(session.clientId);
    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("Tasks error:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong loading your tasks." },
      { status: 500 }
    );
  }
}
