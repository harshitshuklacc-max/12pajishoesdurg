import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET(req: Request) {
  const auth = await requireAdmin("orders.view");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  let list = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit: 100,
    with: { items: true },
  });
  if (q) {
    list = list.filter(
      (o) =>
        o.orderNumber.includes(q) ||
        o.customerMobile.includes(q) ||
        o.customerName.toLowerCase().includes(q.toLowerCase())
    );
  }
  return NextResponse.json(list);
}

const statusSchema = z.object({
  id: z.number(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
  ]),
});

export async function PUT(req: Request) {
  const auth = await requireAdmin("orders.update");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = statusSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const [row] = await db
    .update(orders)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(orders.id, parsed.data.id))
    .returning();
  await logAudit({
    adminId: auth.session!.adminId,
    action: "order.status_changed",
    entityType: "order",
    entityId: parsed.data.id,
    metadata: { status: parsed.data.status },
  });
  return NextResponse.json(row);
}
