"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useItemsApi } from "../../ItemsProvider";
import type { ItemInputDto } from "../../api/contract";

/** Lookup lists for the New/Edit form (units, categories, accounts...). Rarely change, so cached for 5 minutes. */
export function useEditPage() {
  const api = useItemsApi();
  return useQuery({ queryKey: ["items", "editpage"], staleTime: 300_000, queryFn: ({ signal }) => api.getEditPage(signal).then((r) => ({ units: r.units, categories: r.categories, brands: r.brands, manufacturers: r.manufacturers, vendors: r.vendors, income_accounts: r.income_accounts, purchase_accounts: r.purchase_accounts, inventory_accounts: r.inventory_accounts, valuation_methods: r.valuation_methods })) });
}

type Action = "active" | "inactive" | "lock" | "unlock" | "clone";

/**
 * Every item write in one place. After any write the lists and the open item are refreshed (one invalidation of the
 * "items" cache), and the server sentence is shown as a toast when the caller does not handle the error itself.
 */
export function useItemMutations() {
  const api = useItemsApi();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ["items"] });
  const fail = (e: Error) => toast.error(e.message);
  const create = useMutation({ mutationFn: (body: ItemInputDto) => api.createItem(body), onSuccess: refresh });
  const update = useMutation({ mutationFn: (v: { id: string; body: ItemInputDto }) => api.updateItem(v.id, v.body), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => api.deleteItem(id), onSuccess: (r) => { toast.success(r.message); void refresh(); }, onError: fail });
  const act = useMutation({ mutationFn: (v: { id: string; action: Action }) => api.itemAction(v.id, v.action), onSuccess: (r) => { toast.success(r.message); void refresh(); }, onError: fail });
  return { create, update, remove, act };
}
