import Link from "next/link";

import { db } from "@/db";

import { categories, videos } from "@/db/schema";

import { and, asc, eq } from "drizzle-orm";

import { BrandHero } from "@/components/home/brand-hero";

import { GlimpsesSection } from "@/components/home/glimpses-section";

import { GlimpsesIntro } from "@/components/home/glimpses-intro";

import { ShopByCategorySection } from "@/components/home/shop-by-category-section";

import { TrustSections } from "@/components/home/trust-sections";

import { ProductCard } from "@/components/store/product-card";

import { getHeroContent, getSectionMeta } from "@/lib/homepage";

import { getHomepageCatalog, mapProductToCard } from "@/lib/products";

import { getStoreSettings } from "@/lib/settings";



export const dynamic = "force-dynamic";



export default async function HomePage() {

  const [hero, settings, glimpsesMeta, activeVideos, cats, catalog] =

    await Promise.all([

      getHeroContent(),

      getStoreSettings(),

      getSectionMeta("glimpses"),

      db.query.videos

        .findMany({

          where: eq(videos.isActive, true),

          orderBy: [asc(videos.displayOrder)],

          limit: 12,

        })

        .catch(() => []),

      db.query.categories

        .findMany({

          where: and(eq(categories.isActive, true)),

          orderBy: [asc(categories.displayOrder)],

        })

        .catch(() => []),

      getHomepageCatalog(10).catch(() => []),

    ]);



  const glimpsesTitle = glimpsesMeta?.title || "Our Glimpses";

  const glimpsesEnabled = glimpsesMeta?.isEnabled !== false;



  const orgJsonLd = {

    "@context": "https://schema.org",

    "@type": "ShoeStore",

    name: settings.storeName,

    description: settings.businessDescription,

    telephone: settings.phone,

    address: {

      "@type": "PostalAddress",

      streetAddress: settings.address,

      addressLocality: "Durg",

      addressRegion: "Chhattisgarh",

      postalCode: "491001",

      addressCountry: "IN",

    },

    sameAs: settings.instagram ? [settings.instagram] : [],

  };



  return (

    <>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />



      <BrandHero settings={settings} hero={hero} />



      {glimpsesEnabled && activeVideos.length > 0 && (

        <GlimpsesSection

          showCopy={false}

          videos={activeVideos.map((v) => ({

            id: v.id,

            title: v.title,

            description: v.description,

            videoUrl: v.videoUrl,

            thumbnailUrl: v.thumbnailUrl,

            autoplay: v.autoplay,

            loop: v.loop,

          }))}

        />

      )}



      {catalog.length > 0 && (

        <section className="border-t border-black/5 bg-white py-16 md:py-24">

          <div className="mx-auto max-w-7xl px-4 lg:px-6">

            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">

              <div className="text-center sm:text-left">

                <p className="section-eyebrow">New arrivals</p>

                <h2 className="section-title mt-3">Featured Articles</h2>

                <p className="mt-2 max-w-md text-sm text-gray-600">

                  Latest styles from our Durg store — updated as you add products in admin.

                </p>

              </div>

              <Link

                href="/shop"

                className="mx-auto rounded-full border border-paji-orange/30 px-5 py-2 text-sm font-semibold text-paji-orange transition hover:bg-paji-orange hover:text-white sm:mx-0"

              >

                Shop More

              </Link>

            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">

              {catalog.map((p) => (

                <ProductCard key={p.id} product={mapProductToCard(p)} />

              ))}

            </div>

          </div>

        </section>

      )}



      {glimpsesEnabled && (

        <GlimpsesIntro sectionTitle={glimpsesTitle} storeTagline={settings.businessDescription} />

      )}



      <ShopByCategorySection

        categories={cats.map((cat) => ({

          id: cat.id,

          name: cat.name,

          slug: cat.slug,

          imageUrl: cat.imageUrl,

        }))}

      />



      <TrustSections settings={settings} />

    </>

  );

}

