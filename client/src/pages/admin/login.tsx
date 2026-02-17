import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Lock, User, LogIn, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/login", { username, password }, { timeout: 15000 });
      const data = await res.json();
      if (data.success) {
        // Invalidate cached session query so AdminGuard re-fetches fresh data
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
        setLocation("/admin");
      }
    } catch (error: any) {
      const isTimeout = error?.name === "AbortError";
      const isNetwork = error?.message?.includes("Failed to fetch") || error?.message?.includes("NetworkError");
      toast({
        title: "Login Failed",
        description: isTimeout || isNetwork
          ? "Server not responding. Make sure the server is running (npm run dev)."
          : "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-section-alt px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/images/novaatoz-logo.png" alt="Novaatoz" className="h-10 w-10 object-contain invert" />
            <span className="text-2xl font-bold tracking-tight text-foreground">NOVAATOZ</span>
          </div>
          <p className="text-muted-foreground text-sm">Admin Panel Login</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-md p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-10 pr-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder-muted-foreground"
                placeholder="Enter username"
                data-testid="input-admin-username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-10 pr-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder-muted-foreground"
                placeholder="Enter password"
                data-testid="input-admin-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
            data-testid="button-admin-login"
          >
            <LogIn className="h-4 w-4" />
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
