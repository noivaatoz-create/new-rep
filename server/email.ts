import { Resend } from "resend";

type OrderItem = { name: string; price: string; quantity: number; image?: string };
type OrderForEmail = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  status: string;
};

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const fromEmail = process.env.FROM_EMAIL?.trim() || "Novaatoz <onboarding@resend.dev>";
const storeName = process.env.STORE_NAME?.trim() || "Novaatoz";

function buildInvoiceHtml(order: OrderForEmail): string {
  const rows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.name)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">$${item.price}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order ${escapeHtml(order.orderNumber)}</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h1 style="color:#111">Thank you for your order!</h1>
  <p>Hi ${escapeHtml(order.customerName)},</p>
  <p>Your order <strong>#${escapeHtml(order.orderNumber)}</strong> has been confirmed${order.status === "paid" ? " and paid" : ""}.</p>
  <h2 style="margin-top:24px;font-size:18px">Order summary</h2>
  <table style="width:100%;border-collapse:collapse;margin-top:8px">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:10px;text-align:left">Item</th>
        <th style="padding:10px;text-align:center">Qty</th>
        <th style="padding:10px;text-align:right">Price</th>
        <th style="padding:10px;text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <table style="width:100%;margin-top:16px;font-size:14px">
    <tr><td style="padding:4px 0">Subtotal</td><td style="text-align:right">$${order.subtotal}</td></tr>
    <tr><td style="padding:4px 0">Shipping</td><td style="text-align:right">$${order.shipping}</td></tr>
    <tr><td style="padding:4px 0">Tax</td><td style="text-align:right">$${order.tax}</td></tr>
    <tr style="font-weight:bold;font-size:16px"><td style="padding:8px 0">Total</td><td style="text-align:right">$${order.total}</td></tr>
  </table>
  <p style="margin-top:24px"><strong>Shipping address</strong><br/>${escapeHtml(order.shippingAddress)}</p>
  <p style="margin-top:24px;color:#666;font-size:14px">If you have any questions, reply to this email or contact our support.</p>
  <p style="margin-top:16px;color:#666;font-size:14px">— ${escapeHtml(storeName)}</p>
</body>
</html>`;
}

function buildInvoiceText(order: OrderForEmail): string {
  const itemLines = order.items
    .map((item) => {
      const lineTotal = (Number(item.price) * item.quantity).toFixed(2);
      return `- ${item.name} x${item.quantity} @ $${item.price} = $${lineTotal}`;
    })
    .join("\n");

  return [
    `Thank you for your order, ${order.customerName}!`,
    ``,
    `Order #${order.orderNumber} has been confirmed${order.status === "paid" ? " and paid" : ""}.`,
    ``,
    `Order summary:`,
    itemLines,
    ``,
    `Subtotal: $${order.subtotal}`,
    `Shipping: $${order.shipping}`,
    `Tax: $${order.tax}`,
    `Total: $${order.total}`,
    ``,
    `Shipping address:`,
    order.shippingAddress,
    ``,
    `- ${storeName}`,
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendOrderInvoice(order: OrderForEmail): Promise<{ ok: boolean; error?: string }> {
  if (!resendApiKey) {
    console.log("[EMAIL] RESEND_API_KEY not set, skipping invoice email to", order.customerEmail);
    return { ok: false, error: "RESEND_API_KEY not set" };
  }
  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [order.customerEmail],
      subject: `Order #${order.orderNumber} confirmed – ${storeName}`,
      html: buildInvoiceHtml(order),
      text: buildInvoiceText(order),
    });
    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return { ok: false, error: String(error.message ?? error) };
    }
    console.log("[EMAIL] Invoice sent for order", order.orderNumber, "to", order.customerEmail, data?.id);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[EMAIL] Failed to send invoice:", message, err);
    return { ok: false, error: message };
  }
}
