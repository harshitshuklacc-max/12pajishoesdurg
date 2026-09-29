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
    if (row?.content) {
      const c = row.content as Partial<HeroContent>;
      return {
        ...DEFAULT_HERO,
        ...c,
        ctaPrimary: c.ctaPrimary?.trim() || DEFAULT_HERO.ctaPrimary,
        ctaSecondary: c.ctaSecondary?.trim() || DEFAULT_HERO.ctaSecondary,
        description: c.description?.trim() || DEFAULT_HERO.description,
        heading: c.heading?.trim() || DEFAULT_HERO.heading,
      };
    }
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
