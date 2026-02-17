import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar, AdminHeader } from "./dashboard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, Trash2, Download } from "lucide-react";
import { useState } from "react";

interface Subscriber {
  id: number;
  email: string;
  createdAt: string;
}

export default function AdminNewsletter() {
  const { data: subscribers, isLoading } = useQuery<Subscriber[]>({ queryKey: ["/api/subscribers"] });
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/subscribers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] });
      toast({ title: "Subscriber Deleted" });
    },
  });

  const exportCSV = () => {
    if (!subscribers || subscribers.length === 0) {
      toast({ title: "No subscribers to export", variant: "destructive" });
      return;
    }

    const csv = [
      ["Email", "Subscribed Date"].join(","),
      ...subscribers.map((s) => [s.email, new Date(s.createdAt).toLocaleDateString()].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Subscribers exported to CSV" });
  };

  const totalSubscribers = subscribers?.length || 0;

  return (
    <div className="flex h-screen w-full bg-section-alt overflow-hidden">
      <AdminSidebar active="/admin/newsletter" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Newsletter" />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="bg-card border border-border rounded-md p-5" data-testid="stat-total-subscribers">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Subscribers</p>
                  <h3 className="text-foreground text-2xl font-bold tracking-tight">{totalSubscribers}</h3>
                </div>
              </div>
            </div>
            {totalSubscribers > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-colors"
                data-testid="button-export-csv"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            )}
          </div>

          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Email</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Subscribed Date</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center">
                        <p className="text-muted-foreground">Loading subscribers...</p>
                      </td>
                    </tr>
                  )}
                  {!isLoading && subscribers?.map((subscriber) => (
                    <tr
                      key={subscriber.id}
                      className="hover:bg-white/[0.02] transition-colors"
                      data-testid={`row-subscriber-${subscriber.id}`}
                    >
                      <td className="p-4 text-foreground text-sm font-medium">{subscriber.email}</td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {subscriber.createdAt ? new Date(subscriber.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            if (confirm(`Delete subscriber ${subscriber.email}?`)) {
                              deleteMutation.mutate(subscriber.id);
                            }
                          }}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          data-testid={`button-delete-subscriber-${subscriber.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && (!subscribers || subscribers.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center">
                        <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No subscribers yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
