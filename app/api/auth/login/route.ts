import { NextRequest, NextResponse } from "next/server";
import { findClientByEmail, verifyPassword } from "@/lib/client-data";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const client = await findClientByEmail(email);
  if (!client) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(client.id, password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createSession({ clientId: client.id, clientName: client.name, email: client.email || email });

  return NextResponse.json({ ok: true });
}
