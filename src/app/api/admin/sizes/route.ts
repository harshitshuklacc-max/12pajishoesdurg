import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sizes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const auth = await requireAdmin("products.view");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const list = await db.query.sizes.findMany({ orderBy: [asc(sizes.sortOrder), asc(sizes.id)] });
  return NextResponse.json(list);
}

const createSchema = z.object({
  label: z.string().min(1),
  system: z.enum(["india", "uk", "us", "eu", "custom"]).optional(),
  sortOrder: z.number().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdmin("products.edit");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid size data" }, { status: 400 });

  const [row] = await db
    .insert(sizes)
    .values({
      label: parsed.data.label,
      system: parsed.data.system ?? "india",
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin("products.edit");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.delete(sizes).where(eq(sizes.id, id));
  return NextResponse.json({ ok: true });
}
