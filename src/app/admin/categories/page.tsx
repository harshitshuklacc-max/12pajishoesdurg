"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
};

export default function AdminCategoriesPage() {
  const [list, setList] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", imagePublicId: "" });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setList(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadImage(file: File, onDone: (url: string, publicId: string) => void) {
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "categories");
    fd.append("type", "image");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Image upload failed. Check Cloudinary settings in .env");
      return;
    }
    onDone(data.url, data.publicId);
    setSuccess("Image uploaded successfully");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create category");
      return;
    }
    setForm({ name: "", description: "", imageUrl: "", imagePublicId: "" });
    setSuccess("Category created");
    load();
  }

  async function updateCategoryImage(cat: Category, file: File) {
    await uploadImage(file, async (imageUrl, imagePublicId) => {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, imageUrl, imagePublicId }),
      });
      if (res.ok) {
        setSuccess(`Image updated for ${cat.name}`);
        load();
      } else {
        setError("Failed to save category image");
      }
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="mt-1 text-sm text-gray-500">Upload images — they appear on the homepage and category pages.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{success}</p>}

      <form onSubmit={create} className="mt-6 max-w-lg space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <Input placeholder="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="rounded-lg border border-dashed border-paji-orange/40 bg-paji-orange/5 p-4">
          <p className="text-sm font-semibold text-paji-charcoal">Category image</p>
          <p className="text-xs text-gray-500">JPG, PNG or WebP — max 5MB</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="mt-2 block w-full text-sm"
            onChange={(e) =>
              e.target.files?.[0] &&
              uploadImage(e.target.files[0], (imageUrl, imagePublicId) =>
                setForm((f) => ({ ...f, imageUrl, imagePublicId }))
              )
            }
          />
          {uploading && <p className="mt-2 text-sm text-paji-orange">Uploading to Cloudinary...</p>}
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Preview" className="mt-3 h-32 w-full rounded-lg object-cover" />
          )}
        </div>
        <Button type="submit" disabled={uploading}>
          Add category
        </Button>
      </form>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {list.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="relative aspect-[16/10] bg-paji-gray-light">
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-gray-400">
                  <span>No image on storefront</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-gray-500">/{c.slug}</p>
              <p className="mt-1 text-sm text-gray-600">{c.isActive ? "Active" : "Inactive"}</p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-paji-orange px-3 py-2 text-xs font-semibold text-white hover:bg-paji-orange-dark">
                {c.imageUrl ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && updateCategoryImage(c, e.target.files[0])}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
