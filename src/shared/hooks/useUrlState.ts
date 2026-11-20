"use client";
import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Screen state kept in the URL (filter, sort, page, selected record, tab), so refresh, back and shared links work.
 * `get` reads a key with a default; `set` merges a patch (undefined removes a key). Must not hold any other state.
 */
export function useUrlState() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = useCallback((key: string, fallback = "") => sp.get(key) ?? fallback, [sp]);
  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [sp, router, pathname],
  );
  return { get, set };
}
