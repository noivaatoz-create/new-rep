import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
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
import { sendOrderInvoice } from "./email.js";
import { pushOrderToVeeqo } from "./veeqo.js";

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

// Timeout for product/storage operations (Neon/primary DB). Override with env if needed.
const STORAGE_PRODUCTS_TIMEOUT_MS = Number.parseInt(process.env.STORAGE_PRODUCTS_TIMEOUT_MS ?? "60000", 10);

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
      const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
      const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
      const adminUser = (process.env.ADMIN_USERNAME || "adminpokemon").trim();
      const adminPass = (process.env.ADMIN_PASSWORD || "pokemonadmin").trim();
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
    const ext = path.extname(req.file.originalname);
    const name = `uploads/${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    try {
      if (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(name, req.file.buffer, {
          access: "public",
          contentType: req.file.mimetype,
        });
        return res.json({ url: blob.url });
      }
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, path.basename(name)), req.file.buffer);
      return res.json({ url: `/uploads/${path.basename(name)}` });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({
        error: process.env.VERCEL
          ? "Image upload failed. Add Blob store in Vercel and set BLOB_READ_WRITE_TOKEN."
          : "Upload failed",
      });
    }
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
      const [productsList, variantsMap] = await Promise.all([
        storage.getProducts(),
        getProductColorVariantsMap(),
      ]);
      const response = productsList.map((product) => ({
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

  app.get("/api/debug/product-create", (req, res) => {
    res.json({ isAdmin: req.session?.isAdmin === true, NODE_ENV: process.env.NODE_ENV });
  });

  app.get("/api/debug/db", (_req, res) => {
    const fromNeon = process.env.NEON_DATABASE_URL?.trim();
    const fromDb = process.env.DATABASE_URL?.trim();
    const url = fromNeon || fromDb;
    const source = fromNeon ? "NEON_DATABASE_URL" : fromDb ? "DATABASE_URL" : null;
    if (!url) return res.json({ ok: false, error: "DATABASE_URL / NEON_DATABASE_URL not set", host: null, source });
    try {
      const u = new URL(url);
      const host = u.hostname;
      const ok = host.length > 3 && host !== "base" && (process.env.VERCEL ? !/^localhost$/i.test(host) : true);
      return res.json({
        ok,
        host,
        source,
        hint: !ok ? "On Vercel set NEON_DATABASE_URL to your Neon URL (so Vercel Postgres doesn't override DATABASE_URL)." : null,
      });
    } catch (e) {
      return res.json({ ok: false, error: "URL invalid", host: null, source });
    }
  });

  app.post("/api/products", requireAdmin, async (req, res) => {
    try {
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
      const product = await withTimeout(
        (async () => {
          const created = await storage.createProduct(parsed.data);
          if (!created) throw new Error("Database did not return the created product");
          await saveProductColorVariants(created.id, colorVariants);
          return created;
        })(),
        STORAGE_PRODUCTS_TIMEOUT_MS,
        "create product",
      );
      return res.status(201).json({ ...product, colorVariants });
    } catch (err) {
      let message = err instanceof Error ? err.message : String(err ?? "Unknown error");
      if (/unique|duplicate key|slug/i.test(message)) {
        message = "A product with this name/slug already exists. Use a different name or slug.";
      }
      console.error("[product-create] Error:", message, err);
      const isTimeout = /timed out|timeout/i.test(message);
      return res.status(isTimeout ? 503 : 500).json({ error: `Failed to save product: ${message}` });
    }
  });

  app.patch("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const updateData = { ...(req.body as Record<string, unknown>) };
      const hasColorVariants = Object.prototype.hasOwnProperty.call(updateData, "colorVariants");
      delete updateData.colorVariants;
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
        "update product",
      );
      if (!product) return res.status(404).json({ error: "Product not found" });
      return res.json(product);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err ?? "Unknown error");
      console.error("Failed to update product:", message, err);
      const isTimeout = /timed out|timeout/i.test(message);
      return res.status(isTimeout ? 503 : 500).json({ error: `Failed to update product: ${message}` });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    try {
      await saveProductColorVariants(id, []);
      await storage.deleteProduct(id);
      return res.status(204).send();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err ?? "Unknown error");
      console.error("Failed to delete product:", id, message, err);
      return res.status(500).json({ error: `Failed to delete product: ${message}` });
    }
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

    // Send invoice email (non-blocking; don't fail order if email fails)
    sendOrderInvoice({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      items: order.items,
      subtotal: String(order.subtotal),
      shipping: String(order.shipping),
      tax: String(order.tax),
      total: String(order.total),
      status: order.status,
    }).catch((err) => console.error("[EMAIL] Invoice send failed:", err));

    // Push order to Veeqo if configured (non-blocking)
    (async () => {
      try {
        const settings = await storage.getSettings();
        const settingsObj: Record<string, string> = {};
        for (const s of settings) {
          settingsObj[s.key] = s.value;
        }
        const result = await pushOrderToVeeqo({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          shippingAddress: order.shippingAddress,
          items: order.items,
          paymentProvider: order.paymentProvider ?? null,
          paymentId: order.paymentId ?? null,
        }, settingsObj);
        if (result.ok) {
          if (result.veeqoOrderId) console.log("[VEEQO] Order pushed:", order.orderNumber, "→ Veeqo ID", result.veeqoOrderId);
        } else {
          console.warn("[VEEQO] Push failed:", order.orderNumber, result.error);
        }
      } catch (err) {
        console.error("[VEEQO] Push error:", err);
      }
    })();

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

  app.get("/api/subscribers", requireAdmin, async (_req, res) => {
    const subscribers = await storage.getSubscribers();
    res.json(subscribers);
  });

  app.delete("/api/subscribers/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    await storage.deleteSubscriber(id);
    res.status(204).send();
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
