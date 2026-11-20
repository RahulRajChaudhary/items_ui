/** Maps wireframe tab ids to URL segments under the module base path, and back. One table, used by the route file. */
export const ITEMS_TAB_SLUGS: Record<string, string> = {
  Items: "",
  "Composite Items": "composite",
  "Bill of Materials": "bom",
  Plans: "plans",
  Addons: "addons",
  "Price Lists": "pricelists",
  "Pricing Widgets": "widgets",
  Coupons: "coupons",
  Products: "products",
};

/** Tab id for a URL slug; unknown slugs return null. */
export function tabForSlug(slug: string | undefined): string | null {
  const s = slug ?? "";
  if (s === "new" || s === "edit") return "Items";
  return Object.keys(ITEMS_TAB_SLUGS).find((k) => ITEMS_TAB_SLUGS[k] === s) ?? null;
}

/** Which top-level tab is highlighted for a tab id (Composite Items sits under Items, Plans/Addons under Plans and Addons). */
export function topTab(tab: string): string {
  if (tab === "Composite Items") return "Items";
  if (tab === "Plans" || tab === "Addons" || tab === "Products") return "Plans and Addons";
  return tab;
}
