import Stripe from "stripe";
import { storage } from "../../server/storage.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const settings = await storage.getSettings();
    const settingsObj: Record<string, string> = {};
    for (const s of settings) settingsObj[s.key] = s.value;

    const secretKey = (process.env.STRIPE_SECRET_KEY || settingsObj.stripeSecretKey || "").trim();
    const stripeEnabled = settingsObj.stripeEnabled === "true" || Boolean(process.env.STRIPE_SECRET_KEY);

    if (!stripeEnabled || !secretKey) {
      return res.status(400).json({ error: "Stripe is not configured or disabled" });
    }

    const { amount, currency } = (req.body || {}) as { amount?: number; currency?: string };
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 50) {
      return res.status(400).json({ error: "Invalid amount (minimum 0.50)" });
    }

    const curr = (currency || settingsObj.currency || "usd").toString().toLowerCase().slice(0, 3);

    const stripe = new Stripe(secretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: curr,
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("[Stripe] create-payment-intent error:", err);
    res.status(500).json({ error: err?.message || "Failed to create payment intent" });
  }
}
