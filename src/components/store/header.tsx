"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";

import { StoreLogo } from "./logo";

import { useCart } from "@/store/cart";

import type { StoreSettings } from "@/lib/settings";

import { cn } from "@/lib/utils";



const NAV = [

  { href: "/", label: "Home" },

  { href: "/categories", label: "Categories" },

  { href: "/shop", label: "Shop" },

  { href: "/shop?sort=newest", label: "New Arrivals" },

  { href: "/shop?onSale=1", label: "Offers" },

  { href: "/about", label: "About" },

  { href: "/contact", label: "Contact" },

];



export function Header({ settings }: { settings: StoreSettings }) {

  const [scrolled, setScrolled] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [query, setQuery] = useState("");

  const pathname = usePathname();

  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {

    const onScroll = () => setScrolled(window.scrollY > 8);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);

  }, []);



  useEffect(() => {

    setMobileOpen(false);

  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (

    <header

      className={cn(

        "sticky top-0 z-50 w-full border-b transition-all duration-300",

        scrolled

          ? "border-black/5 bg-paji-cream/95 shadow-md backdrop-blur-xl"

          : "border-black/[0.04] bg-gradient-to-b from-white to-paji-cream/90 backdrop-blur-md"

      )}

    >

      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-4 lg:h-[76px] lg:px-6">

        <button

          type="button"

          className="rounded-lg p-2 text-paji-deep hover:bg-black/5 lg:hidden"

          aria-label="Open menu"

          onClick={() => setMobileOpen(true)}

        >

          <Menu className="h-6 w-6" />

        </button>



        <StoreLogo settings={settings} variant="luxury" className="min-w-0 flex-1 justify-center lg:flex-none lg:justify-start" />



        <nav className="hidden flex-1 items-center justify-center gap-0.5 xl:flex" aria-label="Main">

          {NAV.map((item) => {

            const base = item.href.split("?")[0];

            const active = pathname === item.href || (base !== "/" && pathname.startsWith(base));

            return (

              <Link

                key={item.href}

                href={item.href}

                className={cn(

                  "rounded-full px-3 py-2 text-[13px] font-medium tracking-wide transition-colors",

                  active ? "text-paji-orange" : "text-paji-charcoal/80 hover:text-paji-orange"

                )}

              >

                {item.label}

              </Link>

            );

          })}

        </nav>



        <div className="flex items-center gap-0.5 sm:gap-1">

          <button

            type="button"

            aria-label="Search"

            className="rounded-full p-2.5 text-paji-deep transition hover:bg-black/5"

            onClick={() => setSearchOpen((v) => !v)}

          >

            <Search className="h-5 w-5" />

          </button>

          <Link

            href="/wishlist"

            className="hidden rounded-full p-2.5 text-paji-deep transition hover:bg-black/5 sm:block"

            aria-label="Wishlist"

          >

            <Heart className="h-5 w-5" />

          </Link>

          <Link href="/cart" className="relative rounded-full p-2.5 text-paji-deep transition hover:bg-black/5" aria-label="Cart">

            <ShoppingBag className="h-5 w-5" />

            {cartCount > 0 && (

              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-paji-orange px-1 text-[9px] font-bold text-white">

                {cartCount}

              </span>

            )}

          </Link>

          <Link href="/account" className="rounded-full p-2.5 text-paji-deep transition hover:bg-black/5" aria-label="Account">

            <User className="h-5 w-5" />

          </Link>

        </div>

      </div>



      {searchOpen && (

        <div className="border-t border-black/5 bg-white px-4 py-3 animate-slide-up">

          <form action="/shop" method="get" className="mx-auto flex max-w-xl gap-2">

            <input

              name="q"

              value={query}

              onChange={(e) => setQuery(e.target.value)}

              placeholder="Search shoes, SKU, brand..."

              className="flex-1 rounded-full border border-black/10 bg-paji-cream/50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-paji-orange"

              autoFocus

            />

            <button type="submit" className="rounded-full bg-paji-orange px-5 py-2.5 text-sm font-semibold text-white">

              Search

            </button>

          </form>

        </div>

      )}



      {mobileOpen && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[80] lg:hidden">
              <div
                className="absolute inset-0 bg-black/80"
                onClick={() => setMobileOpen(false)}
                aria-hidden
              />
              <div className="absolute left-0 top-0 flex h-full w-[min(100%,320px)] flex-col bg-black text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/15 bg-black p-4">
                  <StoreLogo settings={settings} variant="mobile" className="[&_span]:!text-white" />
                  <button type="button" aria-label="Close menu" className="rounded-lg p-1 text-white" onClick={() => setMobileOpen(false)}>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto bg-black p-4">
                  <p className="px-3 pb-2 font-serif text-lg text-paji-gold">Explore</p>
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-lg px-3 py-3 text-base font-medium text-white transition hover:bg-white/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link href="/wishlist" className="rounded-lg px-3 py-3 text-base font-medium text-white hover:bg-white/10">
                    Wishlist
                  </Link>
                  <Link href="/account" className="rounded-lg px-3 py-3 text-base font-medium text-white hover:bg-white/10">
                    Login
                  </Link>
                </nav>
              </div>
            </div>,
            document.body
          )
        : null}

    </header>

  );

}


