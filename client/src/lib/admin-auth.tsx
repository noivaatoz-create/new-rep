import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/session"],
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch session status — never use stale cached auth data
  });

  useEffect(() => {
    if (!isLoading && !data?.isAdmin) {
      setLocation("/admin/login");
    }
  }, [data, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-section-alt">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.isAdmin) {
    return null;
  }

  return <>{children}</>;
}
