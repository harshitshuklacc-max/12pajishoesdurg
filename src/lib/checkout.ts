import { db } from "@/db";
import { products, productVariants, coupons } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CheckoutLine = {
  productId: number;
  variantId?: number | null;
  quantity: number;
};

export type ValidatedLine = {
  productId: number;
  variantId: number | null;
  productName: string;
  productSku: string;
  sizeLabel: string | null;
  colorName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
  maxStock: number;
};

export async function validateCartLines(lines: CheckoutLine[]): Promise<{ ok: true; items: ValidatedLine[]; subtotal: number } | { ok: false; error: string }> {
  if (!lines.length) return { ok: false, error: "Cart is empty" };

  const validated: ValidatedLine[] = [];
  let subtotal = 0;

  for (const line of lines) {
    if (line.quantity < 1) return { ok: false, error: "Invalid quantity" };

    const product = await db.query.products.findFirst({
      where: eq(products.id, line.productId),
      with: { images: { limit: 1 } },
    });
    if (!product || !product.isActive || product.deletedAt) {
      return { ok: false, error: "Product unavailable" };
    }

    let unitPrice = parseFloat(product.sellingPrice);
    let sku = product.sku;
    let stock = product.stock;
    let sizeLabel: string | null = null;
    let colorName: string | null = null;
    let imageUrl = product.images[0]?.url ?? null;

    if (product.hasSizes || product.hasColors) {
      if (!line.variantId) {
        return { ok: false, error: `Please select options for ${product.name}` };
      }
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, line.variantId),
        with: { size: true, color: true },
      });
      if (!variant || variant.productId !== product.id) {
        return { ok: false, error: "Invalid variant" };
      }
      if (product.hasSizes && !variant.sizeId) {
        return { ok: false, error: "Size required" };
      }
      if (product.hasColors && !variant.colorId) {
        return { ok: false, error: "Color required" };
      }
      unitPrice = variant.sellingPrice ? parseFloat(variant.sellingPrice) : unitPrice;
      sku = variant.sku;
      stock = variant.stock;
      sizeLabel = variant.size?.label ?? null;
      colorName = variant.color?.name ?? null;
      imageUrl = variant.imageUrl ?? imageUrl;
    } else if (line.variantId) {
      return { ok: false, error: "Invalid cart item" };
    }

    if (stock < line.quantity) {
      return { ok: false, error: `${product.name} is out of stock` };
    }

    const totalPrice = unitPrice * line.quantity;
    subtotal += totalPrice;
    validated.push({
      productId: product.id,
      variantId: line.variantId ?? null,
      productName: product.name,
      productSku: sku,
      sizeLabel,
      colorName,
      quantity: line.quantity,
      unitPrice,
      totalPrice,
      imageUrl,
      maxStock: stock,
    });
  }

  return { ok: true, items: validated, subtotal };
}

export async function applyCoupon(code: string | undefined, subtotal: number) {
  if (!code) return { discount: 0, couponCode: null as string | null };
  const coupon = await db.query.coupons.findFirst({
    where: eq(coupons.code, code.toUpperCase()),
  });
  if (!coupon || !coupon.isActive) return { discount: 0, couponCode: null };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { discount: 0, couponCode: null };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { discount: 0, couponCode: null };
  if (coupon.minOrderAmount && subtotal < parseFloat(coupon.minOrderAmount)) {
    return { discount: 0, couponCode: null };
  }
  const discount =
    coupon.discountType === "percent"
      ? (subtotal * parseFloat(coupon.discountValue)) / 100
      : parseFloat(coupon.discountValue);
  return { discount: Math.min(discount, subtotal), couponCode: coupon.code };
}
