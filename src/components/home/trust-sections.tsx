import Link from "next/link";
import { MapPin, Phone, Shield, Sparkles, Truck } from "lucide-react";
import type { StoreSettings } from "@/lib/settings";

const WHY = [
  {
    icon: Sparkles,
    title: "Complete variety",
    text: "Men's and ladies' styles — curated for everyday comfort and occasion wear.",
  },
  {
    icon: Truck,
    title: "Pan-India delivery",
    text: "We ship across India. Visit our Durg store for the full in-person experience.",
  },
  {
    icon: Shield,
    title: "Trusted local store",
    text: "Walk in near Marwadi School, Baniya Para — our team helps you find the right fit.",
  },
];

export function TrustSections({ settings }: { settings: StoreSettings }) {
  const tel = settings.phone.replace(/\s/g, "");
  const mapsQuery = encodeURIComponent("Paji Shoes Durg");

  return (
    <>
      <section className="border-y border-black/5 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-paji-orange">The Paji promise</p>
            <h2 className="font-serif mt-3 text-3xl text-paji-charcoal md:text-4xl">Why Choose Us</h2>
          </div>
          <ul className="mt-12 grid gap-8 md:grid-cols-3">
            {WHY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border border-black/5 bg-paji-cream/80 p-8 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paji-orange/10 text-paji-orange">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-paji-charcoal">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paji-deep py-16 text-white md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:px-6">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl">Visit Our Store</h2>
            <p className="mt-4 flex gap-3 text-sm leading-relaxed text-white/85">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-paji-gold" />
              {settings.address}
            </p>
            <p className="mt-2 text-sm text-white/70">{settings.storeHours}</p>
            <Link
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full border border-paji-gold/50 px-6 py-2.5 text-sm font-semibold text-paji-gold transition hover:bg-paji-gold/10"
            >
              Get Directions
            </Link>
          </div>
          <div>
            <h2 className="font-serif text-3xl md:text-4xl">Call Us</h2>
            <p className="mt-4 text-sm text-white/75">Click to call — we are happy to help you choose the right pair.</p>
            <a
              href={`tel:${tel}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-paji-orange px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-paji-orange-dark"
            >
              <Phone className="h-5 w-5" />
              {settings.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
