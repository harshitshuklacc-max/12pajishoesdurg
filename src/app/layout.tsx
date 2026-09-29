import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { FloatingActions } from "@/components/store/floating-actions";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { getStoreSettings } from "@/lib/settings";
import { faviconFromLogo } from "@/lib/cloudinary-url";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const icons =
    settings.faviconUrl || settings.logoPublicId
      ? {
          icon: settings.faviconUrl || faviconFromLogo(settings.logoPublicId, 32),
          apple: settings.faviconUrl || faviconFromLogo(settings.logoPublicId, 180),
        }
      : undefined;
  return {
    title: {
      default: settings.seoSiteTitle,
      template: `%s | ${settings.storeName}`,
    },
    description: settings.seoSiteDescription,
    icons,
    openGraph: {
      title: settings.seoSiteTitle,
      description: settings.seoSiteDescription,
      siteName: settings.storeName,
      locale: "en_IN",
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  return (
    <html lang="en">
      <body className={`${sans.variable} ${outfit.variable} ${cormorant.variable} flex min-h-screen flex-col font-sans`}>
        <AnnouncementBar settings={settings} />
        <Header settings={settings} />
        <main className="flex-1 w-full min-w-0 overflow-x-hidden">{children}</main>
        <Footer settings={settings} />
        <FloatingActions phone={settings.phone} />
      </body>
    </html>
  );
}
