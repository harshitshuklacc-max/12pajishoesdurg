import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { productRatings, products } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getProductRatingSummary, listProductRatings } from "@/lib/product-ratings";

type Ctx = { params: Promise<{ id: string }> };

const postSchema = z.object({
  reviewerName: z.string().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  const productId = parseInt((await ctx.params).id, 10);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const [summary, ratings] = await Promise.all([
    getProductRatingSummary(productId),
    listProductRatings(productId),
  ]);

  return NextResponse.json({
    summary,
    ratings: ratings.map((r) => ({
      id: r.id,
      reviewerName: r.reviewerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const productId = parseInt((await ctx.params).id, 10);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rating data" }, { status: 400 });
  }

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), isNull(products.deletedAt), eq(products.isActive, true)),
    columns: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await db.insert(productRatings).values({
    productId,
    reviewerName: parsed.data.reviewerName,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  });

  const [summary, ratings] = await Promise.all([
    getProductRatingSummary(productId),
    listProductRatings(productId),
  ]);

  return NextResponse.json({
    summary,
    ratings: ratings.map((r) => ({
      id: r.id,
      reviewerName: r.reviewerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
