import { storage } from "../../server/storage.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const settings = await storage.getSettings();
    const settingsObj: Record<string, string> = {};
    for (const s of settings) settingsObj[s.key] = s.value;

    const publishableKey = (process.env.STRIPE_PUBLISHABLE_KEY || settingsObj.stripePublicKey || "").trim();
    const hasSecret = Boolean((process.env.STRIPE_SECRET_KEY || settingsObj.stripeSecretKey || "").trim());
    const stripeEnabled = settingsObj.stripeEnabled === "true";
    const enabled = stripeEnabled && publishableKey && hasSecret;

    res.setHeader("Cache-Control", "public, max-age=60");
    res.status(200).json({
      enabled,
      publishableKey,
    });
  } catch (err) {
    console.error("Stripe config error:", err);
    res.status(500).json({ enabled: false, publishableKey: "" });
  }
}
