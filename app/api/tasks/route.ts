import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getOpenTasksForClient } from "@/lib/client-data";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const tasks = await getOpenTasksForClient(session.clientId);
  return NextResponse.json({ tasks });
}
