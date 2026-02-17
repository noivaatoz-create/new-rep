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

    // On Vercel serverless there is no persistent disk; use local uploads folder when available
    const uploadsDir = path.join(process.cwd(), "uploads");
    const canWrite = !process.env.VERCEL && (() => {
      try {
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        return true;
      } catch {
        return false;
      }
    })();

    if (!canWrite) {
      return res.status(503).json({
        error: "Image upload on Vercel is not configured. Use local deploy for uploads or add Vercel Blob.",
      });
    }

    const ext = path.extname(req.file.originalname);
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    fs.writeFileSync(path.join(uploadsDir, name), req.file.buffer);
    return res.json({ url: `/uploads/${name}` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default app;
