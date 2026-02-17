import cookieSession from "cookie-session";
import express from "express";
import { storage } from "../server/storage.js";

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

function requireAdmin(req: any, res: any, next: any) {
  if (req.session?.isAdmin) return next();
  res.status(401).json({ error: "Unauthorized" });
}

app.get("/api/settings", async (_req: any, res: any) => {
  try {
    const settings = await storage.getSettings();
    const obj: Record<string, string> = {};
    for (const s of settings) obj[s.key] = s.value;
    res.json(obj);
  } catch (err) {
    console.error("Settings GET error:", err);
    // Return 200 with empty object so Settings page loads (user may need to set DATABASE_URL)
    res.status(200).json({});
  }
});

app.patch("/api/settings", requireAdmin, async (req: any, res: any) => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates || {})) {
      if (typeof key === "string" && typeof value === "string") {
        await storage.upsertSetting(key, value);
      }
    }
    const settings = await storage.getSettings();
    const obj: Record<string, string> = {};
    for (const s of settings) obj[s.key] = s.value;
    res.json(obj);
  } catch (err) {
    console.error("Settings PATCH error:", err);
    res.status(500).json({ error: "Failed to save" });
  }
});

export default app;
