"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RatingRow = {
  id: number;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

type Summary = { average: number; count: number };

function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span className="inline-flex gap-0.5 text-paji-gold" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${cls} ${n <= Math.round(value) ? "fill-current" : "fill-none opacity-35"}`} />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="rounded p-0.5 text-paji-gold transition hover:scale-110"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star className={`h-8 w-8 ${n <= value ? "fill-current" : "fill-none opacity-35"}`} />
        </button>
      ))}
    </div>
  );
}

export function ProductRatings({ productId }: { productId: number }) {
  const [summary, setSummary] = useState<Summary>({ average: 0, count: 0 });
  const [list, setList] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [alreadyRated, setAlreadyRated] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/ratings`);
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setList(data.ratings);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
    try {
      setAlreadyRated(localStorage.getItem(`paji_rated_${productId}`) === "1");
    } catch {
      setAlreadyRated(false);
    }
  }, [load, productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerName: name.trim(), rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit rating.");
        return;
      }
      setSummary(data.summary);
      setList(data.ratings);
      setSuccess(true);
      setComment("");
      setRating(0);
      try {
        localStorage.setItem(`paji_rated_${productId}`, "1");
      } catch {
        /* ignore */
      }
      setAlreadyRated(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 border-t pt-8">
      <h2 className="text-lg font-semibold">Customer ratings</h2>
      {loading ? (
        <p className="mt-3 text-sm text-gray-500">Loading ratings…</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Stars value={summary.average} />
          <span className="text-sm text-gray-600">
            {summary.count > 0 ? (
              <>
                <span className="font-semibold text-paji-charcoal">{summary.average.toFixed(1)}</span> out of 5 ·{" "}
                {summary.count} review{summary.count === 1 ? "" : "s"}
              </>
            ) : (
              "No ratings yet — be the first to review this product."
            )}
          </span>
        </div>
      )}

      {!alreadyRated && (
        <form onSubmit={submit} className="mt-8 max-w-lg space-y-4 rounded-xl border border-black/5 bg-paji-cream/50 p-5">
          <p className="text-sm font-semibold text-paji-charcoal">Rate this product</p>
          <StarPicker value={rating} onChange={setRating} />
          <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <textarea
            placeholder="Optional comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">Thank you for your rating!</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit rating"}
          </Button>
        </form>
      )}

      {alreadyRated && !success && (
        <p className="mt-4 text-sm text-gray-500">You have already rated this product from this device.</p>
      )}

      {list.length > 0 && (
        <ul className="mt-8 space-y-4">
          {list.map((r) => (
            <li key={r.id} className="rounded-lg border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-paji-charcoal">{r.reviewerName}</span>
                <Stars value={r.rating} size="sm" />
              </div>
              {r.comment && <p className="mt-2 text-sm leading-relaxed text-gray-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
