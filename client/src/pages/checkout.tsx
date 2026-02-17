import { useCartStore } from "@/lib/cart-store";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Lock, ArrowLeft, Truck, ShieldCheck, Banknote } from "lucide-react";
import { SiStripe, SiPaypal } from "react-icons/si";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalConfig {
  enabled: boolean;
  clientId: string;
  mode: "sandbox" | "live";
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart, getItemCount } = useCartStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "cod">("stripe");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paypalApproved, setPaypalApproved] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState("");
  const [paypalLoading, setPaypalLoading] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { data: paypalConfig } = useQuery<PayPalConfig>({ queryKey: ["/api/paypal/config"] });

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });

  const total = getTotal();
  const taxRate = parseFloat(settings?.taxRate || "0.08");
  const freeShippingThreshold = parseFloat(settings?.freeShippingThreshold || "75");
  const shippingFlatRate = parseFloat(settings?.shippingFlatRate || "9.99");
  const shipping = total >= freeShippingThreshold ? 0 : shippingFlatRate;
  const tax = total * taxRate;
  const grandTotal = total + shipping + tax;

  const grandTotalRef = useRef(grandTotal);
  const currencyRef = useRef(settings?.currency || "USD");
  grandTotalRef.current = grandTotal;
  currencyRef.current = settings?.currency || "USD";

  const stripeEnabled = settings?.stripeEnabled === "true";
  const paypalEnabled = settings?.paypalEnabled === "true" || paypalConfig?.enabled === true;
  const codEnabled = settings?.codEnabled === "true";
  const noMethodsConfigured = !stripeEnabled && !paypalEnabled && !codEnabled;
  const showStripe = noMethodsConfigured || stripeEnabled;
  const showPaypal = noMethodsConfigured || paypalEnabled;
  const showCod = codEnabled;

  useEffect(() => {
    if (settings) {
      if (showStripe) setPaymentMethod("stripe");
      else if (showPaypal) setPaymentMethod("paypal");
      else if (showCod) setPaymentMethod("cod");
    }
  }, [settings, showStripe, showPaypal, showCod]);

  useEffect(() => {
    if (paymentMethod !== "paypal") {
      setPaypalApproved(false);
      setPaypalOrderId("");
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (paymentMethod !== "paypal" || !showPaypal || !paypalConfig?.enabled || !paypalConfig.clientId) {
      if (paymentMethod === "paypal" && (!paypalConfig?.clientId || !paypalConfig?.enabled)) {
        toast({
          title: "PayPal not configured",
          description: "Add PayPal Client ID in Admin → Settings → Payment to enable PayPal checkout.",
          variant: "destructive",
        });
      }
      return;
    }

    let cancelled = false;
    const container = document.getElementById("paypal-button-container");
    if (container) {
      container.innerHTML = "";
    }

    const renderButtons = () => {
      if (cancelled || !window.paypal || !container) {
        return;
      }

      container.innerHTML = "";
      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "pill",
            label: "paypal",
            height: 44,
          },
          createOrder: async () => {
            try {
              const amount = grandTotalRef.current.toFixed(2);
              const currency = currencyRef.current;
              const response = await apiRequest("POST", "/api/paypal/create-order", {
                amount,
                currency,
              });
              if (!response.ok) {
                const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
                throw new Error(err.error || "Failed to create PayPal order");
              }
              const data = await response.json();
              if (!data.id) {
                throw new Error("PayPal order ID missing");
              }
              return data.id;
            } catch (err) {
              console.error("[PayPal] createOrder error:", err);
              const message = err instanceof Error ? err.message : "Failed to create order";
              toast({
                title: "PayPal error",
                description: message,
                variant: "destructive",
              });
              throw err;
            }
          },
          onApprove: async (data: { orderID: string }) => {
            setPaypalLoading(true);
            try {
              const response = await apiRequest("POST", "/api/paypal/capture-order", {
                orderId: data.orderID,
              });
              const capture = await response.json();
              setPaypalOrderId(capture.id || data.orderID);
              setPaypalApproved(true);
              toast({
                title: "Payment approved",
                description: "Your PayPal payment has been confirmed. Place your order to complete.",
              });
            } catch {
              toast({
                title: "Payment capture failed",
                description: "Unable to process payment. Please try again.",
                variant: "destructive",
              });
            } finally {
              setPaypalLoading(false);
            }
          },
          onError: (err: any) => {
            console.error("[PayPal] SDK error:", err);
            const message = err?.message || err?.toString() || "Unable to start PayPal checkout";
            toast({
              title: "Payment error",
              description: message,
              variant: "destructive",
            });
          },
        })
        .render("#paypal-button-container");
    };

    const existingScript = document.querySelector('script[data-paypal-sdk="true"]') as HTMLScriptElement | null;
    if (existingScript) {
      if (window.paypal) {
        renderButtons();
      } else {
        existingScript.addEventListener("load", renderButtons);
      }
      return () => {
        cancelled = true;
        existingScript.removeEventListener("load", renderButtons);
      };
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalConfig.clientId)}&currency=${encodeURIComponent(settings?.currency || "USD")}&intent=capture`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = renderButtons;
    script.onerror = () => {
      console.error("[PayPal] SDK script failed to load");
      toast({
        title: "PayPal error",
        description: "Failed to load PayPal SDK. Check your Client ID in Admin → Settings.",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [paymentMethod, showPaypal, paypalConfig?.enabled, paypalConfig?.clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (paymentMethod === "paypal" && !paypalApproved) {
      toast({
        title: "PayPal approval required",
        description: "Please complete PayPal payment before placing your order.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customerName: form.name,
        customerEmail: form.email,
        shippingAddress: `${form.address}, ${form.city}, ${form.state} ${form.zip}, ${form.country}`,
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal: total.toFixed(2),
        shipping: shipping.toFixed(2),
        tax: tax.toFixed(2),
        total: grandTotal.toFixed(2),
        paymentProvider: paymentMethod,
        paymentId: paymentMethod === "paypal" ? paypalOrderId : null,
        status: paymentMethod === "paypal" ? "paid" : "pending",
      };

      const res = await apiRequest("POST", "/api/orders", orderData);
      const order = await res.json();
      clearCart();
      toast({ title: "Order confirmed!", description: "Check your email for the invoice. Redirecting to confirmation…" });
      navigate(`/checkout/success?order=${order.orderNumber}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products to proceed to checkout.</p>
          <Link href="/shop">
            <button className="rounded-full bg-foreground px-7 py-2.5 text-sm font-medium text-background tracking-wide" data-testid="button-back-to-shop">
              Back to Shop
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors tracking-wide" data-testid="link-back-shop">
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <h1 className="text-3xl font-serif text-foreground mb-10" data-testid="text-checkout-title">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping */}
              <div className="rounded-2xl border border-border/60 bg-card/50 p-7">
                <h2 className="text-base font-medium text-foreground mb-6 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/8 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">Full Name</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-sm" placeholder="John Doe" data-testid="input-checkout-name" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">Email</label>
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-sm" placeholder="john@example.com" data-testid="input-checkout-email" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">Address</label>
                    <input type="text" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-sm" placeholder="123 Main St" data-testid="input-checkout-address" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">City</label>
                    <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-sm" placeholder="San Francisco" data-testid="input-checkout-city" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">State</label>
                      <input type="text" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-sm" placeholder="CA" data-testid="input-checkout-state" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">ZIP</label>
                      <input type="text" required value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-sm" placeholder="94102" data-testid="input-checkout-zip" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="rounded-2xl border border-border/60 bg-card/50 p-7">
                <h2 className="text-base font-medium text-foreground mb-6 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/8 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  Payment Method
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {showStripe && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("stripe")}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === "stripe"
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:border-foreground/20"
                        }`}
                      data-testid="button-payment-stripe"
                    >
                      <SiStripe className="h-5 w-5 text-[#635BFF]" />
                      <span className="text-foreground text-sm font-medium">Stripe</span>
                    </button>
                  )}
                  {showPaypal && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("paypal")}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === "paypal"
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:border-foreground/20"
                        }`}
                      data-testid="button-payment-paypal"
                    >
                      <SiPaypal className="h-5 w-5 text-[#00457C]" />
                      <span className="text-foreground text-sm font-medium">PayPal</span>
                    </button>
                  )}
                  {showCod && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === "cod"
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:border-foreground/20"
                        }`}
                      data-testid="button-payment-cod"
                    >
                      <Banknote className="h-5 w-5 text-primary" />
                      <span className="text-foreground text-sm font-medium">Cash on Delivery</span>
                    </button>
                  )}
                </div>
                {paymentMethod === "paypal" && (
                  <div className="mt-5 rounded-xl border border-border/60 bg-background p-5 space-y-3">
                    {!paypalConfig?.enabled || !paypalConfig?.clientId ? (
                      <p className="text-sm text-amber-400">
                        PayPal is not configured. Add PayPal Client ID in Admin → Settings to enable PayPal checkout.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">Click the button below to pay with PayPal.</p>
                        <div id="paypal-button-container" data-testid="paypal-button-container" className="min-h-[44px]" />
                        {paypalLoading && (
                          <p className="text-xs text-muted-foreground">Processing payment...</p>
                        )}
                        {paypalApproved ? (
                          <p className="text-xs text-primary font-medium" data-testid="text-paypal-approved">
                            Payment approved. Click &quot;Place Order&quot; below to complete your purchase.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            After paying with PayPal, click &quot;Place Order&quot; to confirm.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
                <p className="text-muted-foreground text-xs mt-5 flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  All transactions are secure and encrypted.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="rounded-2xl border border-border/60 bg-card/50 p-7 sticky top-24">
                <h2 className="text-base font-medium text-foreground mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4" data-testid={`checkout-item-${item.id}`}>
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">{item.name}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-foreground text-sm font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5 border-t border-border/60 pt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground">{shipping === 0 ? <span className="text-primary font-medium">Free</span> : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-medium pt-3 border-t border-border/60">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground" data-testid="text-checkout-total">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || (paymentMethod === "paypal" && !paypalApproved)}
                  className="w-full mt-7 flex items-center justify-center gap-2 rounded-full bg-foreground h-12 text-sm font-medium tracking-wide text-background transition-all hover:bg-foreground/90 disabled:opacity-50"
                  data-testid="button-place-order"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {isSubmitting ? "Processing..." : paymentMethod === "paypal" && !paypalApproved ? "Complete PayPal First" : "Place Order"}
                </button>
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure checkout powered by {paymentMethod === "stripe" ? "Stripe" : paymentMethod === "paypal" ? "PayPal" : "Cash on Delivery"}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
