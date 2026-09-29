import Link from "next/link";
import { Instagram } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { HeroContent } from "@/lib/homepage";
import type { StoreSettings } from "@/lib/settings";

export function BrandHero({
  settings,
  hero,
}: {
  settings: StoreSettings;
  hero: HeroContent;
}) {
  const hasLogo = !!(settings.logoUrl || settings.logoPublicId);

  return (
    <section className="relative w-full overflow-hidden bg-paji-deep text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(249,115,22,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full bg-paji-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-paji-orange/15 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 py-14 text-center md:py-20 lg:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-paji-gold/90">
          Premium footwear · Durg, Chhattisgarh
        </p>

        <div className="mx-auto mt-6 flex justify-center">
          <div className="inline-flex rounded-2xl border-2 border-paji-gold/40 bg-gradient-to-br from-white/10 to-black/20 p-1.5 shadow-2xl ring-1 ring-white/10">
            {hasLogo ? (
              <OptimizedImage
                src={settings.logoUrl}
                publicId={settings.logoPublicId || undefined}
                alt={settings.storeName}
                preset="logo"
                className="block h-auto w-[9.5rem] max-h-[9.5rem] rounded-xl object-contain sm:w-[11rem] sm:max-h-[11rem]"
                priority
              />
            ) : (
              <div className="flex h-[9.5rem] w-[9.5rem] items-center justify-center rounded-xl bg-paji-charcoal/50 text-4xl sm:h-[11rem] sm:w-[11rem] sm:text-5xl">
                👟
              </div>
            )}
          </div>
        </div>

        <h1 className="font-serif mt-8 text-4xl font-semibold uppercase tracking-[0.06em] md:text-5xl lg:text-6xl">
          {settings.storeName}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-white/85 md:text-xl">{hero.description}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-paji-orange px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-paji-orange-dark"
          >
            🛍 {hero.ctaPrimary}
          </Link>
          <Link
            href="/categories"
            className="inline-flex min-w-[160px] items-center justify-center rounded-full border border-white/35 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
          >
            ✨ {hero.ctaSecondary}
          </Link>
        </div>

        {settings.instagram && (
          <a
            href={settings.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-paji-gold"
          >
            <Instagram className="h-4 w-4" /> Follow on Instagram
          </a>
        )}
      </div>
    </section>
  );
}
