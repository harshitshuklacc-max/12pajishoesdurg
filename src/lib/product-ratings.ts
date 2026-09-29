import { db } from "@/db";
import { productRatings } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function getProductRatingSummary(productId: number) {
  const [row] = await db
    .select({
      average: sql<number>`coalesce(avg(${productRatings.rating})::float, 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(productRatings)
    .where(eq(productRatings.productId, productId));

  return {
    average: row?.count ? Math.round((row.average + Number.EPSILON) * 10) / 10 : 0,
    count: row?.count ?? 0,
  };
}

export async function listProductRatings(productId: number, limit = 20) {
  return db.query.productRatings.findMany({
    where: eq(productRatings.productId, productId),
    orderBy: [desc(productRatings.createdAt)],
    limit,
  });
}
