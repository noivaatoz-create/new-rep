import { db } from "./db.js";
import { eq } from "drizzle-orm";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  products, orders, reviews, subscribers, siteSettings, contactSubmissions,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type Review, type InsertReview,
  type Subscriber, type InsertSubscriber,
  type SiteSetting, type InsertSiteSetting,
  type ContactSubmission, type InsertContactSubmission,
} from "../shared/schema.js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY?.trim();
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const DB_CONNECTION_ERROR_PATTERN =
  /(password authentication failed|econnrefused|enotfound|ehostunreach|etimedout|timeout expired|connection terminated unexpectedly|no pg_hba\.conf entry|primary db timeout)/i;
const PRIMARY_DB_TIMEOUT_MS = Number.parseInt(process.env.PRIMARY_DB_TIMEOUT_MS ?? "4000", 10);
const PREFER_SUPABASE_IN_PROD = process.env.PREFER_SUPABASE_IN_PROD !== "false";
// When routes use primary DB for products (USE_DIRECT_SUPABASE_PRODUCTS !== "true"), prefer primary here too.
const useSupabaseFirstInProd =
  PREFER_SUPABASE_IN_PROD && process.env.USE_DIRECT_SUPABASE_PRODUCTS === "true";

function shouldUseSupabaseFallback(error: unknown): boolean {
  if (!supabase) {
    return false;
  }
  const message = error instanceof Error ? error.message : String(error ?? "");
  return DB_CONNECTION_ERROR_PATTERN.test(message);
}

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase fallback is not configured");
  }
  return supabase;
}

async function withSupabaseFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (supabase && process.env.NODE_ENV === "production" && useSupabaseFirstInProd) {
    return fallback();
  }

  try {
    return await new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("primary db timeout"));
      }, PRIMARY_DB_TIMEOUT_MS);

      primary()
        .then((value) => {
          clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  } catch (error) {
    if (!shouldUseSupabaseFallback(error)) {
      throw error;
    }
    return fallback();
  }
}

function mapProductRow(row: Record<string, any>): Product {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    shortDescription: String(row.short_description ?? row.shortDescription ?? ""),
    longDescription: String(row.long_description ?? row.longDescription ?? ""),
    price: String(row.price ?? "0"),
    compareAtPrice: row.compare_at_price ?? row.compareAtPrice ?? null,
    category: String(row.category ?? ""),
    badge: row.badge ?? null,
    image: String(row.image ?? ""),
    images: Array.isArray(row.images) ? row.images : [],
    specs: row.specs && typeof row.specs === "object" ? (row.specs as Record<string, string>) : null,
    features: Array.isArray(row.features) ? row.features : [],
    whatsInBox: Array.isArray(row.whats_in_box ?? row.whatsInBox) ? (row.whats_in_box ?? row.whatsInBox) : [],
    stock: Number(row.stock ?? 0),
    isActive: Boolean(row.is_active ?? row.isActive),
    isFeatured: Boolean(row.is_featured ?? row.isFeatured),
  };
}

function mapProductInputToRow(data: Partial<InsertProduct>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("name" in data) row.name = data.name;
  if ("slug" in data) row.slug = data.slug;
  if ("shortDescription" in data) row.short_description = data.shortDescription;
  if ("longDescription" in data) row.long_description = data.longDescription;
  if ("price" in data) row.price = data.price;
  if ("compareAtPrice" in data) row.compare_at_price = data.compareAtPrice;
  if ("category" in data) row.category = data.category;
  if ("badge" in data) row.badge = data.badge;
  if ("image" in data) row.image = data.image;
  if ("images" in data) row.images = data.images;
  if ("specs" in data) row.specs = data.specs;
  if ("features" in data) row.features = data.features;
  if ("whatsInBox" in data) row.whats_in_box = data.whatsInBox;
  if ("stock" in data) row.stock = data.stock;
  if ("isActive" in data) row.is_active = data.isActive;
  if ("isFeatured" in data) row.is_featured = data.isFeatured;
  return row;
}

