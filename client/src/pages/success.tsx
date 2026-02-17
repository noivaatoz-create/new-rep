import { Link, useSearch } from "wouter";
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";

export default function SuccessPage() {
    const search = useSearch();
    const orderNumber = new URLSearchParams(search).get("order");

    const { data: order } = useQuery<Order>({
        queryKey: [`/api/track/${orderNumber}`],
        enabled: !!orderNumber,
    });

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping scale-150 opacity-20" />
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center relative">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-4xl font-serif text-foreground tracking-tight">Order confirmed!</h1>
                    <p className="text-muted-foreground text-lg">
                        Your order has been placed successfully. Check your email for the invoice and order details.
                    </p>
                </div>

                {order && (
                    <div className="bg-card/50 border border-border/60 rounded-2xl p-6 text-left space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-4">
                            <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Order Number</span>
                            <span className="text-foreground font-mono font-bold tracking-tight bg-muted px-2 py-1 rounded">
                                #{order.orderNumber}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span>Invoice sent to <strong className="text-foreground">{order.customerEmail}</strong></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Package className="h-4 w-4" />
                                <span>Est. delivery: 3-5 business days</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                    <Link href="/shop">
                        <button className="w-full flex items-center justify-center gap-2 rounded-full border border-border bg-background h-12 text-sm font-medium tracking-wide text-foreground transition-all hover:bg-muted">
                            <ShoppingBag className="h-4 w-4" />
                            Continue Shopping
                        </button>
                    </Link>
                    <Link href={order ? `/track-order?order=${order.orderNumber}` : "/track-order"}>
                        <button className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground h-12 text-sm font-medium tracking-wide text-background transition-all hover:bg-foreground/90">
                            Track Order
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </Link>
                </div>

                <p className="text-muted-foreground text-xs pt-8">
                    Having trouble? <Link href="/contact" className="text-primary hover:underline underline-offset-4">Contact our support team</Link>
                </p>
            </div>
        </div>
    );
}
