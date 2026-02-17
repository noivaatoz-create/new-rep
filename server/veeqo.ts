/**
 * Push store orders to Veeqo (https://app.veeqo.com/orders).
 * Set VEEQO_API_KEY, VEEQO_CHANNEL_ID, VEEQO_DELIVERY_METHOD_ID, and optionally
 * VEEQO_DEFAULT_SELLABLE_ID in .env to enable.
 */

const VEEQO_API_BASE = "https://api.veeqo.com";

type OrderItem = { productId: number; name: string; price: string; quantity: number; image?: string };

type OrderForVeeqo = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderItem[];
  paymentProvider: string | null;
  paymentId: string | null;
};

function getEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

/** Map payment provider to Veeqo payment_type */
function toVeeqoPaymentType(provider: string | null): string {
  if (!provider) return "none";
  const p = provider.toLowerCase();
  if (p === "paypal") return "paypal";
  if (p === "paypal_express") return "paypal_express";
  if (p === "credit_card" || p === "card") return "credit_card";
  if (p === "bank_transfer") return "bank_transfer";
  if (p === "cash") return "cash";
  if (p === "checkmo") return "checkmo";
  return "credit_card";
}

/** Split "First Last" into first_name and last_name */
function splitName(full: string): { first_name: string; last_name: string } {
  const trimmed = full.trim();
  const space = trimmed.indexOf(" ");
  if (space <= 0) return { first_name: trimmed || "Customer", last_name: "" };
  return {
    first_name: trimmed.slice(0, space),
    last_name: trimmed.slice(space + 1).trim(),
  };
}

/**
 * Push a single order to Veeqo. No-op if env is not configured.
 * Returns { ok: true, veeqoOrderId?: number } or { ok: false, error: string }.
 */
export async function pushOrderToVeeqo(order: OrderForVeeqo): Promise<
  | { ok: true; veeqoOrderId?: number }
  | { ok: false; error: string }
> {
  const apiKey = getEnv("VEEQO_API_KEY");
  const channelId = getEnv("VEEQO_CHANNEL_ID");
  const deliveryMethodId = getEnv("VEEQO_DELIVERY_METHOD_ID");
  const defaultSellableId = getEnv("VEEQO_DEFAULT_SELLABLE_ID");

  if (!apiKey || !channelId || !deliveryMethodId) {
    return { ok: false, error: "Veeqo not configured (VEEQO_API_KEY, VEEQO_CHANNEL_ID, VEEQO_DELIVERY_METHOD_ID)" };
  }

  const sellableId = defaultSellableId ? parseInt(defaultSellableId, 10) : null;
  if (!sellableId || isNaN(sellableId)) {
    return { ok: false, error: "VEEQO_DEFAULT_SELLABLE_ID must be a valid number (Veeqo product/sellable ID)" };
  }

  const { first_name, last_name } = splitName(order.customerName);

  const body = {
    order: {
      channel_id: parseInt(channelId, 10),
      delivery_method_id: parseInt(deliveryMethodId, 10),
      number: order.orderNumber,
      send_notification_email: true,
      customer_attributes: {
        email: order.customerEmail,
        first_name,
        last_name: last_name || first_name,
      },
      deliver_to_attributes: {
        first_name,
        last_name: last_name || first_name,
        address1: order.shippingAddress || "Address not provided",
        country: getEnv("VEEQO_DEFAULT_COUNTRY") || "US",
      },
      line_items_attributes: order.items.map((item) => ({
        sellable_id: sellableId,
        price_per_unit: parseFloat(item.price) || 0,
        quantity: item.quantity || 1,
      })),
      payment_attributes:
        order.paymentProvider || order.paymentId
          ? {
              payment_type: toVeeqoPaymentType(order.paymentProvider),
              reference_number: order.paymentId || order.orderNumber,
            }
          : undefined,
    },
  };

  try {
    const res = await fetch(`${VEEQO_API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || res.statusText || `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    const veeqoOrderId = typeof data?.id === "number" ? data.id : undefined;
    return { ok: true, veeqoOrderId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
