import cookieSession from "cookie-session";
import express from "express";
import { storage } from "../../server/storage.js";

type PayPalMode = "sandbox" | "live";

async function getPayPalConfig() {
  const [paypalEnabledSetting, paypalClientIdSetting, paypalClientSecretSetting, paypalModeSetting] = await Promise.all([
    storage.getSetting("paypalEnabled"),
    storage.getSetting("paypalClientId"),
    storage.getSetting("paypalClientSecret"),
    storage.getSetting("paypalMode"),
  ]);
  const clientId = process.env.PAYPAL_CLIENT_ID || paypalClientIdSetting?.value || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || paypalClientSecretSetting?.value || "";
  const rawMode = (process.env.PAYPAL_MODE || paypalModeSetting?.value || "sandbox").toLowerCase();
  const mode: PayPalMode = rawMode === "live" ? "live" : "sandbox";
  const paypalEnabled = Boolean(clientId && clientSecret) || paypalEnabledSetting?.value === "true";
  return { paypalEnabled, clientId, clientSecret, mode };
}

function getPayPalApiBase(mode: PayPalMode): string {
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken(clientId: string, clientSecret: string, mode: PayPalMode): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPayPalApiBase(mode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal auth failed: ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
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

app.post("/api/paypal/create-order", async (req: express.Request, res: express.Response) => {
  const { amount, currency } = req.body as { amount?: string; currency?: string };
  const numericAmount = Number.parseFloat(amount || "");
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const { paypalEnabled, clientId, clientSecret, mode } = await getPayPalConfig();
  if (!paypalEnabled) {
    return res.status(400).json({ error: "PayPal is disabled" });
  }
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "PayPal credentials are not configured" });
  }

  try {
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, mode);
    const response = await fetch(`${getPayPalApiBase(mode)}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: (currency || "USD").toUpperCase(),
              value: numericAmount.toFixed(2),
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: `PayPal create order failed: ${text}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "PayPal create order failed" });
  }
});

export default app;
