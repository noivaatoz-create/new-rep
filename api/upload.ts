import { createClient } from "@supabase/supabase-js";
import cookieSession from "cookie-session";
import express from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

const app = express();
app.set("trust proxy", 1);
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

app.post("/api/upload", requireAdmin, upload.single("image"), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        error: "Upload not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.",
      });
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
    return res.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default app;
