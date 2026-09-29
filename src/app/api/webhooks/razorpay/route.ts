import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  if (event.event === "payment.captured") {
    const paymentEntity = event.payload.payment.entity;
    const rzpOrderId = paymentEntity.order_id;
    const payment = await db.query.payments.findFirst({
      where: eq(payments.razorpayOrderId, rzpOrderId),
    });
    if (payment && payment.status !== "success") {
      await db
        .update(payments)
        .set({
          status: "success",
          razorpayPaymentId: paymentEntity.id,
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
      await db.update(orders).set({ status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, payment.orderId));
    }
  }

  return NextResponse.json({ received: true });
}
