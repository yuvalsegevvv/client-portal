import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { uploadClientDocument } from "@/lib/client-data";

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File is larger than 20MB." }, { status: 400 });
    }

    const result = await uploadClientDocument(session.clientId, file);
    return NextResponse.json({ ok: true, fileId: result.id });
  } catch (err: any) {
    console.error("Document upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong uploading the file." },
      { status: 500 }
    );
  }
}
