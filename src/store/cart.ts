"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: number;
  variantId?: number | null;
  slug: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  sizeLabel?: string | null;
  colorName?: string | null;
  hasSizes: boolean;
  hasColors: boolean;
  maxStock: number;
};

type CartState = {
  items: CartItem[];
  savedForLater: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, variantId?: number | null) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number | null) => void;
  moveToSaved: (productId: number, variantId?: number | null) => void;
  restoreFromSaved: (productId: number, variantId?: number | null) => void;
  clear: () => void;
  subtotal: () => number;
};

function itemKey(productId: number, variantId?: number | null) {
  return `${productId}-${variantId ?? "base"}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],
      addItem: (item) => {
        set((state) => {
          const key = itemKey(item.productId, item.variantId);
          const existing = state.items.find(
            (i) => itemKey(i.productId, i.variantId) === key
          );
          if (existing) {
            const qty = Math.min(existing.quantity + item.quantity, item.maxStock);
            return {
              items: state.items.map((i) =>
                itemKey(i.productId, i.variantId) === key ? { ...i, quantity: qty, price: item.price } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (productId, variantId) => {
        const key = itemKey(productId, variantId);
        set((state) => ({
          items: state.items.filter((i) => itemKey(i.productId, i.variantId) !== key),
        }));
      },
      updateQuantity: (productId, quantity, variantId) => {
        const key = itemKey(productId, variantId);
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.productId, i.variantId) === key
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
              : i
          ),
        }));
      },
      moveToSaved: (productId, variantId) => {
        const key = itemKey(productId, variantId);
        set((state) => {
          const item = state.items.find((i) => itemKey(i.productId, i.variantId) === key);
          if (!item) return state;
          return {
            items: state.items.filter((i) => itemKey(i.productId, i.variantId) !== key),
            savedForLater: [...state.savedForLater, item],
          };
        });
      },
      restoreFromSaved: (productId, variantId) => {
        const key = itemKey(productId, variantId);
        set((state) => {
          const item = state.savedForLater.find((i) => itemKey(i.productId, i.variantId) === key);
          if (!item) return state;
          return {
            savedForLater: state.savedForLater.filter((i) => itemKey(i.productId, i.variantId) !== key),
            items: [...state.items, item],
          };
        });
      },
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    { name: "paji-cart" }
  )
);
