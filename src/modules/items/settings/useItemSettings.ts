"use client";
import { useQuery } from "@tanstack/react-query";
import { useItemsApi } from "../ItemsProvider";
import { toSettings } from "../api/mappers";
import type { ItemSettings } from "../domain/types";

export const SETTINGS_KEY = ["items", "settings"] as const;

/**
 * The only reader of item preferences. Screens ask this hook (formatQuantity, units, flags) and never read raw
 * preference JSON. While loading, `settings` is null and formatQuantity uses 3 decimals, the wireframe default.
 */
export function useItemSettings() {
  const api = useItemsApi();
  const q = useQuery({ queryKey: SETTINGS_KEY, queryFn: ({ signal }) => api.getPreferences(signal).then((r) => toSettings(r.preferences_items)) });
  const settings: ItemSettings | null = q.data ?? null;
  const decimals = settings?.quantityDecimals ?? 3;
  return {
    settings,
    isLoading: q.isLoading,
    /** Quantity with the organization's decimal places. Null shows "-". */
    formatQuantity: (n: number | null | undefined) => (n == null ? "-" : n.toFixed(decimals)),
  };
}
