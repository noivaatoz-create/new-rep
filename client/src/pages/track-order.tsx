import { useState } from "react";
import { Search, Package, CreditCard, Box, Truck, CheckCircle, XCircle, Loader2 } from "lucide-react";

const STATUS_STEPS = [
  { key: "pending", label: "Pending", icon: Package },
  { key: "paid", label: "Paid", icon: CreditCard },
  { key: "packed", label: "Packed", icon: Box },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
] as const;

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? -1 : idx;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(orderNumber.trim())}`);
      if (!res.ok) {
        setError("Order not found. Please check your order number and try again.");
        return;
      }
      const data = await res.json();
      setOrder(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isRefunded = order?.status === "refunded";
  const currentStepIndex = order ? getStepIndex(order.status) : -1;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Order Tracking</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-track-order-title">Track Your Order</h1>
          <p className="text-muted-foreground text-lg">Enter your order number to check the current status of your order.</p>
        </div>

        <form onSubmit={handleTrack} className="mb-10" data-testid="form-track-order">
          <div className="rounded-md border border-border bg-card p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter your order number (e.g., NVZ-SAMPLE-001)"
                className="flex-1 rounded-md border border-border bg-background px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm"
                data-testid="input-order-number"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
                data-testid="button-track-order"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Tracking..." : "Track Order"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="rounded-md border border-border bg-card p-6 mb-10" data-testid="text-track-error">
            <div className="flex items-center gap-3 text-red-400">
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {order && (
          <div className="space-y-6" data-testid="track-order-result">
            <div className="rounded-md border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Order Number</p>
                  <p className="text-foreground font-bold text-lg" data-testid="text-order-number">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Order Date</p>
                  <p className="text-foreground text-sm" data-testid="text-order-date">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                  </p>
                </div>
              </div>

              {isRefunded ? (
                <div className="flex items-center justify-center py-8" data-testid="status-refunded">
                  <div className="flex items-center gap-3 rounded-md bg-red-500/10 border border-red-500/30 px-6 py-3">
                    <XCircle className="h-5 w-5 text-red-400" />
                    <span className="text-red-400 font-bold text-sm uppercase tracking-wider">Order Refunded</span>
                  </div>
                </div>
              ) : (
                <div data-testid="status-timeline">
                  <div className="hidden sm:flex items-start justify-between relative">
                    {STATUS_STEPS.map((step, i) => {
                      const reached = i <= currentStepIndex;
                      const StepIcon = step.icon;
                      return (
                        <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              reached
                                ? "bg-primary"
                                : "border-2 border-border bg-background"
                            }`}
                            data-testid={`status-step-${step.key}`}
                          >
                            <StepIcon className={`h-4 w-4 ${reached ? "text-foreground" : "text-muted-foreground"}`} />
                          </div>
                          <p className={`mt-2 text-xs font-medium ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                    <div className="absolute top-5 left-0 right-0 h-0.5 -translate-y-1/2" style={{ left: "10%", right: "10%" }}>
                      {STATUS_STEPS.map((_, i) => {
                        if (i === STATUS_STEPS.length - 1) return null;
                        const filled = i < currentStepIndex;
                        return (
                          <div
                            key={i}
                            className={`absolute h-full ${filled ? "bg-primary" : "bg-muted"}`}
                            style={{
                              left: `${(i / (STATUS_STEPS.length - 1)) * 100}%`,
                              width: `${100 / (STATUS_STEPS.length - 1)}%`,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex sm:hidden flex-col gap-4">
                    {STATUS_STEPS.map((step, i) => {
                      const reached = i <= currentStepIndex;
                      const StepIcon = step.icon;
                      const isLast = i === STATUS_STEPS.length - 1;
                      return (
                        <div key={step.key} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                reached
                                  ? "bg-primary"
                                  : "border-2 border-border bg-background"
                              }`}
                              data-testid={`status-step-mobile-${step.key}`}
                            >
                              <StepIcon className={`h-4 w-4 ${reached ? "text-foreground" : "text-muted-foreground"}`} />
                            </div>
                            {!isLast && (
                              <div
                                className={`w-0.5 h-6 mt-1 ${
                                  i < currentStepIndex ? "bg-primary" : "bg-muted"
                                }`}
                              />
                            )}
                          </div>
                          <div className="pt-2">
                            <p className={`text-sm font-medium ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {order.trackingNumber && (
              <div className="rounded-md border border-border bg-card p-6" data-testid="tracking-number-card">
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Tracking Number</p>
                <p className="text-foreground font-mono text-sm" data-testid="text-tracking-number">{order.trackingNumber}</p>
              </div>
            )}

            {order.items && order.items.length > 0 && (
              <div className="rounded-md border border-border bg-card p-6">
                <p className="text-foreground font-bold mb-4">Order Items</p>
                <div className="space-y-4">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4" data-testid={`order-item-${i}`}>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 rounded-md object-cover bg-background"
                          data-testid={`order-item-image-${i}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium truncate" data-testid={`order-item-name-${i}`}>{item.name}</p>
                        <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                      </div>
                      {item.price != null && (
                        <p className="text-foreground text-sm font-medium" data-testid={`order-item-price-${i}`}>
                          ${(Number(item.price) * (item.quantity || 1)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-4 pt-4 flex items-center justify-between flex-wrap gap-2">
                  <p className="text-muted-foreground text-sm font-medium">Total</p>
                  <p className="text-foreground text-lg font-bold" data-testid="text-order-total">${Number(order.total).toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
