import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { LimitedTimeOffer } from "@/components/product/limited-time-offer";
import { getProductBySlug } from "@/lib/products";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription || product.description,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  await db.update(products).set({ viewCount: sql`${products.viewCount} + 1` }).where(eq(products.id, product.id));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.sellingPrice,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const sizes =
    product.productSizes?.map((ps) => ({
      id: ps.size.id,
      label: ps.size.label,
    })) ?? [];

  const colors =
    product.productColors?.map((pc) => ({
      id: pc.color.id,
      name: pc.color.name,
      hexCode: pc.color.hexCode,
    })) ?? [];

  const showOffer =
    product.limitedOfferEnabled &&
    product.limitedOfferEndsAt &&
    new Date(product.limitedOfferEndsAt).getTime() > Date.now();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          description: product.description,
          sellingPrice: product.sellingPrice,
          mrpPrice: product.mrpPrice,
          discountPercent: product.discountPercent,
          stock: product.stock,
          hasSizes: product.hasSizes,
          hasColors: product.hasColors,
          images: product.images.map((i) => ({
            url: i.url,
            publicId: i.publicId,
            isPrimary: i.isPrimary,
          })),
          sizes,
          colors,
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            sizeId: v.sizeId,
            colorId: v.colorId,
            sellingPrice: v.sellingPrice,
            stock: v.stock,
            imageUrl: v.imageUrl,
          })),
        }}
      />
      {showOffer && product.limitedOfferEndsAt && (
        <LimitedTimeOffer endsAt={product.limitedOfferEndsAt.toISOString()} />
      )}
    </>
  );
}
