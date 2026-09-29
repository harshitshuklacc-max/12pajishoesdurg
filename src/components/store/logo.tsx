import Link from "next/link";

import { OptimizedImage } from "@/components/ui/optimized-image";

import type { StoreSettings } from "@/lib/settings";



export function StoreLogo({

  settings,

  variant = "default",

  className = "",

  showWordmark = true,

}: {

  settings: Pick<StoreSettings, "storeName" | "logoUrl" | "logoPublicId" | "logoMobileUrl">;

  variant?: "default" | "mobile" | "footer" | "luxury";

  className?: string;

  showWordmark?: boolean;

}) {

  const mobileSrc = settings.logoMobileUrl || settings.logoUrl;

  const showMobile = variant === "mobile" && mobileSrc;

  const hasLogo = !!(settings.logoUrl || settings.logoPublicId);



  if (variant === "luxury" && showWordmark) {

    return (

      <Link

        href="/"

        className={`group flex shrink-0 items-center gap-2 sm:gap-3 ${className}`}

        aria-label={`${settings.storeName} home`}

      >

        <span className="hidden text-right leading-none sm:block">

          <span className="font-serif text-lg font-semibold uppercase tracking-[0.12em] text-paji-deep md:text-xl">Paji</span>

        </span>

        {hasLogo ? (

          <OptimizedImage

            src={settings.logoUrl}

            publicId={settings.logoPublicId || undefined}

            alt=""

            preset="thumbnail"

            className="h-11 w-11 rounded-xl object-cover ring-2 ring-paji-gold/30 shadow-sm transition group-hover:ring-paji-orange/40 sm:h-12 sm:w-12"

            priority

          />

        ) : (

          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-paji-orange/10 text-lg ring-2 ring-paji-gold/30 sm:h-12 sm:w-12">

            👟

          </span>

        )}

        <span className="hidden text-left leading-none sm:block">

          <span className="font-serif text-lg font-semibold uppercase tracking-[0.12em] text-paji-orange md:text-xl">Shoes</span>

        </span>

        <span className="font-serif text-base font-semibold uppercase tracking-wide text-paji-deep sm:hidden">Paji Shoes</span>

      </Link>

    );

  }



  return (

    <Link

      href="/"

      className={`group flex shrink-0 items-center gap-2.5 sm:gap-3 ${className}`}

      aria-label={`${settings.storeName} home`}

    >

      {hasLogo ? (

        <OptimizedImage

          src={showMobile ? mobileSrc : settings.logoUrl}

          publicId={!showMobile && settings.logoPublicId ? settings.logoPublicId : undefined}

          alt=""

          preset="thumbnail"

          className="h-11 w-11 rounded-xl object-cover ring-2 ring-paji-gold/25 sm:h-12 sm:w-12"

          priority

        />

      ) : (

        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-paji-orange/10 text-lg ring-2 ring-paji-orange/30 sm:h-12 sm:w-12">

          👟

        </span>

      )}

      {showWordmark && (

        <span className="font-serif text-sm font-semibold uppercase leading-none tracking-[0.1em] sm:text-lg">

          <span className="text-paji-deep">Paji </span>

          <span className="text-paji-orange">Shoes</span>

        </span>

      )}

    </Link>

  );

}


