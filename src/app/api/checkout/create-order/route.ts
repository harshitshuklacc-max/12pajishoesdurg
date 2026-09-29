import { NextResponse } from "next/server";

import { z } from "zod";

import { db } from "@/db";

import { orders, orderItems, payments } from "@/db/schema";

import { generateOrderNumber } from "@/lib/orders";

import { validateCartLines, applyCoupon } from "@/lib/checkout";

import { computeOrderTotal, getCodAdvanceAmount, type PaymentMethod } from "@/lib/order-totals";

import { getStoreSettings } from "@/lib/settings";

import { getRazorpay } from "@/lib/razorpay";

import { requireCustomer } from "@/lib/auth/require-customer";

const bodySchema = z.object({

  customer: z.object({

    fullName: z.string().min(2),

    mobile: z.string().min(10),

    email: z.string().email().optional().or(z.literal("")),

    address: z.string().min(5),

    city: z.string().min(2),

    state: z.string().min(2),

    pincode: z.string().min(6),

  }),

  items: z.array(

    z.object({

      productId: z.number(),

      variantId: z.number().nullable().optional(),

      quantity: z.number().min(1),

    })

  ),

  couponCode: z.string().optional(),

  paymentMethod: z.enum(["online", "cod"]).default("online"),

});



export async function POST(req: Request) {

  try {

    const auth = await requireCustomer();

    if (auth.error) {

      return NextResponse.json({ error: auth.error }, { status: auth.status });

    }

    const customer = auth.session!;

    const json = await req.json();

    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {

      return NextResponse.json({ error: "Invalid checkout data" }, { status: 400 });

    }



    const validation = await validateCartLines(parsed.data.items);

    if (!validation.ok) {

      return NextResponse.json({ error: validation.error }, { status: 400 });

    }



    const settings = await getStoreSettings();

    const paymentMethod = parsed.data.paymentMethod as PaymentMethod;

    const { discount, couponCode } = await applyCoupon(parsed.data.couponCode, validation.subtotal);

    const { shipping, tax, total } = computeOrderTotal(

      validation.subtotal,

      discount,

      paymentMethod,

      settings

    );



    const orderNumber = await generateOrderNumber();

    const [order] = await db

      .insert(orders)

      .values({

        orderNumber,

        userId: customer.userId,

        customerName: parsed.data.customer.fullName,

        customerMobile: parsed.data.customer.mobile,

        customerEmail: parsed.data.customer.email || null,

        guestMobile: null,

        shippingAddress: parsed.data.customer.address,

        shippingCity: parsed.data.customer.city,

        shippingState: parsed.data.customer.state,

        shippingPincode: parsed.data.customer.pincode,

        subtotal: validation.subtotal.toFixed(2),

        discountAmount: discount.toFixed(2),

        shippingAmount: shipping.toFixed(2),

        taxAmount: tax.toFixed(2),

        total: total.toFixed(2),

        couponCode,

        paymentMethod,

        status: "pending",

      })

      .returning();



    await db.insert(orderItems).values(

      validation.items.map((item) => ({

        orderId: order.id,

        productId: item.productId,

        variantId: item.variantId,

        productName: item.productName,

        productSku: item.productSku,

        sizeLabel: item.sizeLabel,

        colorName: item.colorName,

        quantity: item.quantity,

        unitPrice: item.unitPrice.toFixed(2),

        totalPrice: item.totalPrice.toFixed(2),

        imageUrl: item.imageUrl,

      }))

    );



    const rzp = getRazorpay();

    if (paymentMethod === "cod") {

      const codAdvance = getCodAdvanceAmount(settings);

      const amountPaise = Math.round(codAdvance * 100);

      const rzpOrder = await rzp.orders.create({

        amount: amountPaise,

        currency: "INR",

        receipt: `${orderNumber}-advance`,

      });



      await db.insert(payments).values({

        orderId: order.id,

        method: "cod",

        razorpayOrderId: rzpOrder.id,

        amount: codAdvance.toFixed(2),

        status: "created",

      });



      return NextResponse.json({

        orderNumber,

        paymentMethod: "cod",

        razorpayOrderId: rzpOrder.id,

        amount: amountPaise,

        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

        storeName: settings.storeName,

        balanceAtDelivery: total,

        codAdvance,

        shipping,

      });

    }



    const amountPaise = Math.round(total * 100);

    const rzpOrder = await rzp.orders.create({

      amount: amountPaise,

      currency: "INR",

      receipt: orderNumber,

    });



    await db.insert(payments).values({

      orderId: order.id,

      method: "online",

      razorpayOrderId: rzpOrder.id,

      amount: total.toFixed(2),

      status: "created",

    });



    return NextResponse.json({

      orderNumber,

      paymentMethod: "online",

      razorpayOrderId: rzpOrder.id,

      amount: amountPaise,

      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

      storeName: settings.storeName,

      shipping,

      total,

    });

  } catch (e) {

    console.error(e);

    return NextResponse.json({ error: "Unable to create order" }, { status: 500 });

  }

}

