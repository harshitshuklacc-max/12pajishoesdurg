"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

type OrderItem = {
  productName: string;
  quantity: number;
  sizeLabel: string | null;
  colorName: string | null;
};

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  status: string;
  paymentMethod?: string;
  shippingAmount?: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
};

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

export default function AdminOrdersPage() {
  const [list, setList] = useState<Order[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (res.ok) setList(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: number, status: string) {
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="text-sm text-gray-500">Customer phone, address and products for each order.</p>
      <div className="mt-4 flex gap-2">
        <input
          className="rounded border px-3 py-2 text-sm"
          placeholder="Search order #, mobile, name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className="rounded bg-paji-orange px-4 py-2 text-sm text-white" onClick={load}>
          Search
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {list.map((o) => (
          <div key={o.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
              <div>
                <p className="font-bold text-paji-charcoal">{o.orderNumber}</p>
                <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString("en-IN")}</p>
                {o.paymentMethod === "cod" && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                    COD
                    {o.shippingAmount && parseFloat(o.shippingAmount) > 0
                      ? ` · courier ${formatPrice(o.shippingAmount)}`
                      : ""}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-paji-orange">{formatPrice(o.total)}</p>
                <select
                  className="mt-1 rounded border px-2 py-1 text-xs capitalize"
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</p>
                <p className="mt-1 font-medium">{o.customerName}</p>
                <a href={`tel:${o.customerMobile}`} className="text-sm text-paji-orange hover:underline">
                  {o.customerMobile}
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery address</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">
                  {o.shippingAddress}
                  <br />
                  {o.shippingCity}, {o.shippingState} — {o.shippingPincode}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Products</p>
              <ul className="mt-2 space-y-1 text-sm">
                {o.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-2 rounded-md bg-gray-50 px-3 py-2">
                    <span>
                      {item.productName}
                      {item.sizeLabel && <span className="text-gray-500"> · Size {item.sizeLabel}</span>}
                      {item.colorName && <span className="text-gray-500"> · {item.colorName}</span>}
                    </span>
                    <span className="shrink-0 font-medium">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={`/order/invoice/${o.orderNumber}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-paji-orange hover:underline"
            >
              Print invoice →
            </a>
          </div>
        ))}
        {!list.length && <p className="py-12 text-center text-gray-400">No orders yet</p>}
      </div>
    </div>
  );
}
