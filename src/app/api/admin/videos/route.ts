import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAudit } from "@/lib/audit";
import { deleteAsset } from "@/lib/cloudinary.server";

export async function GET() {
  const auth = await requireAdmin("videos.manage");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const list = await db.query.videos.findMany({ orderBy: (v, { asc }) => [asc(v.displayOrder)] });
  return NextResponse.json(list);
}

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  videoUrl: z.string().url(),
  videoPublicId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdmin("videos.manage");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const [row] = await db.insert(videos).values(parsed.data).returning();
  await logAudit({ adminId: auth.session!.adminId, action: "video.created", entityType: "video", entityId: row.id });
  return NextResponse.json(row);
}

const updateSchema = schema.partial().extend({ id: z.number().int().positive() });

export async function PUT(req: Request) {
  const auth = await requireAdmin("videos.manage");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { id, ...patch } = parsed.data;
  const [row] = await db
    .update(videos)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(videos.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin("videos.manage");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "number" ? body.id : parseInt(String(body?.id ?? ""), 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Missing video id" }, { status: 400 });

  const row = await db.query.videos.findFirst({ where: eq(videos.id, id) });
  if (!row) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  if (row.videoPublicId) {
    try {
      await deleteAsset(row.videoPublicId, "video");
    } catch (e) {
      console.error("Cloudinary video delete:", e);
    }
  }
  if (row.thumbnailPublicId) {
    try {
      await deleteAsset(row.thumbnailPublicId, "image");
    } catch (e) {
      console.error("Cloudinary thumbnail delete:", e);
    }
  }

  await db.delete(videos).where(eq(videos.id, id));
  await logAudit({
    adminId: auth.session!.adminId,
    action: "video.deleted",
    entityType: "video",
    entityId: String(id),
  });
  return NextResponse.json({ ok: true });
}
