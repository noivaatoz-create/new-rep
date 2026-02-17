import { storage } from "../../server/storage.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const [paypalEnabledSetting, paypalClientIdSetting, paypalClientSecretSetting, paypalModeSetting] = await Promise.all([
      storage.getSetting("paypalEnabled"),
      storage.getSetting("paypalClientId"),
      storage.getSetting("paypalClientSecret"),
      storage.getSetting("paypalMode"),
    ]);
    const clientId = process.env.PAYPAL_CLIENT_ID || paypalClientIdSetting?.value || "";
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || paypalClientSecretSetting?.value || "";
    const rawMode = (process.env.PAYPAL_MODE || paypalModeSetting?.value || "sandbox").toLowerCase();
    const mode = rawMode === "live" ? "live" : "sandbox";
    const paypalEnabled = Boolean(clientId && clientSecret) || paypalEnabledSetting?.value === "true";
    res.setHeader("Cache-Control", "public, max-age=60");
    res.status(200).json({
      enabled: paypalEnabled && Boolean(clientId),
      clientId,
      mode,
    });
  } catch (err) {
    console.error("PayPal config error:", err);
    res.status(500).json({ enabled: false, clientId: "", mode: "sandbox" });
  }
}
