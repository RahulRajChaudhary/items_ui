"use client";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useItemsApi } from "../../ItemsProvider";
import { toItem, toPage } from "../../api/mappers";
import type { ItemListQuery } from "../../api/contract";

/** Server-paged items list for one filter/sort/page. In-flight requests are cancelled when the query changes. */
export function useItemsList(q: ItemListQuery) {
  const api = useItemsApi();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["items", "list", q],
    queryFn: ({ signal }) => api.listItems(q, signal).then((r) => toPage(r.items, r.page_context)),
    placeholderData: (prev) => prev,
  });
  const hasMore = query.data?.hasMore;
  /** Warm the next page while the user reads this one, so "next" feels instant. Only one page ahead, only when the first one is done. */
  useEffect(() => {
    if (!hasMore) return;
    const next = { ...q, page: q.page + 1 };
    void client.prefetchQuery({ queryKey: ["items", "list", next], queryFn: ({ signal }) => api.listItems(next, signal).then((r) => toPage(r.items, r.page_context)), staleTime: 30_000 });
  }, [hasMore, q, api, client]);
  return query;
}

/** One item for the detail pane; disabled while no id is selected. */
export function useItem(id: string | undefined) {
  const api = useItemsApi();
  return useQuery({
    queryKey: ["items", "detail", id],
    enabled: !!id,
    queryFn: ({ signal }) => api.getItem(id ?? "", signal).then((r) => toItem(r.item)),
  });
}

/** Stock locations of one item (only goods that track inventory have any). */
export function useItemLocations(id: string, enabled: boolean) {
  const api = useItemsApi();
  return useQuery({ queryKey: ["items", "locations", id], enabled, queryFn: ({ signal }) => api.getLocations(id, signal).then((r) => r.locations) });
}

/** Quotes that use one item, for the Transactions tab. */
export function useItemTransactions(id: string) {
  const api = useItemsApi();
  return useQuery({ queryKey: ["items", "transactions", id], queryFn: ({ signal }) => api.getTransactions(id, signal).then((r) => r.transactions) });
}

/** Change history of one item. */
export function useItemHistory(id: string) {
  const api = useItemsApi();
  return useQuery({ queryKey: ["items", "history", id], queryFn: ({ signal }) => api.getHistory(id, signal).then((r) => r.history) });
}
