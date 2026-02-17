import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar, AdminHeader } from "./dashboard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, Trash2, MessageSquare, Mail } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminMessages() {
  const { data: messages, isLoading } = useQuery<ContactSubmission[]>({ queryKey: ["/api/contact"] });
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/contact/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
      toast({ title: "Status Updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/contact/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
      setSelectedMessage(null);
      toast({ title: "Message Deleted" });
    },
  });

  const totalMessages = messages?.length || 0;
  const newCount = messages?.filter((m) => m.status === "new").length || 0;
  const repliedCount = messages?.filter((m) => m.status === "replied").length || 0;

  const statusOptions = ["new", "read", "replied"];

  return (
    <div className="flex h-screen w-full bg-section-alt overflow-hidden">
      <AdminSidebar active="/admin/messages" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Messages" />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-md p-5" data-testid="stat-total-messages">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Messages</p>
                  <h3 className="text-foreground text-2xl font-bold tracking-tight">{totalMessages}</h3>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-md p-5" data-testid="stat-new-messages">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-muted-foreground text-sm font-medium">New</p>
                  <h3 className="text-foreground text-2xl font-bold tracking-tight">{newCount}</h3>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-md p-5" data-testid="stat-replied-messages">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Replied</p>
                  <h3 className="text-foreground text-2xl font-bold tracking-tight">{repliedCount}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Name</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Email</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Subject</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <p className="text-muted-foreground">Loading messages...</p>
                      </td>
                    </tr>
                  )}
                  {!isLoading && messages?.map((msg) => (
                    <tr
                      key={msg.id}
                      className={`transition-colors ${
                        msg.status === "new"
                          ? "bg-white/[0.03] hover:bg-white/[0.05]"
                          : "hover:bg-white/[0.02]"
                      }`}
                      data-testid={`row-message-${msg.id}`}
                    >
                      <td className="p-4">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            msg.status === "new"
                              ? "bg-emerald-400"
                              : msg.status === "read"
                              ? "bg-blue-400"
                              : "bg-gray-400"
                          }`}
                          data-testid={`status-dot-${msg.id}`}
                        />
                      </td>
                      <td className="p-4 text-foreground text-sm font-medium">{msg.name}</td>
                      <td className="p-4 text-muted-foreground text-sm">{msg.email}</td>
                      <td className="p-4 text-foreground text-sm max-w-[200px] truncate">{msg.subject}</td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`button-view-message-${msg.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(msg.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            data-testid={`button-delete-message-${msg.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && (!messages || messages.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No messages yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="bg-background border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>Message Details</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Name</p>
                    <p className="text-foreground text-sm font-medium">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Email</p>
                    <p className="text-foreground text-sm font-medium">{selectedMessage.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Subject</p>
                  <p className="text-foreground text-sm font-medium">{selectedMessage.subject}</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-muted-foreground text-xs mb-2">Message</p>
                  <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-muted-foreground text-xs mb-2">Status</p>
                  <select
                    value={selectedMessage.status}
                    onChange={(e) => {
                      updateStatusMutation.mutate({ id: selectedMessage.id, status: e.target.value });
                      setSelectedMessage({ ...selectedMessage, status: e.target.value });
                    }}
                    className={`text-xs font-semibold px-2 py-1 rounded border-0 focus:ring-1 focus:ring-ring cursor-pointer ${
                      selectedMessage.status === "new" ? "bg-emerald-500/10 text-emerald-400" :
                      selectedMessage.status === "read" ? "bg-blue-500/10 text-blue-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}
                    data-testid="select-message-status"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="border-t border-border pt-4 flex justify-between items-center gap-4 flex-wrap">
                  <p className="text-muted-foreground text-xs">
                    Received: {selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : "N/A"}
                  </p>
                  <button
                    onClick={() => deleteMutation.mutate(selectedMessage.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all"
                    data-testid="button-delete-message-dialog"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Message
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
