import { NextResponse } from "next/server";
import { z } from "zod";
import { applyCoupon, validateCartLines } from "@/lib/checkout";
import {
  computeOrderTotal,
  getCodAdvanceAmount,
  shippingLineLabel,
  type PaymentMethod,
} from "@/lib/order-totals";
import { getStoreSettings } from "@/lib/settings";
import { requireCustomer } from "@/lib/auth/require-customer";

const bodySchema = z.object({
  items: z.array(
    z.object({
      productId: z.number(),
      variantId: z.number().nullable().optional(),
      quantity: z.number().min(1),
    })
  ),
  paymentMethod: z.enum(["online", "cod"]).default("online"),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireCustomer();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
    }

    const validation = await validateCartLines(parsed.data.items);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const settings = await getStoreSettings();
    const { discount, couponCode } = await applyCoupon(parsed.data.couponCode, validation.subtotal);
    const paymentMethod = parsed.data.paymentMethod as PaymentMethod;
    const { shipping, tax, total } = computeOrderTotal(
      validation.subtotal,
      discount,
      paymentMethod,
      settings
    );

    const codAdvance = getCodAdvanceAmount(settings);

    return NextResponse.json({
      subtotal: validation.subtotal,
      discount,
      couponCode,
      shipping,
      shippingLabel: shippingLineLabel(paymentMethod, shipping),
      tax,
      total,
      paymentMethod,
      codAdvance: paymentMethod === "cod" ? codAdvance : 0,
      dueAtDelivery: paymentMethod === "cod" ? total : 0,
      dueNow: paymentMethod === "cod" ? codAdvance : total,
      codNote:
        paymentMethod === "cod"
          ? `Pay ₹${codAdvance} now via Razorpay as COD advance. Remaining ₹${total.toFixed(0)} is due in cash at delivery.`
          : null,
      prepaidNote:
        paymentMethod === "online" && settings.freeShippingAbove
          ? `Free shipping on prepaid orders above ₹${settings.freeShippingAbove}. Orders below that add ₹100 shipping.`
          : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unable to calculate total" }, { status: 500 });
  }
}
