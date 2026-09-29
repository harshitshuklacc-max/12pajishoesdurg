"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ColorRow = { id: number; name: string; hexCode: string | null; swatchUrl: string | null };

export default function AdminColorsPage() {
  const [list, setList] = useState<ColorRow[]>([]);
  const [name, setName] = useState("");
  const [hexCode, setHexCode] = useState("#000000");
  const [swatchUrl, setSwatchUrl] = useState("");
  const [swatchPublicId, setSwatchPublicId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/colors");
    if (res.ok) setList(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadSwatch(file: File) {
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "colors");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed. Check Cloudinary keys in .env");
      return;
    }
    setSwatchUrl(data.url);
    setSwatchPublicId(data.publicId);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/colors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, hexCode, swatchUrl: swatchUrl || undefined, swatchPublicId: swatchPublicId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add color");
      return;
    }
    setName("");
    setSwatchUrl("");
    setSwatchPublicId("");
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this color?")) return;
    await fetch("/api/admin/colors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Colors</h1>
      <p className="mt-1 text-sm text-gray-500">Assign colors when products use optional color variants.</p>

      <form onSubmit={add} className="mt-6 space-y-3 rounded-xl border bg-white p-5 shadow-sm">
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <Input placeholder="Color name (e.g. Black)" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Hex</label>
          <input type="color" value={hexCode} onChange={(e) => setHexCode(e.target.value)} className="h-10 w-14 cursor-pointer rounded border" />
          <Input value={hexCode} onChange={(e) => setHexCode(e.target.value)} className="flex-1" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Swatch image (optional)</p>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadSwatch(e.target.files[0])} />
          {uploading && <p className="text-xs text-gray-500">Uploading...</p>}
          {swatchUrl && <img src={swatchUrl} alt="" className="mt-2 h-12 w-12 rounded-full border object-cover" />}
        </div>
        <Button type="submit">Add color</Button>
      </form>

      <ul className="mt-8 divide-y rounded-xl border bg-white">
        {list.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-3">
              {c.swatchUrl ? (
                <img src={c.swatchUrl} alt="" className="h-8 w-8 rounded-full border object-cover" />
              ) : c.hexCode ? (
                <span className="h-8 w-8 rounded-full border" style={{ backgroundColor: c.hexCode }} />
              ) : null}
              <strong>{c.name}</strong>
              {c.hexCode && <span className="text-gray-500">{c.hexCode}</span>}
            </span>
            <button type="button" className="text-red-600 hover:underline" onClick={() => remove(c.id)}>
              Delete
            </button>
          </li>
        ))}
        {!list.length && <li className="px-4 py-8 text-center text-gray-400">No colors yet</li>}
      </ul>
    </div>
  );
}
