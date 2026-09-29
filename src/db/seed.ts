import "dotenv/config";
import { db } from "./index";
import {
  categories,
  colors,
  sizes,
  products,
  homepageSections,
  websiteSettings,
} from "./schema";
import { ensureDefaultAdmin, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD } from "../lib/auth/ensure-default-admin";
import { DEFAULT_SETTINGS } from "../lib/settings";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding Paji Shoes database...");

  await ensureDefaultAdmin({ syncPassword: true });
  console.log(`Admin user: ${DEFAULT_ADMIN_USERNAME}`);

  await db
    .insert(websiteSettings)
    .values({ key: "store", value: DEFAULT_SETTINGS })
    .onConflictDoNothing();

  await db
    .insert(homepageSections)
    .values([
      {
        key: "hero",
        title: "Hero",
        isEnabled: true,
        content: {
          heading: "Step Into Style at Paji Shoes",
          description: "Complete variety for mens and ladies — premium footwear in Durg.",
          ctaPrimary: "Shop Now",
          ctaSecondary: "Explore Categories",
          imageUrl: "",
          imagePublicId: "",
        },
      },
      { key: "glimpses", title: "OUR GLIMPSES", isEnabled: true },
    ])
    .onConflictDoNothing();

  const categoryData = [
    { name: "Men's Shoes", slug: "mens-shoes", displayOrder: 1 },
    { name: "Women's Shoes", slug: "womens-shoes", displayOrder: 2 },
    { name: "Sports Shoes", slug: "sports-shoes", displayOrder: 3 },
    { name: "Casual Shoes", slug: "casual-shoes", displayOrder: 4 },
    { name: "Formal Shoes", slug: "formal-shoes", displayOrder: 5 },
    { name: "Sandals", slug: "sandals", displayOrder: 6 },
    { name: "Slippers", slug: "slippers", displayOrder: 7 },
    { name: "Sneakers", slug: "sneakers", displayOrder: 8 },
  ];

  for (const c of categoryData) {
    await db.insert(categories).values({ ...c, isActive: true }).onConflictDoNothing();
  }

  const colorData = [
    { name: "Black", hexCode: "#000000" },
    { name: "White", hexCode: "#FFFFFF" },
    { name: "Brown", hexCode: "#8B4513" },
    { name: "Orange", hexCode: "#F97316" },
  ];
  for (const c of colorData) {
    await db.insert(colors).values(c).onConflictDoNothing();
  }

  for (let i = 5; i <= 12; i++) {
    await db.insert(sizes).values({ label: String(i), system: "india", sortOrder: i }).onConflictDoNothing();
  }

  const mensCat = await db.query.categories.findFirst({ where: eq(categories.slug, "mens-shoes") });
  const womensCat = await db.query.categories.findFirst({ where: eq(categories.slug, "womens-shoes") });

  const demoProducts = [
    {
      name: "[DEMO] Classic Leather Formal",
      slug: "demo-classic-leather-formal",
      sku: "DEMO-FRM-001",
      categoryId: mensCat?.id,
      sellingPrice: "1299.00",
      mrpPrice: "1999.00",
      discountPercent: 35,
      stock: 20,
      hasSizes: true,
      hasColors: false,
      isDemo: true,
      isFeatured: true,
      description: "Demo product for testing. Delete from admin when adding real inventory.",
    },
    {
      name: "[DEMO] Everyday Casual Slip-on",
      slug: "demo-everyday-casual-slipon",
      sku: "DEMO-CSL-001",
      categoryId: mensCat?.id,
      sellingPrice: "799.00",
      mrpPrice: "999.00",
      discountPercent: 20,
      stock: 15,
      hasSizes: false,
      hasColors: false,
      isDemo: true,
      isNewArrival: true,
      description: "Demo product without sizes — add to cart directly.",
    },
    {
      name: "[DEMO] Ladies Comfort Sandal",
      slug: "demo-ladies-comfort-sandal",
      sku: "DEMO-SND-001",
      categoryId: womensCat?.id,
      sellingPrice: "599.00",
      mrpPrice: "799.00",
      discountPercent: 25,
      stock: 0,
      hasSizes: false,
      hasColors: true,
      isDemo: true,
      isOnSale: true,
      description: "Demo out-of-stock example for UI testing.",
    },
  ];

  for (const p of demoProducts) {
    await db.insert(products).values({ ...p, isActive: true }).onConflictDoNothing();
  }

  console.log("Seed complete.");
  console.log("--- Login credentials ---");
  console.log(`Admin username: ${DEFAULT_ADMIN_USERNAME}`);
  console.log(`Admin password: ${DEFAULT_ADMIN_PASSWORD}`);
  console.log("Customer: use phone OTP on /account (OTP shown on screen)");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
