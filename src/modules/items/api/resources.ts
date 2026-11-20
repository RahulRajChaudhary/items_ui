/**
 * Every record type of the module's secondary screens (P6 settings and P7 module tabs) shares one request shape:
 * list, get, create, update, delete and a few status actions. This table names each resource's path and the keys
 * of its response envelope, so the client, the mock and the screens all agree. UNVERIFIED: paths other than the ones
 * listed in the brief section 9.2 were inferred; confirm each before wiring a real backend.
 */
export const RESOURCES = {
  composite: { path: "/compositeitems", list: "composite_items", one: "composite_item" },
  bom: { path: "/billofmaterials", list: "billofmaterials", one: "billofmaterial" },
  plans: { path: "/plans", list: "plans", one: "plan" },
  addons: { path: "/addons", list: "addons", one: "addon" },
  products: { path: "/products", list: "products", one: "product" },
  pricelists: { path: "/pricebooks", list: "pricebooks", one: "pricebook" },
  widgets: { path: "/pricingwidgets", list: "pricing_widgets", one: "pricing_widget" },
  coupons: { path: "/coupons", list: "coupons", one: "coupon" },
  fields: { path: "/settings/fields", list: "fields", one: "field" },
  rules: { path: "/settings/fieldvalidations", list: "validation_rules", one: "validation_rule" },
  locks: { path: "/settings/recordlockingconfigurations", list: "lock_configurations", one: "lock_configuration" },
  buttons: { path: "/settings/custombuttons", list: "custom_buttons", one: "custom_button" },
  related: { path: "/settings/relatedlists", list: "related_lists", one: "related_list" },
} as const;

export type ResourceName = keyof typeof RESOURCES;

/** One row inside a record (a BOM component, an operation, an associated item). */
export type RowValue = Record<string, string | number | boolean>;

/** A record of any secondary resource: the fields are described by the screen's config, not by one type per entity. */
export type RecordDto = { id: string; status: "active" | "inactive"; created_time: string } & Record<string, unknown>;

/** Statuses a record can be moved to with `POST <path>/{id}/<action>`. */
export type RecordAction = "active" | "inactive" | "mandatory" | "optional" | "showpdf" | "hidepdf";

export type RecordListQuery = { page: number; per_page: number; filter_by: string; sort_column: string; sort_order: "A" | "D"; entity?: string };
