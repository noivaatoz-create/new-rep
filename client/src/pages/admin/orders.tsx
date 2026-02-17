import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar, AdminHeader } from "./dashboard";
import type { Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, Package, Truck } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminOrders() {
  const { data: orders, isLoading } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order Updated" });
    },
  });

  const statusOptions = ["pending", "paid", "packed", "shipped", "delivered", "refunded"];

  return (
    <div className="flex h-screen w-full bg-section-alt overflow-hidden">
      <AdminSidebar active="/admin/orders" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Orders" />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-foreground text-lg font-semibold">{orders?.length || 0} Orders</h3>
          </div>

          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Order #</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Customer</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Items</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Total</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Payment</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {orders?.map((order) => {
                    const items = order.items as Array<any>;
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors" data-testid={`row-order-${order.id}`}>
                        <td className="p-4 text-foreground text-sm font-medium">#{order.orderNumber}</td>
                        <td className="p-4">
                          <div>
                            <p className="text-foreground text-sm">{order.customerName}</p>
                            <p className="text-muted-foreground text-xs">{order.customerEmail}</p>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">{items.length} item(s)</td>
                        <td className="p-4 text-foreground text-sm font-medium">${order.total}</td>
                        <td className="p-4">
                          <span className="text-muted-foreground text-xs uppercase">{order.paymentProvider || "N/A"}</span>
                        </td>
                        <td className="p-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatusMutation.mutate({ id: order.id, status: e.target.value })}
                            className={`text-xs font-semibold px-2 py-1 rounded border-0 focus:ring-1 focus:ring-ring cursor-pointer ${
                              order.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                              order.status === "shipped" ? "bg-blue-500/10 text-blue-400" :
                              order.status === "delivered" ? "bg-violet-500/10 text-violet-400" :
                              order.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                              order.status === "packed" ? "bg-cyan-500/10 text-cyan-400" :
                              "bg-red-500/10 text-red-400"
                            }`}
                            data-testid={`select-status-${order.id}`}
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`button-view-order-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(!orders || orders.length === 0) && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No orders yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="bg-background border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder?.orderNumber}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Customer</p>
                    <p className="text-foreground text-sm font-medium">{selectedOrder.customerName}</p>
                    <p className="text-muted-foreground text-xs">{selectedOrder.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Shipping Address</p>
                    <p className="text-foreground text-sm">{selectedOrder.shippingAddress}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-muted-foreground text-xs mb-3">Items</p>
                  <div className="space-y-2">
                    {(selectedOrder.items as Array<any>).map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground text-sm">{item.name}</p>
                          <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-foreground text-sm">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border pt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${selectedOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground">${selectedOrder.shipping}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground">${selectedOrder.tax}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>${selectedOrder.total}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
