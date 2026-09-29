import { db } from "@/db";
import {
  products,
  productImages,
  categories,
  productVariants,
  productColors,
  productSizes,
  colors,
  sizes,
} from "@/db/schema";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, gte, lte } from "drizzle-orm";

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), isNull(products.deletedAt), eq(products.isActive, true)),
    with: {
      images: { orderBy: [asc(productImages.sortOrder)] },
      category: true,
      variants: true,
      productColors: { with: { color: true } },
      productSizes: { with: { size: true } },
    },
  });
  return product;
}

export async function listProducts(params: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  categoryId?: number;
  q?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  featured?: boolean;
  inStock?: boolean;
}) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 24, 48);
  const offset = (page - 1) * limit;

  const conditions = [isNull(products.deletedAt), eq(products.isActive, true)];

  if (params.categoryId) {
    conditions.push(eq(products.categoryId, params.categoryId));
  } else if (params.categorySlug) {
    const cat = await db.query.categories.findFirst({
      where: eq(categories.slug, params.categorySlug),
    });
    if (!cat) {
      return { products: [], total: 0, page, limit };
    }
    conditions.push(eq(products.categoryId, cat.id));
  }

  if (params.q) {
    const term = `%${params.q}%`;
    conditions.push(
      or(
        ilike(products.name, term),
        ilike(products.sku, term),
        ilike(products.brand, term)
      )!
    );
  }

  if (params.onSale) conditions.push(eq(products.isOnSale, true));
  if (params.featured) conditions.push(eq(products.isFeatured, true));
  if (params.inStock) conditions.push(gte(products.stock, 1));
  if (params.minPrice !== undefined) {
    conditions.push(gte(products.sellingPrice, params.minPrice.toString()));
  }
  if (params.maxPrice !== undefined) {
    conditions.push(lte(products.sellingPrice, params.maxPrice.toString()));
  }

  let orderBy = desc(products.createdAt);
  switch (params.sort) {
    case "price_asc":
      orderBy = asc(products.sellingPrice);
      break;
    case "price_desc":
      orderBy = desc(products.sellingPrice);
      break;
    case "featured":
      orderBy = desc(products.isFeatured);
      break;
    case "popular":
      orderBy = desc(products.viewCount);
      break;
    default:
      orderBy = desc(products.createdAt);
  }

  const rows = await db.query.products.findMany({
    where: and(...conditions),
    orderBy: [orderBy],
    limit,
    offset,
    with: {
      images: {
        orderBy: [asc(productImages.sortOrder), asc(productImages.id)],
        limit: 1,
      },
      variants: true,
    },
  });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...conditions));

  return { products: rows, total: count, page, limit };
}

export async function getFeaturedProducts(limit = 8) {
  return db.query.products.findMany({
    where: and(isNull(products.deletedAt), eq(products.isActive, true), eq(products.isFeatured, true)),
    limit,
    with: { images: { orderBy: [asc(productImages.sortOrder)], limit: 1 }, variants: true },
    orderBy: [desc(products.updatedAt)],
  });
}

export async function getHomepageProducts(type: "new" | "bestseller" | "sale", limit = 8) {
  const cond =
    type === "new"
      ? eq(products.isNewArrival, true)
      : type === "bestseller"
        ? eq(products.isBestseller, true)
        : eq(products.isOnSale, true);
  return db.query.products.findMany({
    where: and(isNull(products.deletedAt), eq(products.isActive, true), cond),
    limit,
    with: { images: { orderBy: [asc(productImages.sortOrder)], limit: 1 }, variants: true },
  });
}

/** All active shoes for homepage — capped at 20 by default. */
export async function getHomepageCatalog(limit = 20) {
  const { products: rows } = await listProducts({ limit, page: 1, sort: "newest" });
  return rows;
}

export function availableStock(p: {
  stock: number;
  hasSizes?: boolean | null;
  hasColors?: boolean | null;
  variants?: { stock: number }[] | null;
}) {
  if (p.hasSizes || p.hasColors) {
    return (p.variants ?? []).reduce((sum, v) => sum + (v.stock ?? 0), 0);
  }
  return p.stock;
}

export function mapProductToCard(p: {
  slug: string;
  name: string;
  brand: string | null;
  sellingPrice: string;
  mrpPrice: string | null;
  discountPercent: number | null;
  stock: number;
  hasSizes?: boolean | null;
  hasColors?: boolean | null;
  variants?: { stock: number }[] | null;
  isNewArrival: boolean | null;
  isOnSale: boolean | null;
  images?: { url: string; publicId: string }[];
}) {
  const img = p.images?.[0];
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    sellingPrice: p.sellingPrice,
    mrpPrice: p.mrpPrice,
    discountPercent: p.discountPercent,
    stock: availableStock(p),
    isNewArrival: p.isNewArrival ?? false,
    isOnSale: p.isOnSale ?? false,
    imageUrl: img?.url ?? null,
    imagePublicId: img?.publicId ?? null,
  };
}
