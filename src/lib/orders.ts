import { db } from "@/db";
import { orderSequence, orders } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import type { CustomerSession } from "@/lib/auth/session";

export const ORDER_STATUS_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Payment pending",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export function customerOwnsOrder(
  order: { userId: number | null; customerMobile: string; guestMobile: string | null },
  session: CustomerSession
) {
  if (order.userId && order.userId === session.userId) return true;
  const mobile = session.mobile.replace(/\D/g, "");
  const orderMobile = (order.customerMobile || "").replace(/\D/g, "");
  const guestMobile = (order.guestMobile || "").replace(/\D/g, "");
  return Boolean(mobile && (orderMobile === mobile || guestMobile === mobile));
}

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  // Neon HTTP driver does not support transactions — use an atomic upsert instead.
  const [row] = await db
    .insert(orderSequence)
    .values({ year, lastNumber: 1 })
    .onConflictDoUpdate({
      target: orderSequence.year,
      set: { lastNumber: sql`${orderSequence.lastNumber} + 1` },
    })
    .returning({ lastNumber: orderSequence.lastNumber });

  if (!row) {
    throw new Error("Could not generate order number");
  }
  return `PAJI-${year}-${String(row.lastNumber).padStart(6, "0")}`;
}

export async function getOrderByNumber(orderNumber: string) {
  return db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
    with: { items: true, payment: true },
  });
}

export async function getCustomerOrder(orderNumber: string, session: CustomerSession) {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.orderNumber, orderNumber),
      or(eq(orders.userId, session.userId), eq(orders.customerMobile, session.mobile))
    ),
    with: { items: true, payment: true },
  });
  if (!order || !customerOwnsOrder(order, session)) return null;
  return order;
}
