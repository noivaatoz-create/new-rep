import cookieSession from "cookie-session";
import express from "express";
import { storage } from "../../server/storage.js";

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
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

app.patch("/api/orders/:id", requireAdmin, async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  const order = await storage.updateOrder(id, req.body as Record<string, unknown>);
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});

export default app;
