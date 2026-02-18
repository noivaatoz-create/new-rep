import { sql } from "drizzle-orm";
import { pgTable, text, integer, numeric, boolean, timestamp, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description").notNull(),
  longDescription: text("long_description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  category: text("category").notNull(),
  badge: text("badge"),
  image: text("image").notNull(),
  images: text("images").array().notNull().default(sql`'{}'::text[]`),
  specs: jsonb("specs").$type<Record<string, string>>(),
  features: text("features").array().notNull().default(sql`'{}'::text[]`),
  whatsInBox: text("whats_in_box").array().notNull().default(sql`'{}'::text[]`),
  stock: integer("stock").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  showOnHero: boolean("show_on_hero").notNull().default(false),
});

export const cartItems = pgTable("cart_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  items: jsonb("items").$type<Array<{ productId: number; name: string; price: string; quantity: number; image: string }>>().notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shipping: numeric("shipping", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentProvider: text("payment_provider"),
  paymentId: text("payment_id"),
  promoCodeId: integer("promo_code_id"),
  influencerId: integer("influencer_id"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commissionTypeEnum = pgEnum("commission_type", ["percentage", "fixed"]);
export const influencerStatusEnum = pgEnum("influencer_status", ["active", "inactive"]);
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);
export const commissionStatusEnum = pgEnum("commission_status", ["pending", "approved", "paid"]);

export const influencers = pgTable("influencers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  commissionType: commissionTypeEnum("commission_type").notNull(),
  commissionValue: numeric("commission_value", { precision: 10, scale: 2 }).notNull(),
  status: influencerStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const promoCodes = pgTable("promo_codes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: text("code").notNull().unique(),
  influencerId: integer("influencer_id").notNull(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  promoCodeIdx: index("promo_codes_code_idx").on(t.code),
}));

export const commissions = pgTable("commissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  influencerId: integer("influencer_id").notNull(),
  orderId: integer("order_id").notNull(),
  commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }).notNull(),
  status: commissionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// `createInsertSchema()` already marks generated/default columns as optional/excluded
// based on the table definition. Avoid `.omit()` here because keys may not exist
// on the generated schema (e.g. identity columns), which causes TS errors on build.
export const insertSiteSettingSchema = createInsertSchema(siteSettings);
export const insertProductSchema = createInsertSchema(products);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const insertOrderSchema = createInsertSchema(orders);
export const insertInfluencerSchema = createInsertSchema(influencers);
export const insertPromoCodeSchema = createInsertSchema(promoCodes);
export const insertCommissionSchema = createInsertSchema(commissions);
export const insertReviewSchema = createInsertSchema(reviews);
export const insertSubscriberSchema = createInsertSchema(subscribers);
export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions);

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Influencer = typeof influencers.$inferSelect;
export type InsertInfluencer = z.infer<typeof insertInfluencerSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
