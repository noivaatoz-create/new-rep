import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const total = getTotal();
  const itemCount = getItemCount();
  const freeShippingThreshold = parseFloat(settings?.freeShippingThreshold || "75");
  const shippingFlatRate = parseFloat(settings?.shippingFlatRate || "9.99");
  const remaining = freeShippingThreshold - total;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="bg-background border-border w-full sm:max-w-md flex flex-col" data-testid="cart-drawer">
        <SheetHeader className="pb-5 border-b border-border/60">
          <SheetTitle className="text-foreground flex items-center gap-2.5 font-serif text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Your Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center" data-testid="text-empty-cart">
            <ShoppingBag className="h-14 w-14 text-muted-foreground/20" />
            <div>
              <p className="text-foreground font-medium text-base">Your cart is empty</p>
              <p className="text-muted-foreground text-sm mt-1">Add some products to get started</p>
            </div>
            <Link href="/shop" onClick={() => setIsOpen(false)}>
              <button className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium tracking-wide hover:bg-foreground/90 transition-colors" data-testid="button-continue-shopping">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <>
            {remaining > 0 && (
              <div className="mt-4 rounded-xl bg-primary/5 border border-primary/15 p-4 text-sm" data-testid="text-free-shipping-progress">
                <p className="text-primary text-sm">
                  Add <span className="font-medium">${remaining.toFixed(2)}</span> more for free shipping
                </p>
                <div className="mt-2.5 h-1 w-full rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min((total / freeShippingThreshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-xl border border-border/60 bg-card/50 p-3" data-testid={`cart-item-${item.id}`}>
                  <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-foreground font-medium text-sm truncate">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-border rounded-full">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-foreground text-sm font-medium min-w-[20px] text-center" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-foreground font-medium text-sm" data-testid={`text-item-price-${item.id}`}>
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-5 border-t border-border/60 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium" data-testid="text-subtotal">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground font-medium" data-testid="text-shipping">
                  {total >= freeShippingThreshold ? (
                    <span className="text-primary">Free</span>
                  ) : (
                    `$${shippingFlatRate.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base pt-3 border-t border-border/60">
                <span className="text-foreground font-medium">Total</span>
                <span className="text-foreground font-medium" data-testid="text-cart-total">
                  ${(total + (total >= freeShippingThreshold ? 0 : shippingFlatRate)).toFixed(2)}
                </span>
              </div>
              <Link href="/checkout" onClick={() => setIsOpen(false)}>
                <button
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground text-background h-11 text-sm font-medium tracking-wide mt-3 hover:bg-foreground/90 transition-colors"
                  data-testid="button-checkout"
                >
                  Checkout <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/shop" onClick={() => setIsOpen(false)}>
                <button
                  className="w-full rounded-full border border-border text-muted-foreground h-11 text-sm font-medium tracking-wide mt-2 hover:text-foreground hover:border-foreground/20 transition-colors"
                  data-testid="button-continue-shopping-drawer"
                >
                  Continue Shopping
                </button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
