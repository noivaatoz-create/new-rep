import cookieSession from "cookie-session";
import express from "express";
import { storage } from "../../server/storage.js";
import { getProductColorVariantsSettingKey } from "../../shared/color-variants.js";

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

app.delete("/api/products/:id", async (req: any, res: any) => {
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
