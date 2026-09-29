import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  products,
  productImages,
  productColors,
  productSizes,
  productVariants,
} from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { slugify, calcDiscountPercent } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireAdmin("products.view");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const list = await db.query.products.findMany({
    where: isNull(products.deletedAt),
    with: { images: true, category: true },
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
    limit: 200,
  });
  return NextResponse.json(list);
}

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  sku: z.string().min(2),
  categoryId: z.number().int().positive(),
  brand: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sellingPrice: z.number(),
  mrpPrice: z.number().optional(),
  stock: z.number(),
  lowStockThreshold: z.number().optional(),
  hasSizes: z.boolean(),
  hasColors: z.boolean(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isOnSale: z.boolean().optional(),
  isDemo: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  colorIds: z.array(z.number()).optional(),
  sizeIds: z.array(z.number()).optional(),
  images: z.array(z.object({ url: z.string(), publicId: z.string(), isPrimary: z.boolean().optional() })).optional(),
  variants: z
    .array(
      z.object({
        sku: z.string(),
        sizeId: z.number().nullable().optional(),
        colorId: z.number().nullable().optional(),
        sellingPrice: z.number().optional(),
        stock: z.number(),
      })
    )
    .optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdmin("products.create");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const slug = d.slug || slugify(d.name);
  const discount = d.mrpPrice ? calcDiscountPercent(d.mrpPrice, d.sellingPrice) : 0;

  const [product] = await db
    .insert(products)
    .values({
      name: d.name,
      slug,
      sku: d.sku,
      categoryId: d.categoryId,
      brand: d.brand,
      description: d.description,
      shortDescription: d.shortDescription,
      sellingPrice: d.sellingPrice.toFixed(2),
      mrpPrice: d.mrpPrice?.toFixed(2),
      discountPercent: discount,
      stock: d.hasSizes || d.hasColors ? 0 : d.stock,
      lowStockThreshold: d.lowStockThreshold ?? 5,
      hasSizes: d.hasSizes,
      hasColors: d.hasColors,
      isActive: d.isActive ?? true,
      isFeatured: d.isFeatured ?? false,
      isBestseller: d.isBestseller ?? false,
      isNewArrival: d.isNewArrival ?? false,
      isOnSale: d.isOnSale ?? false,
      isDemo: d.isDemo ?? false,
      seoTitle: d.seoTitle,
      seoDescription: d.seoDescription,
    })
    .returning();

  if (d.images?.length) {
    await db.insert(productImages).values(
      d.images.map((img, i) => ({
        productId: product.id,
        url: img.url,
        publicId: img.publicId,
        sortOrder: i,
        isPrimary: img.isPrimary ?? i === 0,
      }))
    );
  }

  if (d.hasColors && d.colorIds?.length) {
    await db.insert(productColors).values(d.colorIds.map((colorId) => ({ productId: product.id, colorId })));
  }
  if (d.hasSizes && d.sizeIds?.length) {
    await db.insert(productSizes).values(d.sizeIds.map((sizeId) => ({ productId: product.id, sizeId })));
  }
  if ((d.hasSizes || d.hasColors) && d.variants?.length) {
    await db.insert(productVariants).values(
      d.variants.map((v) => ({
        productId: product.id,
        sku: v.sku,
        sizeId: v.sizeId ?? null,
        colorId: v.colorId ?? null,
        sellingPrice: v.sellingPrice?.toFixed(2),
        stock: v.stock,
      }))
    );
  }

  await logAudit({ adminId: auth.session!.adminId, action: "product.created", entityType: "product", entityId: product.id });
  return NextResponse.json(product);
}

const productUpdateSchema = z.object({
  id: z.number().int().positive(),
  isActive: z.boolean().optional(),
  limitedOfferEnabled: z.boolean().optional(),
  limitedOfferEndsAt: z.string().datetime().nullable().optional(),
});

export async function PUT(req: Request) {
  const auth = await requireAdmin("products.edit");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = productUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { id, limitedOfferEndsAt, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (limitedOfferEndsAt !== undefined) {
    updates.limitedOfferEndsAt = limitedOfferEndsAt ? new Date(limitedOfferEndsAt) : null;
  }
  const [row] = await db
    .update(products)
    .set(updates)
    .where(eq(products.id, id))
    .returning();

  await logAudit({ adminId: auth.session!.adminId, action: "product.updated", entityType: "product", entityId: id });
  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin("products.delete");
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await req.json();
  await db.update(products).set({ deletedAt: new Date(), isActive: false }).where(eq(products.id, id));
  await logAudit({ adminId: auth.session!.adminId, action: "product.deleted", entityType: "product", entityId: id });
  return NextResponse.json({ ok: true });
}
