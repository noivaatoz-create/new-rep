import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminHeader, AdminSidebar } from "./dashboard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, TicketPercent, HandCoins, TrendingUp, BadgeDollarSign, Clock3 } from "lucide-react";

type Influencer = {
  id: number;
  name: string;
  email: string;
  commissionType: "percentage" | "fixed";
  commissionValue: string;
  status: "active" | "inactive";
};

type PromoCode = {
  id: number;
  code: string;
  influencerId: number;
  influencerName: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  active: boolean;
};

type Commission = {
  id: number;
  influencerId: number;
  influencerName: string;
  orderId: number;
  orderNumber: string;
  commissionAmount: string;
  status: "pending" | "approved" | "paid";
  createdAt: string;
};

type PerformanceRow = {
  influencerId: number;
  name: string;
  email: string;
  status: "active" | "inactive";
  totalOrders: number;
  totalRevenue: string;
  totalDiscountGiven: string;
  totalCommissionPending: string;
  totalCommissionPaid: string;
};

const toMoney = (v: string | number | null | undefined) => Number.parseFloat(String(v ?? "0")) || 0;

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const esc = (value: string | number) => {
    const str = String(value ?? "");
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, "\"\"")}"`;
    return str;
  };
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active ? "bg-emerald-500/15 text-emerald-600" : "bg-zinc-500/15 text-zinc-500"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function AdminInfluencers() {
  const { toast } = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "approved" | "paid">("");

  const [influencerForm, setInfluencerForm] = useState({
    name: "",
    email: "",
    commissionType: "percentage" as "percentage" | "fixed",
    commissionValue: "",
    status: "active" as "active" | "inactive",
  });

  const [promoForm, setPromoForm] = useState({
    code: "",
    influencerId: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    usageLimit: "",
    expiresAt: "",
    active: true,
  });

  const performancePath = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const q = params.toString();
    return q ? `/api/admin/influencers/performance?${q}` : "/api/admin/influencers/performance";
  }, [from, to]);

  const commissionsPath = useMemo(() => {
    if (!statusFilter) return "/api/admin/commissions";
    return `/api/admin/commissions?status=${statusFilter}`;
  }, [statusFilter]);

  const { data: influencers = [] } = useQuery<Influencer[]>({ queryKey: ["/api/admin/influencers"] });
  const { data: promoCodes = [] } = useQuery<PromoCode[]>({ queryKey: ["/api/admin/promo-codes"] });
  const { data: commissions = [] } = useQuery<Commission[]>({ queryKey: [commissionsPath] });
  const { data: performance = [] } = useQuery<PerformanceRow[]>({ queryKey: [performancePath] });

  const stats = useMemo(() => {
    const totalRevenue = performance.reduce((sum, r) => sum + toMoney(r.totalRevenue), 0);
    const totalPending = performance.reduce((sum, r) => sum + toMoney(r.totalCommissionPending), 0);
    const totalPaid = performance.reduce((sum, r) => sum + toMoney(r.totalCommissionPaid), 0);
    const totalOrders = performance.reduce((sum, r) => sum + (r.totalOrders || 0), 0);
    return { totalRevenue, totalPending, totalPaid, totalOrders };
  }, [performance]);

  const maxRevenue = useMemo(() => Math.max(1, ...performance.map((r) => toMoney(r.totalRevenue))), [performance]);

  const exportPerformanceCsv = () => {
    const rows = performance.map((row) => [
      row.influencerId,
      row.name,
      row.email,
      row.status,
      row.totalOrders,
      toMoney(row.totalRevenue).toFixed(2),
      toMoney(row.totalDiscountGiven).toFixed(2),
      toMoney(row.totalCommissionPending).toFixed(2),
      toMoney(row.totalCommissionPaid).toFixed(2),
    ]);
    downloadCsv(
      "influencer-performance.csv",
      ["Influencer ID", "Name", "Email", "Status", "Total Orders", "Total Revenue", "Total Discount", "Commission Pending", "Commission Paid"],
      rows,
    );
  };

  const exportCommissionsCsv = () => {
    const rows = commissions.map((c) => [
      c.id,
      c.influencerName,
      c.orderNumber,
      toMoney(c.commissionAmount).toFixed(2),
      c.status,
      c.createdAt ? new Date(c.createdAt).toISOString() : "",
    ]);
    downloadCsv(
      "influencer-commissions.csv",
      ["Commission ID", "Influencer", "Order Number", "Commission Amount", "Status", "Created At"],
      rows,
    );
  };

  const createInfluencer = useMutation({
    mutationFn: async () => {
      const payload = {
        name: influencerForm.name.trim(),
        email: influencerForm.email.trim().toLowerCase(),
        commissionType: influencerForm.commissionType,
        commissionValue: Number.parseFloat(influencerForm.commissionValue || "0").toFixed(2),
        status: influencerForm.status,
      };
      await apiRequest("POST", "/api/admin/influencers", payload);
    },
    onSuccess: async () => {
      setInfluencerForm({ name: "", email: "", commissionType: "percentage", commissionValue: "", status: "active" });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/influencers"] });
      await queryClient.invalidateQueries({ queryKey: [performancePath] });
      toast({ title: "Influencer created" });
    },
    onError: (err: any) => toast({ title: "Failed", description: err?.message || "Could not create influencer", variant: "destructive" }),
  });

  const createPromoCode = useMutation({
    mutationFn: async () => {
      const influencerId = Number.parseInt(promoForm.influencerId, 10);
      if (!Number.isFinite(influencerId)) throw new Error("Choose an influencer");
      const payload = {
        code: promoForm.code.trim().toUpperCase(),
        influencerId,
        discountType: promoForm.discountType,
        discountValue: Number.parseFloat(promoForm.discountValue || "0").toFixed(2),
        usageLimit: promoForm.usageLimit.trim() ? Number.parseInt(promoForm.usageLimit, 10) : null,
        expiresAt: promoForm.expiresAt ? new Date(`${promoForm.expiresAt}T23:59:59`).toISOString() : null,
        active: promoForm.active,
      };
      await apiRequest("POST", "/api/admin/promo-codes", payload);
    },
    onSuccess: async () => {
      setPromoForm({ code: "", influencerId: "", discountType: "percentage", discountValue: "", usageLimit: "", expiresAt: "", active: true });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({ title: "Promo code created" });
    },
    onError: (err: any) => toast({ title: "Failed", description: err?.message || "Could not create promo code", variant: "destructive" }),
  });

  const markCommissionPaid = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/admin/commissions/${id}/pay`, {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [commissionsPath] });
      await queryClient.invalidateQueries({ queryKey: [performancePath] });
      toast({ title: "Commission marked as paid" });
    },
    onError: (err: any) => toast({ title: "Failed", description: err?.message || "Could not update commission", variant: "destructive" }),
  });

  return (
    <div className="flex h-screen w-full bg-section-alt overflow-hidden">
      <AdminSidebar active="/admin/influencers" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Influencer System" />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Total Revenue</span><TrendingUp className="h-4 w-4" /></div>
              <p className="text-2xl font-bold mt-2">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Total Orders</span><Users className="h-4 w-4" /></div>
              <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Commission Pending</span><Clock3 className="h-4 w-4" /></div>
              <p className="text-2xl font-bold mt-2">${stats.totalPending.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Commission Paid</span><BadgeDollarSign className="h-4 w-4" /></div>
              <p className="text-2xl font-bold mt-2">${stats.totalPaid.toFixed(2)}</p>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Users className="h-4 w-4 text-primary" />Influencer Performance</div>
              <div className="flex flex-wrap gap-2">
                <input type="date" className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
                <input type="date" className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
                <button
                  type="button"
                  onClick={exportPerformanceCsv}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {performance.map((row) => {
                const revenue = toMoney(row.totalRevenue);
                const bar = Math.max(4, (revenue / maxRevenue) * 100);
                return (
                  <div key={row.influencerId} className="rounded-lg border border-border/70 bg-background/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                      </div>
                      <StatusBadge active={row.status === "active"} />
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${bar}%` }} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Orders:</span> {row.totalOrders}</div>
                      <div><span className="text-muted-foreground">Revenue:</span> ${toMoney(row.totalRevenue).toFixed(2)}</div>
                      <div><span className="text-muted-foreground">Pending:</span> ${toMoney(row.totalCommissionPending).toFixed(2)}</div>
                      <div><span className="text-muted-foreground">Paid:</span> ${toMoney(row.totalCommissionPaid).toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
              {performance.length === 0 && <p className="text-sm text-muted-foreground">No performance data yet.</p>}
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Users className="h-4 w-4 text-primary" />Create Influencer</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Name" value={influencerForm.name} onChange={(e) => setInfluencerForm((p) => ({ ...p, name: e.target.value }))} />
                <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Email" value={influencerForm.email} onChange={(e) => setInfluencerForm((p) => ({ ...p, email: e.target.value }))} />
                <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={influencerForm.commissionType} onChange={(e) => setInfluencerForm((p) => ({ ...p, commissionType: e.target.value as any }))}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Commission value" value={influencerForm.commissionValue} onChange={(e) => setInfluencerForm((p) => ({ ...p, commissionValue: e.target.value }))} />
                <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={influencerForm.status} onChange={(e) => setInfluencerForm((p) => ({ ...p, status: e.target.value as any }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button onClick={() => createInfluencer.mutate()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-foreground">Save Influencer</button>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><TicketPercent className="h-4 w-4 text-primary" />Create Promo Code</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className="rounded-md border border-border bg-background px-3 py-2 text-sm uppercase" placeholder="CODE2026" value={promoForm.code} onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value }))} />
                <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={promoForm.influencerId} onChange={(e) => setPromoForm((p) => ({ ...p, influencerId: e.target.value }))}>
                  <option value="">Select influencer</option>
                  {influencers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={promoForm.discountType} onChange={(e) => setPromoForm((p) => ({ ...p, discountType: e.target.value as any }))}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Discount value" value={promoForm.discountValue} onChange={(e) => setPromoForm((p) => ({ ...p, discountValue: e.target.value }))} />
                <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Usage limit (optional)" value={promoForm.usageLimit} onChange={(e) => setPromoForm((p) => ({ ...p, usageLimit: e.target.value }))} />
                <input type="date" className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={promoForm.expiresAt} onChange={(e) => setPromoForm((p) => ({ ...p, expiresAt: e.target.value }))} />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={promoForm.active} onChange={(e) => setPromoForm((p) => ({ ...p, active: e.target.checked }))} />
                Active
              </label>
              <button onClick={() => createPromoCode.mutate()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-foreground">Save Promo Code</button>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><TicketPercent className="h-4 w-4 text-primary" />Promo Codes</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Code</th>
                      <th className="py-2">Influencer</th>
                      <th className="py-2">Discount</th>
                      <th className="py-2">Usage</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((p) => (
                      <tr key={p.id} className="border-t border-border/60">
                        <td className="py-2 font-medium">{p.code}</td>
                        <td className="py-2">{p.influencerName}</td>
                        <td className="py-2">{p.discountType === "percentage" ? `${p.discountValue}%` : `$${p.discountValue}`}</td>
                        <td className="py-2">{p.usageCount}{p.usageLimit ? ` / ${p.usageLimit}` : ""}</td>
                        <td className="py-2"><StatusBadge active={p.active} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><HandCoins className="h-4 w-4 text-primary" />Commissions</div>
                <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
                <button
                  type="button"
                  onClick={exportCommissionsCsv}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Influencer</th>
                      <th className="py-2">Order</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id} className="border-t border-border/60">
                        <td className="py-2">{c.influencerName}</td>
                        <td className="py-2">{c.orderNumber}</td>
                        <td className="py-2">${Number.parseFloat(c.commissionAmount || "0").toFixed(2)}</td>
                        <td className="py-2 capitalize">{c.status}</td>
                        <td className="py-2">
                          <button
                            disabled={c.status === "paid" || markCommissionPaid.isPending}
                            onClick={() => markCommissionPaid.mutate(c.id)}
                            className="rounded-md border border-border px-2.5 py-1 text-xs disabled:opacity-40"
                          >
                            Mark Paid
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
