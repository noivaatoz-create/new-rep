import { put } from "@vercel/blob";
import cookieSession from "cookie-session";
import express from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";

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

    const ext = path.extname(req.file.originalname);
    const name = `uploads/${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;

    // Vercel: use Vercel Blob (needs BLOB_READ_WRITE_TOKEN + Blob store in dashboard)
    if (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(name, req.file.buffer, {
        access: "public",
        contentType: req.file.mimetype,
      });
      return res.json({ url: blob.url });
    }

    // Local: save to uploads/ folder
    const uploadsDir = path.join(process.cwd(), "uploads");
    try {
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, path.basename(name)), req.file.buffer);
      return res.json({ url: `/uploads/${path.basename(name)}` });
    } catch {
      return res.status(503).json({
        error: "Image upload not available. On Vercel: add Blob store and BLOB_READ_WRITE_TOKEN.",
      });
    }
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default app;
