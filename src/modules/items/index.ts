/**
 * Public entry of the Items module. The host app imports only from here (see INTEGRATION.md): the provider that
 * gives the module its API and switches, the route table, and the navigation entry.
 */
export { ItemsProvider, useItemsFeatures, type ItemsFeatures } from "./ItemsProvider";
export { createApiClient, type ApiClient, type ApiClientOptions } from "./api/client";
export { createItemsApi, type ItemsApi } from "./api/endpoints";
export { ItemsFrame } from "./components/ItemsFrame";
export { ITEMS_TAB_SLUGS } from "./routes";

/** Screens the host mounts, by the path segment under its base path (an empty segment is the Items list). */
export const ItemsRoutes = {
  items: "",
  newItem: "new",
  editItem: "edit/:id",
  composite: "composite",
  bom: "bom",
  plans: "plans",
  addons: "addons",
  products: "products",
  pricelists: "pricelists",
  widgets: "widgets",
  coupons: "coupons",
} as const;

/** Settings screens, relative to the host's settings base path. */
export const ItemsSettingsRoutes = { items: "items" } as const;

/** The entry BOSS adds to its navigation menu. */
export const itemsNavEntry = { label: "Items", icon: "items", path: "/items" } as const;
