"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Product = {
  id: number;
  name: string;
  sku: string;
  stock: number;
  isActive: boolean;
  isDemo: boolean;
  limitedOfferEnabled?: boolean;
  limitedOfferEndsAt?: string | null;
  category?: { name: string } | null;
};

export default function AdminProductsPage() {
  const [list, setList] = useState<Product[]>([]);
  const [offerProduct, setOfferProduct] = useState<Product | null>(null);
  const [offerHours, setOfferHours] = useState("0");
  const [offerMins, setOfferMins] = useState("30");
  const [offerEnabled, setOfferEnabled] = useState(false);
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerError, setOfferError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/products");
    if (res.ok) setList(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  function openOffer(p: Product) {
    setOfferProduct(p);
    setOfferEnabled(!!p.limitedOfferEnabled);
    setOfferHours("0");
    setOfferMins("30");
    setOfferError("");
  }

  function closeOffer() {
    setOfferProduct(null);
    setOfferError("");
  }

  async function saveOffer() {
    if (!offerProduct) return;
    setOfferError("");
    const h = parseInt(offerHours, 10) || 0;
    const m = parseInt(offerMins, 10) || 0;
    if (offerEnabled && h === 0 && m === 0) {
      setOfferError("Set at least 1 minute for the countdown.");
      return;
    }
    setOfferSaving(true);
    const endsAt = offerEnabled ? new Date(Date.now() + (h * 60 + m) * 60 * 1000).toISOString() : null;
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: offerProduct.id,
        limitedOfferEnabled: offerEnabled,
        limitedOfferEndsAt: endsAt,
      }),
    });
    setOfferSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setOfferError(typeof data.error === "string" ? data.error : "Could not save offer.");
      return;
    }
    closeOffer();
    load();
  }

  async function togglePublish(p: Product) {
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
    });
    load();
  }

  async function remove(id: number, name: string) {
    if (!confirm(`Delete "${name}" from the store?`)) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function offerStatus(p: Product) {
    if (!p.limitedOfferEnabled || !p.limitedOfferEndsAt) return "Off";
    const left = new Date(p.limitedOfferEndsAt).getTime() - Date.now();
    if (left <= 0) return "Expired";
    const mins = Math.ceil(left / 60000);
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
    return `${mins}m left`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500">
            Homepage shows latest products. Set a limited-time countdown per product (shown below the product page).
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Limited offer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">
                  {p.name}
                  {p.isDemo && <span className="ml-2 rounded bg-yellow-100 px-1 text-xs">DEMO</span>}
                </td>
                <td className="p-3 text-gray-600">{p.category?.name ?? "—"}</td>
                <td className="p-3">{p.sku}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">
                  <button
                    type="button"
                    className="text-paji-orange hover:underline"
                    onClick={() => openOffer(p)}
                  >
                    {offerStatus(p)}
                  </button>
                </td>
                <td className="p-3">{p.isActive ? "Published" : "Draft"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-paji-orange hover:underline"
                      onClick={() => togglePublish(p)}
                    >
                      {p.isActive ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => remove(p.id, p.name)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No products yet. Add your first shoe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {offerProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Limited time offer</h2>
            <p className="mt-1 text-sm text-gray-500">{offerProduct.name}</p>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={offerEnabled}
                onChange={(e) => setOfferEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Show countdown below this product
            </label>
            {offerEnabled && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-500">Hours</label>
                  <Input
                    type="number"
                    min={0}
                    max={168}
                    value={offerHours}
                    onChange={(e) => setOfferHours(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-500">Minutes</label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={offerMins}
                    onChange={(e) => setOfferMins(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            {offerError && <p className="mt-3 text-sm text-red-600">{offerError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeOffer}>
                Cancel
              </Button>
              <Button type="button" disabled={offerSaving} onClick={saveOffer}>
                {offerSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
