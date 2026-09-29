"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/sizes", label: "Sizes" },
  { href: "/admin/colors", label: "Colors" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <aside className="w-full border-b bg-paji-charcoal text-white lg:w-64 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="p-4 font-bold text-paji-orange">Paji Admin</div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:px-0 lg:pb-0">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-2 text-sm lg:mx-2 lg:mb-1",
                pathname === l.href || pathname.startsWith(`${l.href}/`)
                  ? "bg-paji-orange text-white"
                  : "text-gray-300 hover:bg-white/10"
              )}
            >
              {l.label}
            </Link>
          ))}
          <button type="button" onClick={logout} className="rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:text-white lg:mx-2">
            Logout
          </button>
        </nav>
      </aside>
      <div className="flex-1 p-4 lg:p-8">{children}</div>
    </div>
  );
}
