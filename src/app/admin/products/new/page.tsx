"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Category = { id: number; name: string };
type MasterSize = { id: number; label: string };
type MasterColor = { id: number; name: string; hexCode: string | null };

function TapChip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-12 min-w-12 rounded-xl border-2 px-4 py-3 text-base font-semibold transition-all active:scale-95",
        selected
          ? "border-paji-orange bg-paji-orange text-white shadow-md"
          : "border-gray-200 bg-white text-paji-charcoal hover:border-paji-orange/50",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<MasterSize[]>([]);
  const [colors, setColors] = useState<MasterColor[]>([]);
  const [hasSizes, setHasSizes] = useState(false);
  const [hasColors, setHasColors] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<number[]>([]);
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    brand: "",
    description: "",
    sellingPrice: "",
    mrpPrice: "",
    stock: "10",
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/admin/sizes").then((r) => r.json()).then(setSizes).catch(() => {});
    fetch("/api/admin/colors").then((r) => r.json()).then(setColors).catch(() => {});
  }, []);

  function toggleSize(id: number) {
    setSelectedSizes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleColor(id: number) {
    setSelectedColors((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "products");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setImages((imgs) => [...imgs, data]);
  }

  function goNext() {
    setError("");
    if (step === 2 && !form.categoryId) {
      setError("Please select a category.");
      return;
    }
    if (step === 5 && hasSizes && selectedSizes.length === 0) {
      setError("Tap at least one size, or choose NO for sizes.");
      return;
    }
    if (step === 6 && hasColors && selectedColors.length === 0) {
      setError("Tap at least one color, or choose NO for colors.");
      return;
    }
    if (step === 7) {
      const qty = parseInt(form.stock, 10);
      if (!qty || qty < 1) {
        setError("Enter stock quantity (minimum 1 pair).");
        return;
      }
    }
    setStep((s) => s + 1);
  }

  async function submit() {
    setError("");
    if (!form.categoryId) {
      setError("Please select a category (Step 2).");
      setStep(2);
      return;
    }
    const qty = parseInt(form.stock, 10);
    if (!qty || qty < 1) {
      setError("Enter stock quantity.");
      setStep(7);
      return;
    }

    const payload = {
      name: form.name,
      sku: form.sku,
      categoryId: parseInt(form.categoryId, 10),
      brand: form.brand,
      description: form.description,
      sellingPrice: parseFloat(form.sellingPrice),
      mrpPrice: form.mrpPrice ? parseFloat(form.mrpPrice) : undefined,
      stock: qty,
      hasSizes,
      hasColors,
      sizeIds: hasSizes ? selectedSizes : [],
      colorIds: hasColors ? selectedColors : [],
      images: images.map((img, i) => ({ ...img, isPrimary: i === 0 })),
      isDemo: false,
      isActive: true,
      isFeatured: true,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      variants:
        hasSizes || hasColors
          ? buildVariants(parseFloat(form.sellingPrice), qty)
          : undefined,
    };
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) router.push("/admin/products");
    else setError(typeof data.error === "string" ? data.error : "Could not save product.");
  }

  function buildVariants(price: number, stock: number) {
    const variants: { sku: string; sizeId?: number | null; colorId?: number | null; stock: number; sellingPrice: number }[] = [];
    if (hasSizes && hasColors) {
      for (const s of selectedSizes) {
        for (const c of selectedColors) {
          variants.push({ sku: `${form.sku}-${s}-${c}`, sizeId: s, colorId: c, stock, sellingPrice: price });
        }
      }
    } else if (hasSizes) {
      for (const s of selectedSizes) {
        variants.push({ sku: `${form.sku}-${s}`, sizeId: s, colorId: null, stock, sellingPrice: price });
      }
    } else if (hasColors) {
      for (const c of selectedColors) {
        variants.push({ sku: `${form.sku}-${c}`, sizeId: null, colorId: c, stock, sellingPrice: price });
      }
    }
    return variants;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Add product</h1>
      <p className="text-sm text-gray-500">Step {step} of 9 — tap sizes/colors once to select</p>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {step === 1 && (
        <div className="mt-4 space-y-3">
          <Input placeholder="Product name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <Input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <textarea className="w-full rounded border p-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Category *</p>
          <select className="w-full rounded-lg border p-3 text-base" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Tap to select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Product photos</p>
          <input type="file" accept="image/*" multiple onChange={(e) => Array.from(e.target.files || []).forEach(upload)} />
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <img key={img.publicId} src={img.url} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-4 space-y-3">
          <Input type="number" placeholder="Selling price (₹) *" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          <Input type="number" placeholder="MRP (₹)" value={form.mrpPrice} onChange={(e) => setForm({ ...form, mrpPrice: e.target.value })} />
        </div>
      )}

      {step === 5 && (
        <div className="mt-4 space-y-4">
          <p className="font-medium">Does this product have sizes?</p>
          <div className="flex gap-3">
            <TapChip selected={hasSizes} onClick={() => setHasSizes(true)} className="flex-1">YES</TapChip>
            <TapChip selected={!hasSizes} onClick={() => { setHasSizes(false); setSelectedSizes([]); }} className="flex-1">NO</TapChip>
          </div>
          {hasSizes && (
            <>
              <p className="text-sm text-gray-600">Single tap to select sizes (tap again to remove)</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <TapChip key={s.id} selected={selectedSizes.includes(s.id)} onClick={() => toggleSize(s.id)}>
                    {s.label}
                  </TapChip>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {step === 6 && (
        <div className="mt-4 space-y-4">
          <p className="font-medium">Does this product have colors?</p>
          <div className="flex gap-3">
            <TapChip selected={hasColors} onClick={() => setHasColors(true)} className="flex-1">YES</TapChip>
            <TapChip selected={!hasColors} onClick={() => { setHasColors(false); setSelectedColors([]); }} className="flex-1">NO</TapChip>
          </div>
          {hasColors && (
            <>
              <p className="text-sm text-gray-600">Single tap to select colors</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <TapChip key={c.id} selected={selectedColors.includes(c.id)} onClick={() => toggleColor(c.id)}>
                    <span className="inline-flex items-center gap-2">
                      {c.hexCode && <span className="h-4 w-4 rounded-full border border-white/50" style={{ backgroundColor: c.hexCode }} />}
                      {c.name}
                    </span>
                  </TapChip>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {step === 7 && (
        <div className="mt-4 space-y-3 rounded-xl border border-paji-orange/30 bg-paji-orange/5 p-5">
          <p className="text-lg font-semibold text-paji-charcoal">Stock quantity *</p>
          <p className="text-sm text-gray-600">
            {hasSizes || hasColors
              ? "This quantity applies to each size/color combination."
              : "Total pairs available in stock."}
          </p>
          <Input
            type="number"
            min={1}
            placeholder="How many pairs in stock?"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="text-lg font-semibold"
          />
        </div>
      )}

      {step === 8 && (
        <div className="mt-4 space-y-3">
          <Input placeholder="SEO title" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          <textarea className="w-full rounded border p-2 text-sm" placeholder="SEO description" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
        </div>
      )}

      {step === 9 && (
        <div className="mt-4 space-y-2 rounded-lg border bg-green-50 p-4 text-sm">
          <p className="font-semibold">Ready to publish</p>
          <p>Quantity: <strong>{form.stock}</strong> pairs</p>
          {hasSizes && <p>Sizes: {selectedSizes.length} selected</p>}
          {hasColors && <p>Colors: {selectedColors.length} selected</p>}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        {step < 9 ? (
          <Button type="button" onClick={goNext}>
            Next
          </Button>
        ) : (
          <Button type="button" onClick={submit}>
            Publish product
          </Button>
        )}
      </div>
    </div>
  );
}
