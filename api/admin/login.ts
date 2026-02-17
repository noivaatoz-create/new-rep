import cookieSession from "cookie-session";
import express from "express";

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

app.post("/api/admin/login", (req: any, res: any) => {
  try {
    const { username, password } = req.body || {};
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminUser || !adminPass) {
      return res.status(503).json({ error: "Admin credentials not configured" });
    }
    if (username === adminUser && password === adminPass) {
      if (req.session) req.session.isAdmin = true;
      return res.json({ success: true });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

export default app;