function mapSiteSettingRow(row: Record<string, any>): SiteSetting {
  return {
    id: Number(row.id),
    key: String(row.key ?? ""),
    value: String(row.value ?? ""),
  };
}

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteAllOrders(): Promise<void>;

  getReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;

  getSettings(): Promise<SiteSetting[]>;
  getSetting(key: string): Promise<SiteSetting | undefined>;
  upsertSetting(key: string, value: string): Promise<SiteSetting>;

  getContactSubmissions(): Promise<ContactSubmission[]>;
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  updateContactSubmission(id: number, data: Partial<InsertContactSubmission>): Promise<ContactSubmission | undefined>;
  deleteContactSubmission(id: number): Promise<void>;

  getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return withSupabaseFallback(
      () => db.select().from(products),
      async () => {
        const sb = getSupabaseClient();
        const { data, error } = await sb.from("products").select("*");
        if (error) {
          throw error;
        }
        return (data ?? []).map((row) => mapProductRow(row as Record<string, any>));
      },
    );
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return withSupabaseFallback(
      async () => {
        const [product] = await db.select().from(products).where(eq(products.id, id));
        return product;
      },
      async () => {
        const sb = getSupabaseClient();
        const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle();
        if (error) {
          throw error;
        }
        return data ? mapProductRow(data as Record<string, any>) : undefined;
      },
    );
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return withSupabaseFallback(
      async () => {
        const [product] = await db.select().from(products).where(eq(products.slug, slug));
        return product;
      },
      async () => {
        const sb = getSupabaseClient();
        const { data, error } = await sb.from("products").select("*").eq("slug", slug).maybeSingle();
        if (error) {
          throw error;
        }
        return data ? mapProductRow(data as Record<string, any>) : undefined;
      },
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return withSupabaseFallback(
      async () => {
        const [created] = await db.insert(products).values(product).returning();
        return created;
      },
      async () => {
        const sb = getSupabaseClient();
        const { data, error } = await sb.from("products").insert(mapProductInputToRow(product)).select("*").single();
        if (error) {
          throw error;
        }
        return mapProductRow(data as Record<string, any>);
      },
    );
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    if (Object.keys(data).length === 0) {
      return this.getProductById(id);
    }

    return withSupabaseFallback(
      async () => {
        const [updated] = await db.update(products).set(data).where(eq(products.id, id)).returning();
        return updated;
      },
      async () => {
        const sb = getSupabaseClient();
        const updateRow = mapProductInputToRow(data);
        if (Object.keys(updateRow).length === 0) {
          return this.getProductById(id);
        }
        const { data: updated, error } = await sb
          .from("products")
          .update(updateRow)
          .eq("id", id)
          .select("*")
          .maybeSingle();
        if (error) {
          throw error;
        }
        return updated ? mapProductRow(updated as Record<string, any>) : undefined;
      },
    );
  }

  async deleteProduct(id: number): Promise<void> {
    return withSupabaseFallback(
      async () => {
        await db.delete(products).where(eq(products.id, id));
      },
      async () => {
        const sb = getSupabaseClient();
        const { error } = await sb.from("products").delete().eq("id", id);
        if (error) {
          throw error;
        }
      },
    );
  }

  async getOrders(): Promise<Order[]> {
    return db.select().from(orders);
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updated;
  }

  async deleteAllOrders(): Promise<void> {
    await db.delete(orders);
  }

  async getReviews(): Promise<Review[]> {
    return db.select().from(reviews);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const [created] = await db.insert(subscribers).values(subscriber).returning();
    return created;
  }

  async getSettings(): Promise<SiteSetting[]> {
    return withSupabaseFallback(
      () => db.select().from(siteSettings),
      async () => {
        const sb = getSupabaseClient();
        const { data, error } = await sb.from("site_settings").select("*");
        if (error) {
          throw error;
        }
        return (data ?? []).map((row) => mapSiteSettingRow(row as Record<string, any>));
      },
    );
  }

  async getSetting(key: string): Promise<SiteSetting | undefined> {
    return withSupabaseFallback(
      async () => {
        const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
        return setting;
      },
      async () => {
        const sb = getSupabaseClient();
        const { data, error } = await sb.from("site_settings").select("*").eq("key", key).maybeSingle();
        if (error) {
          throw error;
        }
        return data ? mapSiteSettingRow(data as Record<string, any>) : undefined;
      },
    );
  }

  async upsertSetting(key: string, value: string): Promise<SiteSetting> {
    return withSupabaseFallback(
      async () => {
        const existing = await this.getSetting(key);
        if (existing) {
          const [updated] = await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key)).returning();
          return updated;
        }
        const [created] = await db.insert(siteSettings).values({ key, value }).returning();
        return created;
      },
      async () => {
        const sb = getSupabaseClient();
        const { data, error } = await sb
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" })
          .select("*")
          .single();
        if (error) {
          throw error;
        }
        return mapSiteSettingRow(data as Record<string, any>);
      },
    );
  }
  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return db.select().from(contactSubmissions);
  }

  async createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission> {
    const [created] = await db.insert(contactSubmissions).values(submission).returning();
    return created;
  }

  async updateContactSubmission(id: number, data: Partial<InsertContactSubmission>): Promise<ContactSubmission | undefined> {
    const [updated] = await db.update(contactSubmissions).set(data).where(eq(contactSubmissions.id, id)).returning();
    return updated;
  }

  async deleteContactSubmission(id: number): Promise<void> {
    await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }
}

export const storage = new DatabaseStorage();
