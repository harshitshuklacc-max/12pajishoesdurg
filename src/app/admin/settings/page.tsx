"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Settings = {
  storeName: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  businessDescription: string;
  storeHours: string;
  shippingFlatRate: number;
  freeShippingAbove: number;
  codCourierCharge: number;
  taxPercent: number;
  seoSiteTitle: string;
  seoSiteDescription: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [hero, setHero] = useState({ heading: "", description: "", ctaPrimary: "", ctaSecondary: "" });
  const [glimpsesTitle, setGlimpsesTitle] = useState("OUR GLIMPSES");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        if (d.hero?.content) setHero(d.hero.content);
        if (d.glimpses?.title) setGlimpsesTitle(d.glimpses.title);
      });
  }, []);

  async function save() {
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings, hero, glimpses: { title: glimpsesTitle, isEnabled: true } }),
    });
    alert("Settings saved");
  }

  if (!settings) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Website Settings</h1>
        <p className="text-sm text-gray-500">Business info, shipping, tax, SEO, and homepage content</p>
      </div>

      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Store information</h2>
        {(["storeName", "phone", "email", "address", "instagram", "businessDescription", "storeHours"] as const).map((key) => (
          <Input
            key={key}
            placeholder={key}
            value={settings[key]}
            onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
          />
        ))}
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Shipping & tax</h2>
        <Input type="number" placeholder="Flat shipping rate" value={settings.shippingFlatRate} onChange={(e) => setSettings({ ...settings, shippingFlatRate: parseFloat(e.target.value) || 0 })} />
        <Input type="number" placeholder="Free shipping above" value={settings.freeShippingAbove} onChange={(e) => setSettings({ ...settings, freeShippingAbove: parseFloat(e.target.value) || 0 })} />
        <Input
          type="number"
          placeholder="COD courier charge (₹)"
          value={settings.codCourierCharge ?? 200}
          onChange={(e) => setSettings({ ...settings, codCourierCharge: parseFloat(e.target.value) || 0 })}
        />
        <p className="text-xs text-gray-500">Added to every Cash on Delivery order (includes courier).</p>
        <Input type="number" placeholder="Tax %" value={settings.taxPercent} onChange={(e) => setSettings({ ...settings, taxPercent: parseFloat(e.target.value) || 0 })} />
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">SEO</h2>
        <Input value={settings.seoSiteTitle} onChange={(e) => setSettings({ ...settings, seoSiteTitle: e.target.value })} placeholder="Site title" />
        <textarea className="w-full rounded border p-2 text-sm" value={settings.seoSiteDescription} onChange={(e) => setSettings({ ...settings, seoSiteDescription: e.target.value })} placeholder="Site description" />
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Homepage hero</h2>
        <Input value={hero.heading} onChange={(e) => setHero({ ...hero, heading: e.target.value })} placeholder="Hero heading" />
        <textarea className="w-full rounded border p-2 text-sm" value={hero.description} onChange={(e) => setHero({ ...hero, description: e.target.value })} />
        <Input value={hero.ctaPrimary} onChange={(e) => setHero({ ...hero, ctaPrimary: e.target.value })} placeholder="Primary CTA" />
        <Input value={hero.ctaSecondary} onChange={(e) => setHero({ ...hero, ctaSecondary: e.target.value })} placeholder="Secondary CTA" />
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Our Glimpses section title</h2>
        <Input value={glimpsesTitle} onChange={(e) => setGlimpsesTitle(e.target.value)} />
      </section>

      <Button onClick={save}>Save all settings</Button>
    </div>
  );
}
