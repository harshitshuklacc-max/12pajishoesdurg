import Link from "next/link";

import { Instagram, MapPin, Phone } from "lucide-react";

import { StoreLogo } from "./logo";

import type { StoreSettings } from "@/lib/settings";



export async function Footer({ settings }: { settings: StoreSettings }) {

  let categoryLinks: { name: string; slug: string }[] = [];

  try {

    const { db } = await import("@/db");

    const { categories } = await import("@/db/schema");

    const { and, asc, eq } = await import("drizzle-orm");

    categoryLinks = await db.query.categories.findMany({

      where: and(eq(categories.isActive, true)),

      orderBy: [asc(categories.displayOrder)],

      limit: 6,

      columns: { name: true, slug: true },

    });

  } catch {

    /* db optional at build */

  }



  const tel = settings.phone.replace(/\s/g, "");



  return (

    <footer className="relative mt-auto overflow-hidden bg-paji-deep text-gray-300">

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.14),transparent_55%)]" />



      <div className="relative mx-auto max-w-7xl px-4 py-14 lg:px-6 lg:py-16">

        <div className="flex flex-col items-center border-b border-white/10 pb-12 text-center">

          <StoreLogo settings={settings} showWordmark={false} className="mb-4 justify-center" />

          <p className="font-serif text-2xl uppercase tracking-[0.08em] text-white">{settings.storeName}</p>

          <p className="mt-2 max-w-md text-sm text-white/70">{settings.businessDescription}</p>

          {settings.instagram && (

            <a

              href={settings.instagram}

              target="_blank"

              rel="noopener noreferrer"

              className="mt-4 inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-paji-gold"

            >

              <Instagram className="h-4 w-4" /> Instagram

            </a>

          )}

        </div>



        <div className="grid gap-10 pt-12 md:grid-cols-3">

          <div>

            <h3 className="font-serif text-lg text-white">Explore</h3>

            <ul className="mt-4 space-y-2.5 text-sm">

              <li><Link href="/about" className="transition hover:text-paji-gold">About Us</Link></li>

              <li><Link href="/contact" className="transition hover:text-paji-gold">Contact Us</Link></li>

              <li><Link href="/shop" className="transition hover:text-paji-gold">Shop</Link></li>

              <li><Link href="/account" className="transition hover:text-paji-gold">Login</Link></li>

            </ul>

          </div>

          <div>

            <h3 className="font-serif text-lg text-white">Categories</h3>

            <ul className="mt-4 space-y-2.5 text-sm">

              {categoryLinks.length > 0 ? (

                categoryLinks.map((c) => (

                  <li key={c.slug}>

                    <Link href={`/category/${c.slug}`} className="transition hover:text-paji-gold">

                      {c.name}

                    </Link>

                  </li>

                ))

              ) : (

                <li>

                  <Link href="/categories" className="transition hover:text-paji-gold">

                    Browse categories

                  </Link>

                </li>

              )}

            </ul>

          </div>

          <div>

            <h3 className="font-serif text-lg text-white">Visit &amp; Call</h3>

            <ul className="mt-4 space-y-3 text-sm">

              <li className="flex gap-2">

                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-paji-gold" />

                <span className="text-white/75">{settings.address}</span>

              </li>

              <li>

                <a href={`tel:${tel}`} className="inline-flex items-center gap-2 transition hover:text-paji-gold">

                  <Phone className="h-4 w-4 text-paji-gold" />

                  {settings.phone}

                </a>

              </li>

            </ul>

          </div>

        </div>

      </div>



      <div className="relative border-t border-white/10">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-white/50 md:flex-row md:text-left lg:px-6">

          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>

          <p>

            Made by{" "}

            <span className="font-semibold text-white/70">HKS Web Development Company</span>

            {" · "}

            <a href="tel:9406112110" className="text-paji-gold transition hover:underline">

              9406112110

            </a>

          </p>

        </div>

      </div>

    </footer>

  );

}


