import cookieSession from "cookie-session";
import express from "express";

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

app.get("/api/admin/session", (req: any, res: any) => {
  res.json({ isAdmin: req.session?.isAdmin === true });
});

export default app;
