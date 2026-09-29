"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const { items, savedForLater, removeItem, updateQuantity, moveToSaved, restoreFromSaved, subtotal } = useCart();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setLoggedIn(!!data?.user))
      .catch(() => setLoggedIn(false));
  }, []);

  if (!items.length && !savedForLater.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-gray-600">Discover footwear crafted for comfort and style.</p>
        <Button asChild className="mt-6">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>
      <ul className="mt-8 divide-y">
        {items.map((item) => (
          <li key={`${item.productId}-${item.variantId}`} className="flex gap-4 py-6">
            <Link href={`/products/${item.slug}`} className="shrink-0 overflow-hidden rounded-lg bg-paji-gray-light">
              <OptimizedImage src={item.imageUrl} alt={item.name} preset="thumbnail" className="h-24 w-24 object-cover" />
            </Link>
            <div className="flex flex-1 flex-col">
              <Link href={`/products/${item.slug}`} className="font-semibold hover:text-paji-orange">
                {item.name}
              </Link>
              {item.sizeLabel && <p className="text-sm text-gray-500">Size: {item.sizeLabel}</p>}
              {item.colorName && <p className="text-sm text-gray-500">Color: {item.colorName}</p>}
              {!item.hasSizes && <p className="text-sm text-gray-500">Size: Not Applicable</p>}
              <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
                <input
                  type="number"
                  min={1}
                  max={item.maxStock}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.productId, parseInt(e.target.value, 10) || 1, item.variantId)
                  }
                  className="w-16 rounded border px-2 py-1 text-sm"
                  aria-label="Quantity"
                />
                <span className="font-bold text-paji-orange">{formatPrice(item.price * item.quantity)}</span>
                <button type="button" className="text-sm text-gray-500 hover:text-paji-orange" onClick={() => moveToSaved(item.productId, item.variantId)}>
                  Save for later
                </button>
                <button type="button" className="text-sm text-red-600" onClick={() => removeItem(item.productId, item.variantId)}>
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {savedForLater.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Saved for later</h2>
          <ul className="mt-4 space-y-3">
            {savedForLater.map((item) => (
              <li key={`saved-${item.productId}`} className="flex items-center justify-between rounded-lg border p-3">
                <span>{item.name}</span>
                <button type="button" className="text-sm text-paji-orange" onClick={() => restoreFromSaved(item.productId, item.variantId)}>
                  Move to cart
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 rounded-xl bg-paji-gray-light p-6">
        <div className="flex justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span className="text-paji-orange">{formatPrice(subtotal())}</span>
        </div>
        {loggedIn === false && (
          <p className="mt-4 text-center text-sm text-gray-600">
            You need to{" "}
            <Link href="/account?next=/checkout" className="font-semibold text-paji-orange hover:underline">
              log in
            </Link>{" "}
            before checkout.
          </p>
        )}
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href={loggedIn ? "/checkout" : "/account?next=/checkout"}>Proceed to Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
