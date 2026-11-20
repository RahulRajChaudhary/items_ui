"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { API_BASE, DEFAULT_ORGANIZATION_ID } from "./config";
import { createApiClient } from "./api/client";
import { createItemsApi, type ItemsApi } from "./api/endpoints";

const ApiContext = createContext<ItemsApi | null>(null);

/** Switches the host decides. `locationsEnabled` mirrors the organization setting (Settings > Organization > Locations): without it no Locations tab is shown. */
export type ItemsFeatures = { locationsEnabled: boolean };
const DEFAULT_FEATURES: ItemsFeatures = { locationsEnabled: true };
const FeaturesContext = createContext<ItemsFeatures>(DEFAULT_FEATURES);

/**
 * Gives the module its API. The host may pass its own `api` (an implementation of the same interface) or just an
 * organization id; otherwise the standalone default (mock or NEXT_PUBLIC_BOSS_API_BASE) is used.
 * Must wrap every Items screen. Does not own any data.
 */
export function ItemsProvider({ api, organizationId = DEFAULT_ORGANIZATION_ID, features = DEFAULT_FEATURES, children }: { api?: ItemsApi; organizationId?: string; features?: ItemsFeatures; children: ReactNode }) {
  const value = useMemo(() => api ?? createItemsApi(createApiClient({ baseUrl: API_BASE, organizationId })), [api, organizationId]);
  return <ApiContext.Provider value={value}><FeaturesContext.Provider value={features}>{children}</FeaturesContext.Provider></ApiContext.Provider>;
}

/** The module's API. Throws if used outside ItemsProvider. */
export function useItemsApi(): ItemsApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useItemsApi must be used inside ItemsProvider");
  return api;
}

/** Host switches for the module. */
export function useItemsFeatures(): ItemsFeatures {
  return useContext(FeaturesContext);
}
