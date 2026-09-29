"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminBrandingPage() {
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPublicId, setLogoPublicId] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/branding")
      .then((r) => r.json())
      .then((d) => {
        setLogoUrl(d.logoUrl || "");
        setLogoPublicId(d.logoPublicId || "");
        setFaviconUrl(d.faviconUrl || "");
      });
  }, []);

  async function uploadLogo(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "branding");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setLogoUrl(data.url);
      setLogoPublicId(data.publicId);
    }
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl, logoPublicId }),
    });
    const refreshed = await fetch("/api/admin/branding").then((r) => r.json());
    setFaviconUrl(refreshed.faviconUrl || "");
    setSaving(false);
    alert("Branding updated. Logo applies across site, checkout, and invoices.");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Branding</h1>
      <p className="mt-1 text-sm text-gray-500">Upload logo — used in navbar, footer, login, checkout, invoices, and favicon.</p>
      <div className="mt-6 space-y-4 rounded-xl border bg-white p-5">
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
        {logoUrl && <img src={logoUrl} alt="Logo preview" className="h-16 object-contain" />}
        {faviconUrl && (
          <div className="flex items-center gap-2 text-sm">
            <img src={faviconUrl} alt="Favicon" className="h-8 w-8" />
            <span>Favicon auto-generated from logo</span>
          </div>
        )}
        <Button onClick={save} disabled={saving || !logoUrl}>
          {saving ? "Saving..." : "Save branding"}
        </Button>
      </div>
    </div>
  );
}
