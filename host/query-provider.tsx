"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** App-wide TanStack Query provider. No retry on 4xx; a short stale time so lists refresh after saves. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: (count, error) => count < 2 && !(error as { status?: number }).status } },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
