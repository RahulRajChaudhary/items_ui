"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useItemsApi } from "../../ItemsProvider";
import type { RecordAction, RecordListQuery, ResourceName } from "../../api/resources";

const key = (name: ResourceName, ...rest: unknown[]) => ["items", "records", name, ...rest];

/** All records of one resource for a filter (screens page them on the server; settings lists are small and ask for 200). */
export function useRecords(name: ResourceName, q: Partial<RecordListQuery> = {}) {
  const api = useItemsApi().records(name);
  return useQuery({ queryKey: key(name, "list", q), queryFn: ({ signal }) => api.list({ per_page: 200, ...q }, signal), placeholderData: (prev) => prev });
}

/** One record by id; disabled until an id is given. */
export function useRecord(name: ResourceName, id: string | undefined) {
  const api = useItemsApi().records(name);
  return useQuery({ queryKey: key(name, "one", id), enabled: !!id, queryFn: ({ signal }) => api.get(id ?? "", signal) });
}

/**
 * Writes for one resource. Any write refreshes every list and detail of that resource (and the item screens that
 * read settings records). Errors are returned to the caller so the form can show the server sentence.
 */
export function useRecordMutations(name: ResourceName) {
  const api = useItemsApi().records(name);
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ["items"] });
  const quiet = (e: Error) => toast.error(e.message);
  return {
    create: useMutation({ mutationFn: (body: Record<string, unknown>) => api.create(body), onSuccess: refresh }),
    update: useMutation({ mutationFn: (v: { id: string; body: Record<string, unknown> }) => api.update(v.id, v.body), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => api.remove(id), onSuccess: (m) => { toast.success(m); void refresh(); }, onError: quiet }),
    action: useMutation({ mutationFn: (v: { id: string; action: RecordAction }) => api.action(v.id, v.action), onSuccess: (r) => { toast.success(r.message); void refresh(); }, onError: quiet }),
  };
}
