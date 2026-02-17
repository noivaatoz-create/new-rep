import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertProductSchema, insertOrderSchema, insertReviewSchema, insertSubscriberSchema, insertContactSubmissionSchema } from "../shared/schema.js";
import {
  getProductColorVariantsSettingKey,
  parseProductColorVariants,
  parseProductColorVariantsSettingKey,
  PRODUCT_COLOR_VARIANTS_PREFIX,
  sanitizeProductColorVariants,
  type ProductColorVariant,
} from "../shared/color-variants.js";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

function requireAdmin(req: any, res: any, next: any) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    console.error("[auth] Unauthorized:", req.method, req.path, "session:", !!req.session, "isAdmin:", !!req.session?.isAdmin);
    res.status(401).json({ error: "Unauthorized. Please log in as admin." });
  }
}

// Keep under serverless limits; fail fast so "Saving..." doesn't hang. Override with env if needed.
const SUPABASE_PRODUCTS_TIMEOUT_MS = Number.parseInt(process.env.SUPABASE_PRODUCTS_TIMEOUT_MS ?? "8000", 10);
const STORAGE_PRODUCTS_TIMEOUT_MS = Number.parseInt(process.env.STORAGE_PRODUCTS_TIMEOUT_MS ?? "60000", 10);
// Use Supabase REST for products only when explicitly enabled (e.g. products table lives in Supabase).
// Default: use primary DB (storage) so product create works without a Supabase products table.
const useDirectSupabaseProducts =
  process.env.NODE_ENV === "production" &&
  process.env.USE_DIRECT_SUPABASE_PRODUCTS === "true" &&
  Boolean(process.env.SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_KEY);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }
  return { url, key };
}

function toProductResponse(row: Record<string, any>) {
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
    specs: row.specs && typeof row.specs === "object" ? row.specs : {},
    features: Array.isArray(row.features) ? row.features : [],
    whatsInBox: Array.isArray(row.whats_in_box ?? row.whatsInBox) ? (row.whats_in_box ?? row.whatsInBox) : [],
    stock: Number(row.stock ?? 0),
    isActive: Boolean(row.is_active ?? row.isActive),
    isFeatured: Boolean(row.is_featured ?? row.isFeatured),
  };
}

