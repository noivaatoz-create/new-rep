import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text || res.statusText;

    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: string; message?: string };
        if (typeof parsed.error === "string" && parsed.error.trim()) {
          message = parsed.error;
        } else if (typeof parsed.message === "string" && parsed.message.trim()) {
          message = parsed.message;
        }
      } catch {
        // Keep the raw text when response body is not JSON.
      }
    }

    throw new Error(`${res.status}: ${message}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { timeout?: number },
): Promise<Response> {
  const controller = new AbortController();
  const timeout = options?.timeout ?? DEFAULT_MUTATION_TIMEOUT;
  const timeoutId = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : null;

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    if (isAbortLikeError(err)) {
      throw new Error("Request timed out. Server took too long to respond.");
    }
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
const DEFAULT_QUERY_TIMEOUT = 15000;
const DEFAULT_MUTATION_TIMEOUT = 90000; // 90s for product save (DB/storage can be slow)

function isAbortLikeError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { name?: string; message?: string };
  const name = (err.name || "").toLowerCase();
  const message = (err.message || "").toLowerCase();
  return (
    name.includes("abort") ||
    name.includes("timeout") ||
    message.includes("aborted") ||
    message.includes("aborterror") ||
    message.includes("signal is aborted")
  );
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_QUERY_TIMEOUT);
    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      await throwIfResNotOk(res);
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
