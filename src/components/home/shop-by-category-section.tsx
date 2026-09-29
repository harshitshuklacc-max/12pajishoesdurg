import Link from "next/link";
import { OptimizedImage } from "@/components/ui/optimized-image";

export type CategoryCard = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
};

export function ShopByCategorySection({ categories }: { categories: CategoryCard[] }) {
  if (!categories.length) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mb-10 text-center">
          <p className="section-eyebrow">Collections</p>
          <h2 className="section-title mt-3">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} className="premium-card group">
              <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-paji-cream to-white">
                {cat.imageUrl ? (
                  <>
                    <OptimizedImage
                      src={cat.imageUrl}
                      alt={cat.name}
                      preset="category"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-paji-deep/75 via-paji-deep/10 to-transparent" />
                    <p className="absolute bottom-4 left-0 right-0 text-center font-serif text-sm font-semibold uppercase tracking-[0.15em] text-white">
                      {cat.name}
                    </p>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                    <span className="text-2xl opacity-40">👟</span>
                    <span className="font-serif text-xs font-semibold uppercase tracking-wide text-gray-600">{cat.name}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
