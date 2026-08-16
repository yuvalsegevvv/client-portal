import { NextRequest, NextResponse } from "next/server";
import { findClientByEmail, setupOrVerifyPassword } from "@/lib/client-data";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const client = await findClientByEmail(email);
    if (!client) {
      return NextResponse.json({ error: "We don't recognize that email." }, { status: 401 });
    }

    const result = await setupOrVerifyPassword(client.id, password);

    if (result === "password_too_short") {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (result === "wrong_password") {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    // "setup_success" or "login_success" both mean: sign them in.
    await createSession({ clientId: client.id, clientName: client.name, email: client.email || email });

    return NextResponse.json({ ok: true, firstTime: result === "setup_success" });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong on the server. Check the server logs." },
      { status: 500 }
    );
  }
}
