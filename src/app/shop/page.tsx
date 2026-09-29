import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { listProducts, mapProductToCard } from "@/lib/products";

export const metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = parseInt(String(sp.page ?? "1"), 10);
  const q = sp.q ? String(sp.q) : undefined;
  const sort = sp.sort ? String(sp.sort) : undefined;
  const category = sp.category ? String(sp.category) : undefined;
  const onSale = sp.onSale === "1";
  const featured = sp.featured === "1";

  const { products, total, limit } = await listProducts({
    page,
    q,
    sort,
    categorySlug: category,
    onSale,
    featured,
  }).catch(() => ({ products: [], total: 0, limit: 24, page: 1 }));

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16">
      <div className="text-center sm:text-left">
        <p className="section-eyebrow">All styles</p>
        <h1 className="section-title mt-2">Shop</h1>
        {q && <p className="mt-2 text-gray-600">Results for &quot;{q}&quot;</p>}
      </div>

      {products.length === 0 ? (
        <p className="mt-12 text-center text-gray-500">No products found. Check back soon or browse categories.</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={mapProductToCard(p)} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/shop?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)])) , page: String(page - 1) }).toString()}`}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-paji-gray-light"
                >
                  Previous
                </Link>
              )}
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/shop?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)])) , page: String(page + 1) }).toString()}`}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-paji-gray-light"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
