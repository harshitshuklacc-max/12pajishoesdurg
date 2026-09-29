import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orders, payments, coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { decreaseStock } from "@/lib/inventory";

const schema = z.object({
  orderNumber: z.string(),
  razorpayPaymentId: z.string(),
  razorpayOrderId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment data" }, { status: 400 });
    }

    const valid = verifyPaymentSignature(
      parsed.data.razorpayOrderId,
      parsed.data.razorpayPaymentId,
      parsed.data.razorpaySignature
    );
    if (!valid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, parsed.data.orderNumber),
      with: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, order.id),
    });
    if (!payment || payment.razorpayOrderId !== parsed.data.razorpayOrderId) {
      return NextResponse.json({ error: "Payment mismatch" }, { status: 400 });
    }

    if (payment.status === "success") {
      return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
    }

    await db
      .update(payments)
      .set({
        status: "success",
        razorpayPaymentId: parsed.data.razorpayPaymentId,
        razorpaySignature: parsed.data.razorpaySignature,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    await db.update(orders).set({ status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, order.id));

    if (order.couponCode) {
      const [coupon] = await db.select().from(coupons).where(eq(coupons.code, order.couponCode)).limit(1);
      if (coupon) {
        await db
          .update(coupons)
          .set({ usedCount: coupon.usedCount + 1 })
          .where(eq(coupons.id, coupon.id));
      }
    }

    for (const item of order.items) {
      if (item.productId) {
        await decreaseStock({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          orderId: order.id,
        });
      }
    }

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Verification error" }, { status: 500 });
  }
}
