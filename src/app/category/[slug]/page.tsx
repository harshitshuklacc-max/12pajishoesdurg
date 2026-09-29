import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listProducts, mapProductToCard } from "@/lib/products";
import { ProductCard } from "@/components/store/product-card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cat = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (!cat) return {};
  return { title: cat.seoTitle || cat.name, description: cat.seoDescription || cat.description };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (!cat) notFound();

  const { products, total } = await listProducts({ categoryId: cat.id, limit: 48 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <h1 className="text-3xl font-bold">{cat.name}</h1>
      {cat.description && <p className="mt-2 max-w-2xl text-gray-600">{cat.description}</p>}
      <p className="mt-1 text-sm text-gray-500">{total} product{total === 1 ? "" : "s"}</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={mapProductToCard(p)} />
        ))}
      </div>
      {!products.length && <p className="mt-12 text-center text-gray-500">No products in this category yet.</p>}
    </div>
  );
}