function toProductRow(data: Record<string, unknown>) {
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

async function supabaseFetch(pathname: string, init?: RequestInit): Promise<Response> {
  const { url, key } = getSupabaseConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_PRODUCTS_TIMEOUT_MS);
  try {
    return await fetch(`${url}/rest/v1${pathname}`, {
      ...init,
      signal: controller.signal,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getDirectProductVariantsMap(): Promise<Map<number, ProductColorVariant[]>> {
  const response = await supabaseFetch(`/site_settings?select=key,value&key=like.${encodeURIComponent(`${PRODUCT_COLOR_VARIANTS_PREFIX}%`)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch variants: ${await response.text()}`);
  }
  const rows = (await response.json()) as Array<{ key: string; value: string }>;
  const map = new Map<number, ProductColorVariant[]>();
  for (const row of rows) {
    const productId = parseProductColorVariantsSettingKey(row.key);
    if (productId !== null) {
      map.set(productId, parseProductColorVariants(row.value));
    }
  }
  return map;
}

async function upsertDirectProductVariants(productId: number, variants: ProductColorVariant[]): Promise<void> {
  const key = getProductColorVariantsSettingKey(productId);
  const response = await supabaseFetch("/site_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ key, value: JSON.stringify(variants) }]),
  });
  if (!response.ok) {
    throw new Error(`Failed to save variants: ${await response.text()}`);
  }
}

async function getDirectProductVariants(productId: number): Promise<ProductColorVariant[]> {
  const key = getProductColorVariantsSettingKey(productId);
  const response = await supabaseFetch(`/site_settings?select=value&key=eq.${encodeURIComponent(key)}&limit=1`);
  if (!response.ok) {
    throw new Error(`Failed to load variants: ${await response.text()}`);
  }
  const rows = (await response.json()) as Array<{ value: string }>;
  return parseProductColorVariants(rows[0]?.value);
}


async function getProductColorVariantsMap(): Promise<Map<number, ProductColorVariant[]>> {
  const settings = await storage.getSettings();
  const variantsMap = new Map<number, ProductColorVariant[]>();

  for (const setting of settings) {
    const productId = parseProductColorVariantsSettingKey(setting.key);
    if (productId !== null) {
      variantsMap.set(productId, parseProductColorVariants(setting.value));
    }
  }

  return variantsMap;
}

async function getProductColorVariants(productId: number): Promise<ProductColorVariant[]> {
  const setting = await storage.getSetting(getProductColorVariantsSettingKey(productId));
  return parseProductColorVariants(setting?.value);
}

async function saveProductColorVariants(productId: number, variants: ProductColorVariant[]): Promise<void> {
  await storage.upsertSetting(getProductColorVariantsSettingKey(productId), JSON.stringify(variants));
}

type PayPalMode = "sandbox" | "live";

async function getPayPalConfig() {
  const [paypalEnabledSetting, paypalClientIdSetting, paypalClientSecretSetting, paypalModeSetting] = await Promise.all([
    storage.getSetting("paypalEnabled"),
    storage.getSetting("paypalClientId"),
    storage.getSetting("paypalClientSecret"),
    storage.getSetting("paypalMode"),
  ]);

  // Env vars take priority over database settings for security
  const clientId = process.env.PAYPAL_CLIENT_ID || paypalClientIdSetting?.value || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || paypalClientSecretSetting?.value || "";
  const rawMode = (process.env.PAYPAL_MODE || paypalModeSetting?.value || "sandbox").toLowerCase();
  const mode: PayPalMode = rawMode === "live" ? "live" : "sandbox";
  // PayPal is enabled if env vars are set OR database setting is true
  const paypalEnabled = Boolean(clientId && clientSecret) || paypalEnabledSetting?.value === "true";

  return { paypalEnabled, clientId, clientSecret, mode };
}

function getPayPalApiBase(mode: PayPalMode): string {
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken(clientId: string, clientSecret: string, mode: PayPalMode): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPayPalApiBase(mode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal auth failed: ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/admin/login", (req, res) => {
    try {
      const { username, password } = req.body;
      const adminUser = process.env.ADMIN_USERNAME;
      const adminPass = process.env.ADMIN_PASSWORD;
      if (!adminUser || !adminPass) {
        return res.status(503).json({ error: "Admin credentials not configured" });
      }
      if (username === adminUser && password === adminPass) {
        if (req.session) {
          req.session.isAdmin = true;
        }
        return res.json({ success: true });
      } else {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/admin/session", (req, res) => {
    res.json({ isAdmin: req.session?.isAdmin === true });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  app.post("/api/upload", requireAdmin, upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({ error: "Upload not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY." });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const ext = path.extname(req.file.originalname);
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(name, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ error: "Upload failed" });
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(name);
    res.json({ url: urlData.publicUrl });
  });

  app.get("/api/paypal/config", async (_req, res) => {
    const { paypalEnabled, clientId, mode } = await getPayPalConfig();
    res.json({
      enabled: paypalEnabled && Boolean(clientId),
      clientId,
      mode,
    });
  });

  app.post("/api/paypal/create-order", async (req, res) => {
    const { amount, currency } = req.body as { amount?: string; currency?: string };
    const numericAmount = Number.parseFloat(amount || "");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const { paypalEnabled, clientId, clientSecret, mode } = await getPayPalConfig();
    if (!paypalEnabled) {
      return res.status(400).json({ error: "PayPal is disabled" });
    }
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "PayPal credentials are not configured" });
    }

    try {
      const accessToken = await getPayPalAccessToken(clientId, clientSecret, mode);
      const response = await fetch(`${getPayPalApiBase(mode)}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: (currency || "USD").toUpperCase(),
                value: numericAmount.toFixed(2),
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(500).json({ error: `PayPal create order failed: ${text}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "PayPal create order failed" });
    }
  });

  app.post("/api/paypal/capture-order", async (req, res) => {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    const { paypalEnabled, clientId, clientSecret, mode } = await getPayPalConfig();
    if (!paypalEnabled) {
      return res.status(400).json({ error: "PayPal is disabled" });
    }
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "PayPal credentials are not configured" });
    }

    try {
      const accessToken = await getPayPalAccessToken(clientId, clientSecret, mode);
      const response = await fetch(`${getPayPalApiBase(mode)}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(500).json({ error: `PayPal capture failed: ${text}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "PayPal capture failed" });
    }
  });

  app.get("/api/products", async (_req, res) => {
    try {
      if (useDirectSupabaseProducts) {
        const [productsResponse, variantsMap] = await Promise.all([
          withTimeout(supabaseFetch("/products?select=*"), SUPABASE_PRODUCTS_TIMEOUT_MS, "products query"),
          withTimeout(getDirectProductVariantsMap(), SUPABASE_PRODUCTS_TIMEOUT_MS, "variants query"),
        ]);
        if (!productsResponse.ok) {
          return res.status(500).json({ error: `Products query failed: ${await productsResponse.text()}` });
        }
        const rows = (await productsResponse.json()) as Array<Record<string, any>>;
        const response = rows.map((row) => {
          const product = toProductResponse(row);
          return { ...product, colorVariants: variantsMap.get(product.id) ?? [] };
        });
        return res.json(response);
      }

      const [products, variantsMap] = await Promise.all([
        storage.getProducts(),
        getProductColorVariantsMap(),
      ]);
      const response = products.map((product) => ({
        ...product,
        colorVariants: variantsMap.get(product.id) ?? [],
      }));
      return res.json(response);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      return res.status(500).json({ error: err?.message || "Failed to fetch products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    const product = await storage.getProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const colorVariants = await getProductColorVariants(product.id);
    res.json({ ...product, colorVariants });
  });

  // Debug: check auth and product-create path (no auth required so you can see session state)
  app.get("/api/debug/product-create", (req, res) => {
    res.json({
      isAdmin: req.session?.isAdmin === true,
      useDirectSupabaseProducts: !!useDirectSupabaseProducts,
      hasSupabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
      NODE_ENV: process.env.NODE_ENV,
    });
  });

  app.post("/api/products", requireAdmin, async (req, res) => {
    try {
      console.log("[product-create] Starting, useDirectSupabaseProducts:", useDirectSupabaseProducts);
      const body = req.body as Record<string, unknown>;
      const normalized = { ...body };
      if (typeof normalized.price === "number") normalized.price = String(normalized.price);
      if (typeof normalized.compareAtPrice === "number") normalized.compareAtPrice = String(normalized.compareAtPrice);
      const parsed = insertProductSchema.safeParse(normalized);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        const firstField = flat.fieldErrors && Object.keys(flat.fieldErrors).length
          ? Object.entries(flat.fieldErrors)[0]
          : null;
        const firstForm = flat.formErrors?.length ? flat.formErrors[0] : null;
        const msg = firstField
          ? `${String(firstField[0])}: ${Array.isArray(firstField[1]) ? firstField[1][0] : firstField[1]}`
          : firstForm ?? "Validation failed";
        console.error("[product-create] Validation failed:", msg, flat.fieldErrors);
        return res.status(400).json({ error: `Validation failed — ${msg}` });
      }

      const colorVariants = sanitizeProductColorVariants(body?.colorVariants);

      if (useDirectSupabaseProducts) {
        const productRow = toProductRow(parsed.data as Record<string, unknown>);
        let response: Response;
        try {
          response = await withTimeout(
            supabaseFetch("/products", {
              method: "POST",
              headers: { Prefer: "return=representation" },
              body: JSON.stringify([productRow]),
            }),
            SUPABASE_PRODUCTS_TIMEOUT_MS,
            "create product",
          );
        } catch (supabaseErr: unknown) {
          const msg = supabaseErr instanceof Error ? supabaseErr.message : String(supabaseErr);
          console.error("[product-create] Supabase create failed:", msg);
          const hint = msg.includes("timed out") || msg.includes("fetch")
            ? " Set USE_DIRECT_SUPABASE_PRODUCTS=false to use your primary DB instead."
            : "";
          return res.status(500).json({ error: `Failed to save product: ${msg}${hint}` });
        }
        if (!response.ok) {
          const supabaseError = await response.text();
          console.error("Supabase create product failed:", response.status, supabaseError);
          const hint = /relation|does not exist|404/i.test(supabaseError)
            ? " Set USE_DIRECT_SUPABASE_PRODUCTS=false if Supabase has no products table."
            : "";
          return res.status(500).json({ error: `Failed to save product: ${supabaseError}${hint}` });
        }
        const rows = (await response.json()) as Array<Record<string, any>>;
        const created = toProductResponse(rows[0] ?? {});
        try {
          await withTimeout(upsertDirectProductVariants(created.id, colorVariants), SUPABASE_PRODUCTS_TIMEOUT_MS, "save variants");
        } catch (variantsErr: unknown) {
          const msg = variantsErr instanceof Error ? variantsErr.message : String(variantsErr);
          console.error("[product-create] Save variants failed:", msg);
          return res.status(500).json({ error: `Product created but variants failed: ${msg}` });
        }
        return res.status(201).json({ ...created, colorVariants });
      }

      const product = await withTimeout(
        (async () => {
          const created = await storage.createProduct(parsed.data);
          if (!created) {
            throw new Error("Database did not return the created product");
          }
          await saveProductColorVariants(created.id, colorVariants);
          return created;
        })(),
        STORAGE_PRODUCTS_TIMEOUT_MS,
        "create product (storage)",
      );
      return res.status(201).json({ ...product, colorVariants });
    } catch (err) {
      let message = err instanceof Error ? err.message : String(err ?? "Unknown error");
      if (/unique|duplicate key|slug/i.test(message)) {
        message = "A product with this name/slug already exists. Use a different name or slug.";
      }
      console.error("[product-create] Error:", message, err);
      const isTimeout = /timed out|timeout/i.test(message);
      const status = isTimeout ? 503 : 500;
      return res.status(status).json({ error: `Failed to save product: ${message}` });
    }
  });

  app.patch("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const updateData = { ...(req.body as Record<string, unknown>) };
      const hasColorVariants = Object.prototype.hasOwnProperty.call(updateData, "colorVariants");
      delete updateData.colorVariants;

      if (useDirectSupabaseProducts) {
        const patchRow = toProductRow(updateData);
        let product: Record<string, any> | null = null;
        if (Object.keys(patchRow).length > 0) {
          const response = await withTimeout(
            supabaseFetch(`/products?id=eq.${id}&select=*`, {
              method: "PATCH",
              headers: { Prefer: "return=representation" },
              body: JSON.stringify(patchRow),
            }),
            SUPABASE_PRODUCTS_TIMEOUT_MS,
            "update product",
          );
          if (!response.ok) {
            return res.status(500).json({ error: `Failed to update product: ${await response.text()}` });
          }
          const rows = (await response.json()) as Array<Record<string, any>>;
          product = rows[0] ?? null;
        } else {
          const response = await withTimeout(
            supabaseFetch(`/products?select=*&id=eq.${id}&limit=1`),
            SUPABASE_PRODUCTS_TIMEOUT_MS,
            "fetch product",
          );
          if (!response.ok) {
            return res.status(500).json({ error: `Failed to fetch product: ${await response.text()}` });
          }
          const rows = (await response.json()) as Array<Record<string, any>>;
          product = rows[0] ?? null;
        }
        if (!product) return res.status(404).json({ error: "Product not found" });

        let colorVariants = await withTimeout(getDirectProductVariants(id), SUPABASE_PRODUCTS_TIMEOUT_MS, "load variants");
        if (hasColorVariants) {
          colorVariants = sanitizeProductColorVariants(req.body?.colorVariants);
          await withTimeout(upsertDirectProductVariants(id, colorVariants), SUPABASE_PRODUCTS_TIMEOUT_MS, "save variants");
        }
        return res.json({ ...toProductResponse(product), colorVariants });
      }

      const product = await withTimeout(
        (async () => {
          const updated = await storage.updateProduct(id, updateData as any);
          if (!updated) return undefined;
          let variants = await getProductColorVariants(id);
          if (hasColorVariants) {
            variants = sanitizeProductColorVariants(req.body?.colorVariants);
            await saveProductColorVariants(id, variants);
          }
          return { ...updated, colorVariants: variants };
        })(),
        STORAGE_PRODUCTS_TIMEOUT_MS,
        "update product (storage)",
      );
      if (!product) return res.status(404).json({ error: "Product not found" });
      return res.json(product);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err ?? "Unknown error");
      console.error("Failed to update product:", message, err);
      const isTimeout = /timed out|timeout/i.test(message);
      const status = isTimeout ? 503 : 500;
      return res.status(status).json({ error: `Failed to update product: ${message}` });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    if (useDirectSupabaseProducts) {
      try {
        const response = await withTimeout(
          supabaseFetch(`/products?id=eq.${id}`, { method: "DELETE" }),
          SUPABASE_PRODUCTS_TIMEOUT_MS,
          "delete product",
        );
        if (!response.ok) {
          return res.status(500).json({ error: `Failed to delete product: ${await response.text()}` });
        }
        await withTimeout(upsertDirectProductVariants(id, []), SUPABASE_PRODUCTS_TIMEOUT_MS, "clear variants");
        return res.status(204).send();
      } catch (err: any) {
        console.error("Failed to delete product:", err);
        return res.status(500).json({ error: err?.message || "Failed to delete product" });
      }
    }
    await storage.deleteProduct(id);
    await saveProductColorVariants(id, []);
    return res.status(204).send();
  });

  app.get("/api/orders", requireAdmin, async (_req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    const orderNumber = `NVZ-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const orderData = { ...req.body, orderNumber };
    const parsed = insertOrderSchema.safeParse(orderData);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const order = await storage.createOrder(parsed.data);

    // Simulate sending an email invoice
    console.log(`[EMAIL] Sending invoice for order ${order.orderNumber} to ${order.customerEmail}`);
    console.log(`[EMAIL] Details: ${order.items.length} items, Total: ${order.total}`);

    res.status(201).json(order);
  });

  app.patch("/api/orders/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const order = await storage.updateOrder(id, req.body);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  });

  app.get("/api/reviews", async (_req, res) => {
    const reviews = await storage.getReviews();
    res.json(reviews);
  });

  app.post("/api/reviews", async (req, res) => {
    const parsed = insertReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const review = await storage.createReview(parsed.data);
    res.status(201).json(review);
  });

  app.post("/api/subscribers", async (req, res) => {
    const parsed = insertSubscriberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const subscriber = await storage.createSubscriber(parsed.data);
      res.status(201).json(subscriber);
    } catch (error: any) {
      if (error.message?.includes("unique")) {
        return res.status(409).json({ error: "Already subscribed" });
      }
      throw error;
    }
  });

  app.get("/api/settings", async (_req, res) => {
    const settings = await storage.getSettings();
    const settingsObj: Record<string, string> = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }
    res.json(settingsObj);
  });

  app.patch("/api/settings", requireAdmin, async (req, res) => {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      if (typeof key === "string" && typeof value === "string") {
        await storage.upsertSetting(key, value);
      }
    }
    const settings = await storage.getSettings();
    const settingsObj: Record<string, string> = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }
    res.json(settingsObj);
  });

  app.delete("/api/orders", requireAdmin, async (_req, res) => {
    await storage.deleteAllOrders();
    res.status(204).send();
  });

  app.post("/api/contact", async (req, res) => {
    const parsed = insertContactSubmissionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const submission = await storage.createContactSubmission(parsed.data);
    res.status(201).json(submission);
  });

  app.get("/api/contact", requireAdmin, async (_req, res) => {
    const submissions = await storage.getContactSubmissions();
    res.json(submissions);
  });

  app.patch("/api/contact/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const submission = await storage.updateContactSubmission(id, req.body);
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    res.json(submission);
  });

  app.delete("/api/contact/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    await storage.deleteContactSubmission(id);
    res.status(204).send();
  });

  app.get("/api/track/:orderNumber", async (req, res) => {
    const order = await storage.getOrderByOrderNumber(req.params.orderNumber);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items,
      total: order.total,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
    });
  });

  return httpServer;
}
