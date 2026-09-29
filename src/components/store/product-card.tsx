import Link from "next/link";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatPrice } from "@/lib/utils";

export type ProductCardData = {
  slug: string;
  name: string;
  brand: string | null;
  sellingPrice: string;
  mrpPrice: string | null;
  discountPercent: number | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  stock: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const outOfStock = product.stock <= 0;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="premium-card group flex flex-col"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-paji-gray-light">
        {product.imageUrl || product.imagePublicId ? (
          <OptimizedImage
            src={product.imageUrl ?? ""}
            publicId={product.imagePublicId ?? undefined}
            alt={product.name}
            preset="card"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isNewArrival && (
            <span className="rounded bg-paji-orange px-2 py-0.5 text-[10px] font-bold uppercase text-white">New</span>
          )}
          {product.isOnSale && product.discountPercent ? (
            <span className="rounded bg-paji-black px-2 py-0.5 text-[10px] font-bold text-white">
              -{product.discountPercent}%
            </span>
          ) : null}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
            Out of Stock
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        {product.brand && <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">{product.brand}</p>}
        <h3 className="mt-1 line-clamp-2 font-medium text-paji-charcoal transition group-hover:text-paji-orange">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="font-serif text-xl font-semibold text-paji-orange">{formatPrice(product.sellingPrice)}</span>
          {product.mrpPrice && parseFloat(product.mrpPrice) > parseFloat(product.sellingPrice) && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.mrpPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
