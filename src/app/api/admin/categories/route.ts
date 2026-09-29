import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireAdmin("categories.view");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const list = await db.query.categories.findMany({ orderBy: (c, { asc }) => [asc(c.displayOrder)] });
  return NextResponse.json(list);
}

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdmin("categories.create");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const slug = parsed.data.slug || slugify(parsed.data.name);
  const [row] = await db
    .insert(categories)
    .values({ ...parsed.data, slug })
    .returning();

  await logAudit({
    adminId: auth.session!.adminId,
    action: "category.created",
    entityType: "category",
    entityId: row.id,
  });

  return NextResponse.json(row);
}

export async function PUT(req: Request) {
  const auth = await requireAdmin("categories.edit");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const id = body.id as number;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { id: _id, ...updates } = body;

  const [row] = await db
    .update(categories)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning();

  await logAudit({
    adminId: auth.session!.adminId,
    action: "category.updated",
    entityType: "category",
    entityId: id,
  });

  return NextResponse.json(row);
}
