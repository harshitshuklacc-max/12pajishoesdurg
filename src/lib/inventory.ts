import { db } from "@/db";
import { products, productVariants, inventoryLogs } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export async function decreaseStock(params: {
  productId: number;
  variantId?: number | null;
  quantity: number;
  orderId: number;
}) {
  const { productId, variantId, quantity, orderId } = params;

  // Neon HTTP has no transactions; decrement with a stock check in WHERE.
  if (variantId) {
    const updated = await db
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(and(eq(productVariants.id, variantId), gte(productVariants.stock, quantity)))
      .returning({ id: productVariants.id });
    if (!updated.length) {
      throw new Error("Insufficient variant stock");
    }
    await db
      .update(products)
      .set({
        stock: sql`GREATEST(${products.stock} - ${quantity}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
  } else {
    const updated = await db
      .update(products)
      .set({
        stock: sql`${products.stock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), gte(products.stock, quantity)))
      .returning({ id: products.id });
    if (!updated.length) {
      throw new Error("Insufficient stock");
    }
  }

  await db.insert(inventoryLogs).values({
    productId,
    variantId: variantId ?? null,
    changeAmount: -quantity,
    reason: "order_paid",
    orderId,
  });
}

export async function getAvailableStock(productId: number, variantId?: number | null): Promise<number> {
  if (variantId) {
    const v = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
    });
    return v?.stock ?? 0;
  }
  const p = await db.query.products.findFirst({ where: eq(products.id, productId) });
  return p?.stock ?? 0;
}
