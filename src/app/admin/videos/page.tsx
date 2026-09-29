"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Video = {
  id: number;
  title: string;
  description: string | null;
  videoUrl: string;
  videoPublicId: string | null;
  thumbnailUrl: string | null;
  thumbnailPublicId: string | null;
  isActive: boolean;
  displayOrder: number;
};

type UploadKind = "video" | "thumbnail" | null;

const emptyForm = {
  title: "",
  description: "",
  videoUrl: "",
  videoPublicId: "",
  thumbnailUrl: "",
  thumbnailPublicId: "",
};

export default function AdminVideosPage() {
  const [list, setList] = useState<Video[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState<UploadKind>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    const res = await fetch("/api/admin/videos");
    if (!res.ok) {
      setError("Could not load videos.");
      return;
    }
    setList(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadFile(file: File, type: "image" | "video", field: "video" | "thumbnail") {
    setUploading(field);
    setError("");
    setSuccess("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "videos");
    fd.append("type", type);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed. Check Cloudinary settings in .env");
        return;
      }
      if (field === "video") {
        setForm((f) => ({ ...f, videoUrl: data.url, videoPublicId: data.publicId }));
        setSuccess("Video uploaded — add a title and save.");
      } else {
        setForm((f) => ({ ...f, thumbnailUrl: data.url, thumbnailPublicId: data.publicId }));
        setSuccess("Thumbnail uploaded.");
      }
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(null);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.videoUrl) {
      setError("Upload a video file first.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          videoUrl: form.videoUrl,
          videoPublicId: form.videoPublicId || undefined,
          thumbnailUrl: form.thumbnailUrl || undefined,
          thumbnailPublicId: form.thumbnailPublicId || undefined,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save video.");
        return;
      }
      setForm(emptyForm);
      setSuccess(`"${data.title}" added to Our Glimpses.`);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(v: Video) {
    setError("");
    const res = await fetch("/api/admin/videos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id, isActive: !v.isActive }),
    });
    if (!res.ok) {
      setError("Could not update video status.");
      return;
    }
    await load();
  }

  async function removeVideo(v: Video) {
    if (!confirm(`Delete "${v.title}" from Our Glimpses? This cannot be undone.`)) return;
    setDeletingId(v.id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: v.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not delete video.");
        return;
      }
      setSuccess(`"${v.title}" deleted.`);
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Our Glimpses — Videos</h1>
      <p className="mt-1 text-sm text-gray-500">
        Upload MP4 or WebM clips (max 50MB). Videos show below the hero; the &quot;Our Glimpses&quot; heading sits under Shop by Category.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{success}</p>}

      <form onSubmit={create} className="mt-6 space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <Input
          placeholder="Title (shown on homepage)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Short description (optional)"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="rounded-lg border border-dashed border-paji-orange/40 bg-paji-orange/5 p-4">
          <p className="text-sm font-semibold text-paji-charcoal">Video file *</p>
          <p className="text-xs text-gray-500">MP4, WebM, or MOV — max 50MB</p>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            className="mt-2 block w-full text-sm"
            disabled={uploading === "video"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file, "video", "video");
              e.target.value = "";
            }}
          />
          {uploading === "video" && (
            <p className="mt-2 flex items-center gap-2 text-sm text-paji-orange">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading video… this may take a minute on slow connections.
            </p>
          )}
          {form.videoUrl && (
            <video src={form.videoUrl} controls className="mt-3 max-h-48 w-full rounded-lg bg-black" />
          )}
        </div>

        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-paji-charcoal">Thumbnail (optional)</p>
          <p className="text-xs text-gray-500">JPG, PNG or WebP — max 5MB</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="mt-2 block w-full text-sm"
            disabled={uploading === "thumbnail"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file, "image", "thumbnail");
              e.target.value = "";
            }}
          />
          {uploading === "thumbnail" && (
            <p className="mt-2 flex items-center gap-2 text-sm text-paji-orange">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading thumbnail…
            </p>
          )}
          {form.thumbnailUrl && (
            <img src={form.thumbnailUrl} alt="" className="mt-3 h-28 w-full rounded-lg object-cover" />
          )}
        </div>

        <Button type="submit" disabled={!form.videoUrl || saving || uploading !== null}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Add to Our Glimpses"
          )}
        </Button>
      </form>

      <div className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">Published videos ({list.length})</h2>
        {list.length === 0 ? (
          <p className="text-sm text-gray-500">No videos yet. Upload one above.</p>
        ) : (
          list.map((v) => (
            <div key={v.id} className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row">
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-black sm:w-48">
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={v.videoUrl} className="h-full w-full object-cover" muted playsInline />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-semibold">{v.title}</p>
                {v.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{v.description}</p>}
                <p className="mt-2 text-xs text-gray-500">
                  {v.isActive ? "Visible on homepage" : "Hidden"} · Order {v.displayOrder}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleActive(v)}>
                    {v.isActive ? "Hide" : "Show on site"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={deletingId === v.id}
                    onClick={() => removeVideo(v)}
                  >
                    {deletingId === v.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
