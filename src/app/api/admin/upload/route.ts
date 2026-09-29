import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { validateUpload } from "@/lib/cloudinary-url";
import { uploadBuffer } from "@/lib/cloudinary.server";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string) || "uploads";
  const type = (form.get("type") as "image" | "video") || "image";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validationError = validateUpload(file, type);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadBuffer(buffer, folder, type);

  return NextResponse.json(result);
}
