import { NextResponse } from "next/server";

import { z } from "zod";

import { db } from "@/db";

import { orders, orderItems, payments } from "@/db/schema";

import { generateOrderNumber } from "@/lib/orders";

import { validateCartLines, applyCoupon } from "@/lib/checkout";

import { computeOrderTotal, type PaymentMethod } from "@/lib/order-totals";

import { getStoreSettings } from "@/lib/settings";

import { getRazorpay } from "@/lib/razorpay";

import { getCustomerSession } from "@/lib/auth/session";

import { decreaseStock } from "@/lib/inventory";



const bodySchema = z.object({

  customer: z.object({

    fullName: z.string().min(2),

    mobile: z.string().min(10),

    email: z.union([z.literal(""), z.string().email()]).optional(),

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

    const json = await req.json();

    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {

      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first ? `Invalid checkout data: ${first.path.join(".")} ${first.message}` : "Invalid checkout data" },
        { status: 400 }
      );

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

    const customer = await getCustomerSession();



    const [order] = await db

      .insert(orders)

      .values({

        orderNumber,

        userId: customer?.userId,

        customerName: parsed.data.customer.fullName,

        customerMobile: parsed.data.customer.mobile,

        customerEmail: parsed.data.customer.email || null,

        guestMobile: customer ? null : parsed.data.customer.mobile,

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

        status: paymentMethod === "cod" ? "confirmed" : "pending",

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



    if (paymentMethod === "cod") {

      await db.insert(payments).values({

        orderId: order.id,

        method: "cod",

        amount: total.toFixed(2),

        status: "pending",

      });



      for (const item of validation.items) {

        await decreaseStock({

          productId: item.productId,

          variantId: item.variantId,

          quantity: item.quantity,

          orderId: order.id,

        });

      }



      return NextResponse.json({

        orderNumber,

        paymentMethod: "cod",

        total,

        shipping,

        message: "Order placed. Pay cash on delivery (includes courier charge).",

      });

    }



    const amountPaise = Math.round(total * 100);

    const rzp = getRazorpay();

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
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Razorpay")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unable to create order" }, { status: 500 });

  }

}

