import type { StoreSettings } from "@/lib/settings";

export function AnnouncementBar({ settings }: { settings: StoreSettings }) {
  const freeAbove = settings.freeShippingAbove > 0 ? settings.freeShippingAbove : 1499;

  const segments = [
    `FREE SHIPPING ON PREPAID ORDERS ABOVE ₹${freeAbove}`,
    "SHIPPING ALL OVER INDIA",
    `FREE SHIPPING ON PREPAID ORDERS ABOVE ₹${freeAbove}`,
    "SHIPPING ALL OVER INDIA",
  ];

  const line = segments.join("   •   ");

  return (
    <div className="relative overflow-hidden bg-paji-deep py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/95 sm:text-xs">
      <div className="announcement-marquee flex w-max">
        <span className="whitespace-nowrap px-4">{line}</span>
        <span className="whitespace-nowrap px-4" aria-hidden>
          {line}
        </span>
      </div>
    </div>
  );
}
