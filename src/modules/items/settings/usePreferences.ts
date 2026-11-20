"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useItemsApi } from "../ItemsProvider";
import type { PreferencesDto } from "../api/contract";

export const PREFS_KEY = ["items", "preferences"] as const;

/** The full preferences object as the server holds it (the Preferences tab edits a copy of this). */
export function usePreferences() {
  const api = useItemsApi();
  return useQuery({ queryKey: PREFS_KEY, queryFn: ({ signal }) => api.getPreferences(signal).then((r) => r.preferences_items) });
}

/**
 * Saves preferences. Always sends the FULL object (a partial save is refused with code 8). On success every items
 * query is refreshed, so lists, details, forms and `useItemSettings` pick the change up at once.
 */
export function useSavePreferences() {
  const api = useItemsApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (full: PreferencesDto) => api.savePreferences(full),
    onSuccess: (r) => {
      client.setQueryData(PREFS_KEY, r.preferences_items);
      return client.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
