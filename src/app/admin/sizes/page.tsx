"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SizeRow = { id: number; label: string; system: string; sortOrder: number };

export default function AdminSizesPage() {
  const [list, setList] = useState<SizeRow[]>([]);
  const [label, setLabel] = useState("");
  const [system, setSystem] = useState("india");
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/sizes");
    if (res.ok) setList(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/sizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, system, sortOrder: parseInt(sortOrder, 10) || 0 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add size");
      return;
    }
    setLabel("");
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this size?")) return;
    await fetch("/api/admin/sizes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Sizes</h1>
      <p className="mt-1 text-sm text-gray-500">Used when creating products with sizes (India, UK, US, EU, custom).</p>

      <form onSubmit={add} className="mt-6 space-y-3 rounded-xl border bg-white p-5 shadow-sm">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Input placeholder="Size label (e.g. 8, 9, 10)" value={label} onChange={(e) => setLabel(e.target.value)} required />
        <select className="w-full rounded-md border px-3 py-2 text-sm" value={system} onChange={(e) => setSystem(e.target.value)}>
          <option value="india">India</option>
          <option value="uk">UK</option>
          <option value="us">US</option>
          <option value="eu">EU</option>
          <option value="custom">Custom</option>
        </select>
        <Input type="number" placeholder="Sort order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        <Button type="submit">Add size</Button>
      </form>

      <ul className="mt-8 divide-y rounded-xl border bg-white">
        {list.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              <strong>{s.label}</strong>
              <span className="ml-2 text-gray-500 uppercase">{s.system}</span>
            </span>
            <button type="button" className="text-red-600 hover:underline" onClick={() => remove(s.id)}>
              Delete
            </button>
          </li>
        ))}
        {!list.length && <li className="px-4 py-8 text-center text-gray-400">No sizes yet</li>}
      </ul>
    </div>
  );
}
