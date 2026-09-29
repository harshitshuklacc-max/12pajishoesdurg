import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ShopByCategorySection } from "@/components/home/shop-by-category-section";

export const metadata = { title: "Shop by Category" };

export default async function CategoriesPage() {
  const list = await db.query.categories
    .findMany({
      where: eq(categories.isActive, true),
      orderBy: [asc(categories.displayOrder)],
    })
    .catch(() => []);

  return (
    <div className="bg-white">
      <ShopByCategorySection
        categories={list.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          imageUrl: cat.imageUrl,
        }))}
      />
    </div>
  );
}
