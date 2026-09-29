"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { ProductRatings } from "@/components/product/product-ratings";

type Variant = {
  id: number;
  sku: string;
  sizeId: number | null;
  colorId: number | null;
  sellingPrice: string | null;
  stock: number;
  imageUrl: string | null;
};

type Props = {
  product: {
    id: number;
    slug: string;
    name: string;
    brand: string | null;
    description: string | null;
    sellingPrice: string;
    mrpPrice: string | null;
    discountPercent: number | null;
    stock: number;
    hasSizes: boolean;
    hasColors: boolean;
    images: { url: string; publicId: string; isPrimary: boolean }[];
    sizes: { id: number; label: string }[];
    colors: { id: number; name: string; hexCode: string | null }[];
    variants: Variant[];
  };
};

export function ProductDetail({ product }: Props) {
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setLoggedIn(!!data?.user))
      .catch(() => setLoggedIn(false));
  }, []);

  const variant = useMemo(() => {
    if (!product.hasSizes && !product.hasColors) return null;
    if (product.hasSizes && product.hasColors) {
      return product.variants.find(
        (v) => v.sizeId === selectedSize && v.colorId === selectedColor
      );
    }
    if (product.hasSizes) {
      return product.variants.find((v) => v.sizeId === selectedSize && !v.colorId);
    }
    return product.variants.find((v) => v.colorId === selectedColor && !v.sizeId);
  }, [product, selectedSize, selectedColor]);

  const price = variant?.sellingPrice ? parseFloat(variant.sellingPrice) : parseFloat(product.sellingPrice);
  const stock = variant ? variant.stock : product.stock;
  const outOfStock = stock <= 0;

  const canAdd =
    !outOfStock &&
    (!product.hasSizes || selectedSize !== null) &&
    (!product.hasColors || selectedColor !== null);

  const sizeLabel = product.sizes.find((s) => s.id === selectedSize)?.label;
  const colorName = product.colors.find((c) => c.id === selectedColor)?.name;
  const primaryImage = product.images[activeImage] ?? product.images[0];

  function handleAdd(buyNow?: boolean) {
    if (!canAdd) return;
    if (buyNow && loggedIn === false) {
      router.push(`/account?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    addItem({
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      name: product.name,
      imageUrl: variant?.imageUrl || primaryImage?.url || "",
      price,
      quantity: qty,
      sizeLabel: product.hasSizes ? sizeLabel : null,
      colorName: product.hasColors ? colorName : null,
      hasSizes: product.hasSizes,
      hasColors: product.hasColors,
      maxStock: stock,
    });
    if (buyNow) router.push("/checkout");
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-2 lg:px-6">
      <div>
        <div className="overflow-hidden rounded-2xl bg-paji-gray-light">
          {primaryImage ? (
            <OptimizedImage
              src={primaryImage.url}
              publicId={primaryImage.publicId}
              alt={product.name}
              preset="zoom"
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-gray-400">No image</div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={img.publicId}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImage ? "border-paji-orange" : "border-transparent"}`}
              >
                <OptimizedImage src={img.url} publicId={img.publicId} alt="" preset="thumbnail" className="h-16 w-16 object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        {product.brand && <p className="text-sm uppercase tracking-wide text-gray-500">{product.brand}</p>}
        <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-paji-orange">{formatPrice(price)}</span>
          {product.mrpPrice && parseFloat(product.mrpPrice) > price && (
            <>
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.mrpPrice)}</span>
              {product.discountPercent ? (
                <span className="rounded bg-paji-orange/10 px-2 py-0.5 text-sm font-semibold text-paji-orange">
                  {product.discountPercent}% off
                </span>
              ) : null}
            </>
          )}
        </div>
        <p className={`mt-2 text-sm font-medium ${outOfStock ? "text-red-600" : "text-green-700"}`}>
          {outOfStock ? "Out of stock" : `${stock} in stock`}
        </p>

        {product.hasSizes ? (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">Select Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSize(s.id)}
                  className={`min-w-11 rounded-md border px-3 py-2 text-sm font-medium ${
                    selectedSize === s.id ? "border-paji-orange bg-paji-orange text-white" : "hover:border-paji-orange"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-600">
            <span className="font-semibold">Size:</span> Not Applicable
          </p>
        )}

        {product.hasColors ? (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">Select Color</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    selectedColor === c.id ? "border-paji-orange ring-2 ring-paji-orange/30" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {c.hexCode && (
                      <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hexCode }} />
                    )}
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center gap-4">
          <label className="text-sm font-semibold" htmlFor="qty">
            Quantity
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={stock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(stock, parseInt(e.target.value, 10) || 1)))}
            className="w-20 rounded-md border px-2 py-1"
            disabled={outOfStock}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" disabled={!canAdd} onClick={() => handleAdd()}>
            Add to Cart
          </Button>
          <Button size="lg" variant="secondary" disabled={!canAdd} onClick={() => handleAdd(true)}>
            Buy Now
          </Button>
        </div>
        {loggedIn === false && (
          <p className="mt-3 text-sm text-gray-600">
            <Link href="/account?next=/checkout" className="font-semibold text-paji-orange hover:underline">
              Log in
            </Link>{" "}
            to place an order (checkout and Buy Now).
          </p>
        )}

        {product.description && (
          <div className="mt-10 border-t pt-8">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="mt-3 whitespace-pre-line text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        <ProductRatings productId={product.id} />
      </div>
    </div>
  );
}
