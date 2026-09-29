import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { colors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const auth = await requireAdmin("products.view");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const list = await db.query.colors.findMany();
  return NextResponse.json(list);
}

const createSchema = z.object({
  name: z.string().min(1),
  hexCode: z.string().optional(),
  swatchUrl: z.string().optional(),
  swatchPublicId: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdmin("products.edit");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid color data" }, { status: 400 });

  const [row] = await db.insert(colors).values(parsed.data).returning();
  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin("products.edit");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.delete(colors).where(eq(colors.id, id));
  return NextResponse.json({ ok: true });
}
