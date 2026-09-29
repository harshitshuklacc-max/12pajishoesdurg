import { db } from "@/db";
import { homepageSections } from "@/db/schema";
import { eq } from "drizzle-orm";

export type HeroContent = {
  heading: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
  imageUrl: string;
  imagePublicId: string;
};

const DEFAULT_HERO: HeroContent = {
  heading: "Step Into Style at Paji Shoes",
  description: "Complete variety for mens and ladies — premium footwear in Durg.",
  ctaPrimary: "Shop Now",
  ctaSecondary: "Explore Categories",
  imageUrl: "",
  imagePublicId: "",
};

export async function getHeroContent(): Promise<HeroContent> {
  try {
    const row = await db.query.homepageSections.findFirst({
      where: eq(homepageSections.key, "hero"),
    });
    if (row?.content) return { ...DEFAULT_HERO, ...(row.content as Partial<HeroContent>) };
  } catch {
    /* db not ready */
  }
  return DEFAULT_HERO;
}

export async function getSectionMeta(key: string) {
  try {
    return db.query.homepageSections.findFirst({ where: eq(homepageSections.key, key) });
  } catch {
    return null;
  }
}
