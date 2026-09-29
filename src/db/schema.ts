import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "pending",
  "success",
  "failed",
  "refunded",
  "cancelled",
]);

export const sizeSystemEnum = pgEnum("size_system", ["india", "uk", "us", "eu", "custom"]);

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  roleId: integer("role_id").references(() => adminRoles.id),
  isActive: boolean("is_active").default(true).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  description: text("description"),
});

export const adminRolePermissions = pgTable(
  "admin_role_permissions",
  {
    roleId: integer("role_id")
      .notNull()
      .references(() => adminRoles.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("role_permission_idx").on(t.roleId, t.permissionId)]
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).unique(),
    mobile: varchar("mobile", { length: 20 }).notNull(),
    passwordHash: text("password_hash"),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_mobile_unique_idx").on(t.mobile)]
);

export const customerOtps = pgTable(
  "customer_otps",
  {
    id: serial("id").primaryKey(),
    mobile: varchar("mobile", { length: 20 }).notNull(),
    otpHash: text("otp_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    verified: boolean("verified").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("customer_otps_mobile_idx").on(t.mobile)]
);

export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  addressLine: text("address_line").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 10 }).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    imagePublicId: text("image_public_id"),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("categories_slug_idx").on(t.slug)]
);

export const colors = pgTable("colors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  hexCode: varchar("hex_code", { length: 7 }),
  swatchUrl: text("swatch_url"),
  swatchPublicId: text("swatch_public_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sizes = pgTable("sizes", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
  system: sizeSystemEnum("system").default("india").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    barcode: varchar("barcode", { length: 100 }),
    categoryId: integer("category_id").references(() => categories.id),
    subcategoryId: integer("subcategory_id"),
    brand: varchar("brand", { length: 255 }),
    description: text("description"),
    shortDescription: text("short_description"),
    sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }).notNull(),
    mrpPrice: decimal("mrp_price", { precision: 12, scale: 2 }),
    discountPercent: integer("discount_percent").default(0),
    stock: integer("stock").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
    hasSizes: boolean("has_sizes").default(false).notNull(),
    hasColors: boolean("has_colors").default(false).notNull(),
    tags: jsonb("tags").$type<string[]>().default([]),
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isBestseller: boolean("is_bestseller").default(false).notNull(),
    isNewArrival: boolean("is_new_arrival").default(false).notNull(),
    isOnSale: boolean("is_on_sale").default(false).notNull(),
    limitedOfferEnabled: boolean("limited_offer_enabled").default(false).notNull(),
    limitedOfferEndsAt: timestamp("limited_offer_ends_at"),
    isDemo: boolean("is_demo").default(false).notNull(),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    viewCount: integer("view_count").default(0).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("products_slug_idx").on(t.slug),
    index("products_sku_idx").on(t.sku),
    index("products_name_idx").on(t.name),
    index("products_category_idx").on(t.categoryId),
  ]
);

export const productRatings = pgTable(
  "product_ratings",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    reviewerName: varchar("reviewer_name", { length: 120 }).notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("product_ratings_product_idx").on(t.productId)]
);

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  publicId: text("public_id").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productColors = pgTable(
  "product_colors",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    colorId: integer("color_id")
      .notNull()
      .references(() => colors.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("product_color_idx").on(t.productId, t.colorId)]
);

export const productColorsRelations = relations(productColors, ({ one }) => ({
  product: one(products, { fields: [productColors.productId], references: [products.id] }),
  color: one(colors, { fields: [productColors.colorId], references: [colors.id] }),
}));

export const productSizes = pgTable(
  "product_sizes",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sizeId: integer("size_id")
      .notNull()
      .references(() => sizes.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("product_size_idx").on(t.productId, t.sizeId)]
);

export const productSizesRelations = relations(productSizes, ({ one }) => ({
  product: one(products, { fields: [productSizes.productId], references: [products.id] }),
  size: one(sizes, { fields: [productSizes.sizeId], references: [sizes.id] }),
}));

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  sizeId: integer("size_id").references(() => sizes.id),
  colorId: integer("color_id").references(() => colors.id),
  sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }),
  stock: integer("stock").default(0).notNull(),
  imageUrl: text("image_url"),
  imagePublicId: text("image_public_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("wishlist_user_product_idx").on(t.userId, t.productId)]
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    userId: integer("user_id").references(() => users.id),
    guestEmail: varchar("guest_email", { length: 255 }),
    guestMobile: varchar("guest_mobile", { length: 20 }),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerMobile: varchar("customer_mobile", { length: 20 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    shippingAddress: text("shipping_address").notNull(),
    shippingCity: varchar("shipping_city", { length: 100 }).notNull(),
    shippingState: varchar("shipping_state", { length: 100 }).notNull(),
    shippingPincode: varchar("shipping_pincode", { length: 10 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
    shippingAmount: decimal("shipping_amount", { precision: 12, scale: 2 }).default("0"),
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    couponCode: varchar("coupon_code", { length: 50 }),
    paymentMethod: varchar("payment_method", { length: 20 }).default("online").notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("orders_order_number_idx").on(t.orderNumber),
    index("orders_customer_mobile_idx").on(t.customerMobile),
  ]
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  productName: varchar("product_name", { length: 500 }).notNull(),
  productSku: varchar("product_sku", { length: 100 }).notNull(),
  sizeLabel: varchar("size_label", { length: 50 }),
  colorName: varchar("color_name", { length: 100 }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
});

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
    razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
    razorpaySignature: text("razorpay_signature"),
    method: varchar("method", { length: 20 }).default("online").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("INR").notNull(),
    status: paymentStatusEnum("status").default("created").notNull(),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("payments_razorpay_order_idx").on(t.razorpayOrderId),
    index("payments_razorpay_payment_idx").on(t.razorpayPaymentId),
  ]
);

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(),
  discountValue: decimal("discount_value", { precision: 12, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 12, scale: 2 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  videoPublicId: text("video_public_id"),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailPublicId: text("thumbnail_public_id"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  autoplay: boolean("autoplay").default(true).notNull(),
  loop: boolean("loop").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  imagePublicId: text("image_public_id"),
  linkUrl: text("link_url"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const homepageSections = pgTable("homepage_sections", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  subtitle: text("subtitle"),
  content: jsonb("content"),
  displayOrder: integer("display_order").default(0).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const websiteSettings = pgTable("website_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  changeAmount: integer("change_amount").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  adminId: integer("admin_id").references(() => admins.id),
  orderId: integer("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderSequence = pgTable("order_sequence", {
  year: integer("year").primaryKey(),
  lastNumber: integer("last_number").default(0).notNull(),
});

// Relations
export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  size: one(sizes, { fields: [productVariants.sizeId], references: [sizes.id] }),
  color: one(colors, { fields: [productVariants.colorId], references: [colors.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(productVariants),
  productColors: many(productColors),
  productSizes: many(productSizes),
  ratings: many(productRatings),
}));

export const productRatingsRelations = relations(productRatings, ({ one }) => ({
  product: one(products, { fields: [productRatings.productId], references: [products.id] }),
}));

export const ordersItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  payment: one(payments),
}));
