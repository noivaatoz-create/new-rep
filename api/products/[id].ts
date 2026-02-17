import cookieSession from "cookie-session";
import express from "express";
import { storage } from "../../server/storage.js";
import {
  getProductColorVariantsSettingKey,
  parseProductColorVariants,
  sanitizeProductColorVariants,
  type ProductColorVariant,
} from "../../shared/color-variants.js";

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

async function getProductColorVariants(productId: number): Promise<ProductColorVariant[]> {
  const setting = await storage.getSetting(getProductColorVariantsSettingKey(productId));
  return parseProductColorVariants(setting?.value);
}

async function saveProductColorVariants(productId: number, variants: ProductColorVariant[]): Promise<void> {
  await storage.upsertSetting(getProductColorVariantsSettingKey(productId), JSON.stringify(variants));
}

function requireAdmin(req: any, res: any, next: any) {
  if (req.session?.isAdmin) next();
  else res.status(401).json({ error: "Unauthorized. Please log in as admin." });
}

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET || "novaatoz-admin-secret"],
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  })
);

app.patch("/api/products/:id", requireAdmin, async (req: any, res: any) => {
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

app.delete("/api/products/:id", requireAdmin, async (req: any, res: any) => {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  try {
    await storage.upsertSetting(getProductColorVariantsSettingKey(id), "[]");
    await storage.deleteProduct(id);
    return res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? "Unknown error");
    console.error("Delete product failed:", id, message, err);
    return res.status(500).json({ error: `Failed to delete product: ${message}` });
  }
});

export default app;
