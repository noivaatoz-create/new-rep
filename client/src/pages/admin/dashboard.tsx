import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { Product, Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Bell, HelpCircle, Search, AlertTriangle, Calendar, Trash2, RefreshCw, MessageSquare, Images, Home, Sun, Moon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/components/theme-provider";

function AdminSidebar({ active }: { active: string }) {
  const [, setLocation] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiRequest("POST", "/api/admin/logout", undefined, { timeout: 10000 });
    } catch {
      // Still clear local state and redirect so user can log in again
    }
    queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
    setLocation("/admin/login");
  };

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/admin/messages", icon: MessageSquare, label: "Messages" },
    { href: "/admin/gallery", icon: Images, label: "Gallery" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-section-alt border-r border-border flex-shrink-0" data-testid="admin-sidebar">
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
              <img src="/images/novaatoz-logo.png" alt="Novaatoz" className="h-7 w-7 object-contain brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-foreground text-base font-bold tracking-tight">Novaatoz</h1>
              <p className="text-muted-foreground text-xs font-medium tracking-wide">ADMIN CONSOLE</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 mt-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active === item.href
                    ? "bg-primary text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`link-admin-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-3 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </div>
    </aside>
  );
}

function AdminHeader({ title }: { title: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="flex items-center justify-between border-b border-border bg-section-alt/95 backdrop-blur-md px-6 py-4 sticky top-0 z-10" data-testid="admin-header">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <h2 className="text-foreground text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          data-testid="link-admin-home"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          data-testid="button-admin-theme-toggle"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-64 pl-10 pr-3 py-2 border border-border rounded-md bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
            placeholder="Search orders, products..."
            type="text"
            data-testid="input-admin-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-section-alt" />
          </button>
          <button className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" data-testid="button-help">
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export { AdminSidebar, AdminHeader };

export default function AdminDashboard() {
  const { data: products } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: orders } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { toast } = useToast();

  const [period, setPeriod] = useState<"week" | "month" | "year" | "all">("all");
  const [showResetDialog, setShowResetDialog] = useState(false);

  const now = new Date();
  const filteredOrders = orders?.filter(o => {
    if (period === "all") return true;
    if (!o.createdAt) return false;
    const date = new Date(o.createdAt);
    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    if (period === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    }
    if (period === "year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return date >= yearAgo;
    }
    return true;
  }) || [];

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const lowStockProducts = products?.filter((p) => p.stock < 20) || [];

  const chartData = (() => {
    if (filteredOrders.length === 0) return [];
    const buckets: Record<string, number> = {};

    const useMonthly = period === "year" || period === "all";

    filteredOrders.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const key = useMonthly
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      buckets[key] = (buckets[key] || 0) + parseFloat(o.total);
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));
  })();

  const chartSvg = (() => {
    if (chartData.length === 0) return { path: "", area: "" };
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
    const width = 800;
    const height = 250;
    const padding = 20;
    const points = chartData.map((d, i) => ({
      x: chartData.length === 1 ? width / 2 : (i / (chartData.length - 1)) * (width - padding * 2) + padding,
      y: height - padding - ((d.revenue / maxRevenue) * (height - padding * 2)),
    }));

    const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaStr = `${pathStr} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

    return { path: pathStr, area: areaStr };
  })();

  const resetMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/orders"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Revenue Reset", description: "All order data has been cleared." });
      setShowResetDialog(false);
    },
  });

  const kpis = [
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: "payments" },
    { label: "Orders", value: totalOrders.toLocaleString(), icon: "shopping_bag" },
    { label: "Avg. Order Value", value: `$${avgOrderValue.toFixed(2)}`, icon: "price_check" },
    { label: "Products", value: String(products?.length || 0), icon: "ads_click" },
  ];

  const recentOrders = filteredOrders.slice(0, 5);

  return (
    <div className="flex h-screen w-full bg-section-alt overflow-hidden">
      <AdminSidebar active="/admin" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Dashboard Overview" />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {(["week", "month", "year", "all"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    period === p
                      ? "bg-primary text-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                  data-testid={`button-period-${p}`}
                >
                  {p === "week" ? "This Week" : p === "month" ? "This Month" : p === "year" ? "This Year" : "All Time"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowResetDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all"
              data-testid="button-reset-revenue"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-card border border-border rounded-md p-5 hover:border-primary/50 transition-colors group relative overflow-visible" data-testid={`kpi-${i}`}>
                <div className="flex flex-col gap-1 relative z-10">
                  <p className="text-muted-foreground text-sm font-medium">{kpi.label}</p>
                  <h3 className="text-foreground text-2xl font-bold tracking-tight">{kpi.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-md p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h3 className="text-foreground text-base font-semibold">Sales Performance</h3>
                  <p className="text-muted-foreground text-xs mt-1">
                    {period === "week" ? "Daily revenue this week" : period === "month" ? "Daily revenue this month" : period === "year" ? "Monthly revenue this year" : "All time revenue"}
                  </p>
                </div>
              </div>
              <div className="flex-1 relative min-h-[250px] w-full">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 250">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line stroke="hsl(var(--border))" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="50" y2="50" />
                  <line stroke="hsl(var(--border))" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="100" y2="100" />
                  <line stroke="hsl(var(--border))" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="150" y2="150" />
                  <line stroke="hsl(var(--border))" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="200" y2="200" />
                  {chartData.length > 0 ? (
                    <>
                      <path d={chartSvg.area} fill="url(#chartGradient)" />
                      <path d={chartSvg.path} fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                      {chartData.map((d, i) => {
                        const maxR = Math.max(...chartData.map(x => x.revenue), 1);
                        const x = chartData.length === 1 ? 400 : (i / (chartData.length - 1)) * 760 + 20;
                        const y = 230 - ((d.revenue / maxR) * 210);
                        return <circle key={i} cx={x} cy={y} r="4" fill="hsl(var(--primary))" />;
                      })}
                    </>
                  ) : (
                    <text x="400" y="130" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="14">No data for selected period</text>
                  )}
                </svg>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {lowStockProducts.length > 0 && (
                <div className="bg-card border border-border rounded-md p-5 relative overflow-visible" data-testid="card-low-stock">
                  <div className="flex justify-between items-start mb-3 gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm font-bold uppercase tracking-wider">Low Stock</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {lowStockProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2">
                        <span className="text-foreground text-sm truncate">{p.name}</span>
                        <span className="text-amber-400 text-sm font-bold whitespace-nowrap">{p.stock} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-md p-5 flex-1" data-testid="card-top-products">
                <h3 className="text-foreground text-sm font-semibold mb-4">Top Products</h3>
                <div className="space-y-3">
                  {products?.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm truncate">{p.name}</p>
                        <p className="text-muted-foreground text-xs">${p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-md p-6" data-testid="card-recent-orders">
            <h3 className="text-foreground text-base font-semibold mb-4">Recent Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-muted-foreground text-xs font-medium uppercase tracking-wider">Order</th>
                    <th className="pb-3 text-muted-foreground text-xs font-medium uppercase tracking-wider">Customer</th>
                    <th className="pb-3 text-muted-foreground text-xs font-medium uppercase tracking-wider">Total</th>
                    <th className="pb-3 text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-muted-foreground text-xs font-medium uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 text-foreground text-sm font-medium">#{order.orderNumber}</td>
                      <td className="py-3 text-muted-foreground text-sm">{order.customerName}</td>
                      <td className="py-3 text-foreground text-sm font-medium">${order.total}</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          order.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                          order.status === "shipped" ? "bg-blue-500/10 text-blue-400" :
                          order.status === "delivered" ? "bg-violet-500/10 text-violet-400" :
                          order.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                          "bg-red-500/10 text-red-400"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground text-sm">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No orders yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-background border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Revenue Data?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete all orders. Revenue will reset to $0.00. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground" data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 text-foreground"
              data-testid="button-confirm-reset"
            >
              Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
