import type { ColumnDef, EntityConfig, FieldDef } from "./types";

/** Short builders so each entity below reads as data. */
const text = (key: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind: "text", ...o });
const money = (key: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind: "money", prefix: "INR", ...o });
const num = (key: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind: "number", ...o });
const pick = (key: string, label: string, options: string[], o: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind: "select", options, ...o });
const radio = (key: string, label: string, options: string[], o: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind: "radio", options, required: true, ...o });
const area = (key: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind: "textarea", ...o });
const col = (key: string, label: string, o: Partial<ColumnDef> = {}): ColumnDef => ({ key, label, ...o });
const status = col("status", "Status", { badge: true });
const ACCOUNTS = ["Sales", "Other Income"];
const f = (id: string, label: string) => ({ id, label });

/** Wireframe filters for the list title dropdowns. */
const ACTIVE_FILTERS = [f("All", "All"), f("Active", "Active"), f("Inactive", "Inactive")];

export const COMPOSITE: EntityConfig = {
  slug: "composite", resource: "composite", label: "Composite Items", singular: "Composite Item", layout: "split", defaultFilter: "All",
  filters: [f("All", "All Composite Items"), f("Ungrouped", "Ungrouped Items"), f("Active", "Active Items"), f("LowStock", "Low Stock Items"), f("Inactive", "Inactive Items"), f("Assembly", "Assembly"), f("Kit", "Kit")],
  columns: [col("name", "Name"), col("sku", "SKU"), col("type", "Type"), col("stock", "Stock On Hand", { align: "right" }), col("rate", "Rate", { align: "right", money: true }), status],
  rowTitle: (r) => String(r.name), rowSub: (r) => (r.sku ? `SKU: ${String(r.sku)}` : undefined),
  tabs: [
    { id: "overview", label: "Overview", kind: "fields", fields: [{ label: "Item Name", key: "name" }, { label: "Type", key: "type" }, { label: "SKU", key: "sku" }, { label: "Unit", key: "unit" }, { label: "Selling Price", key: "rate", money: true }, { label: "Stock On Hand", key: "stock" }, { label: "Reorder Point", key: "reorder" }] },
    { id: "items", label: "Associated Items", kind: "rows", rowsKey: "items", counted: true, empty: "No associated items", columns: [col("name", "Item"), col("quantity", "Quantity", { align: "right" }), col("rate", "Rate", { align: "right", money: true })] },
  ],
  sections: [
    { title: "Item Type", fields: [radio("type", "Type", ["Assembly", "Kit"]), text("name", "Name", { required: true, max: 100 }), text("sku", "SKU"), text("unit", "Unit", { required: true })] },
    { title: "Associated Items", fields: [{ key: "items", label: "Associated Items", kind: "rows", required: true, addLabel: "Add Item", rows: [text("name", "Item", { required: true }), num("quantity", "Quantity", { required: true }), money("rate", "Rate")] }] },
    { title: "Sales Information", fields: [money("rate", "Selling Price", { required: true }), pick("account", "Account", ACCOUNTS, { required: true }), area("description", "Description")] },
    { title: "Inventory", fields: [num("reorder", "Reorder Point"), pick("valuation", "Inventory Valuation Method", ["FIFO", "Weighted Average Cost"], { required: true })] },
  ],
  empty: { title: "Group different items together and sell them as a single item", text: "Assembly items and kits show here once you create them.", actions: ["New Composite Item", "Import Composite Items"] },
  defaults: { type: "Assembly", account: "Sales", valuation: "FIFO" },
};

export const BOM: EntityConfig = {
  slug: "bom", resource: "bom", label: "Bill of Materials", singular: "Bill of Materials", layout: "split", defaultFilter: "All",
  filters: [f("All", "All Bill Of Materials"), f("Active", "Active"), f("Inactive", "Inactive")],
  columns: [col("number", "Bill Of Material#"), col("name", "Name"), status, col("description", "Description"), col("item_to_produce", "Item To Produce"), col("quantity", "Quantity To Produce", { align: "right" }), col("unit", "Unit")],
  rowTitle: (r) => `${String(r.number)} · ${String(r.name)}`, rowSub: (r) => String(r.item_to_produce ?? ""),
  headline: (r) => `${String(r.number)} ${String(r.name)}`,
  summary: [{ label: "Item to Produce", key: "item_to_produce" }, { label: "Quantity", key: "quantity" }, { label: "Unit", key: "unit" }],
  headerActions: ["Create Manufacturing Order", "PDF/Print", "Cost Overview"],
  tabs: [
    { id: "details", label: "Bill of Materials Details", kind: "fields", fields: [{ label: "BOM#", key: "number" }, { label: "Name", key: "name" }, { label: "Description", key: "description" }] },
    { id: "components", label: "Components", kind: "rows", rowsKey: "components", counted: true, empty: "No components", columns: [col("name", "Name"), col("quantity", "Quantity", { align: "right" }), col("scrap", "Scrap Percentage", { align: "right" }), col("unit", "Unit")] },
    { id: "operations", label: "Operations", kind: "rows", rowsKey: "operations", counted: true, empty: "No operations", columns: [col("name", "Name"), col("instructions", "Instructions"), col("work_center_type", "Work Center Type"), col("duration", "Duration (MM:SS)"), col("blocked_by", "Blocked By Operations"), col("attachment", "Attachment")] },
    { id: "orders", label: "Manufacturing Orders", kind: "rows", rowsKey: "manufacturing_orders", counted: true, empty: "No manufacturing orders", columns: [col("number", "Manufacturing Order#"), col("reference", "Reference Number"), col("status", "Status")] },
  ],
  sections: [
    { fields: [text("number", "BOM#", { required: true }), text("name", "Name", { required: true, max: 100 }), text("item_to_produce", "Item to Produce", { required: true }), num("quantity", "Quantity", { required: true }), text("unit", "Unit"), area("description", "Description", { max: 250 })] },
    { tab: "Components", fields: [{ key: "components", label: "Components", kind: "rows", required: true, addLabel: "Add Component", rows: [text("name", "Name", { required: true }), num("quantity", "Quantity", { required: true }), num("scrap", "Scrap %"), text("unit", "Unit")] }] },
    { tab: "Operations", fields: [{ key: "operations", label: "Operations", kind: "rows", addLabel: "Add Operation", rows: [text("name", "Name", { required: true }), text("instructions", "Instructions"), text("work_center_type", "Work Center Type"), text("duration", "Duration (MM:SS)"), text("blocked_by", "Blocked By Operations"), text("attachment", "Attachment")] }] },
  ],
  empty: { title: "Create your first Bill of Materials", text: "A bill of materials lists the components and operations needed to make an item.", actions: ["New Bill of Materials"] },
  defaults: { number: "BOM-00002" },
};

const PRODUCT_OPTIONS = { optionsFrom: "products" as const };
const planFields = (kind: "plan" | "addon"): EntityConfig["sections"] => kind === "addon" ? [
  { fields: [{ ...pick("product", "Product", [], { required: true }), optionsFrom: "products" as const }, text("name", "Addon Name", { required: true, max: 100 }), text("code", "Addon Code", { required: true }), area("description", "Addon Description", { max: 250 }),
    radio("type", "Addon Type", ["One-time", "Recurring"]), pick("frequency", "Pricing Interval", ["Month(s)", "Year(s)"], { required: true, showIf: (v) => v.type === "Recurring" })] },
  { tab: "Pricing", fields: [pick("model", "Pricing Model", ["Per Unit", "Tiered", "Volume", "Package"], { required: true }), text("unit_name", "Unit Name", { required: true }), money("price", "Price", { required: true, hint: "Billed every month" })] },
  { tab: "Plans", fields: [pick("plans", "Associated Plans", ["All Plans", "Selected Plans"], { required: true })] },
  { tab: "Hosted Payment Pages & Portal", fields: [{ key: "widgets_pref", label: "Widgets Preference", kind: "switch" as const, hint: "Display this addon in the pricing and checkout widgets" }, { key: "plan_change", label: "Associate Addon", kind: "switch" as const, hint: "Allow customers to add this addon from the portal" }] },
  { tab: "Other Details", fields: [pick("addon_account", "Account", ACCOUNTS, { required: true }), radio("goods_or_service", "Type", ["Goods", "Service"]), pick("fund_type", "Fund Type", ["Revenue", "Corpus"])] },
] : [
  { fields: [{ ...pick("product", "Product", [], { required: true }), optionsFrom: "products" as const }, text("name", "Plan Name", { required: true, max: 100 }), text("code", "Plan Code", { required: true }),
    pick("frequency", "Billing Frequency", ["1 month(s)", "3 month(s)", "6 month(s)", "12 month(s)"], { required: true }), area("description", "Plan Description", { max: 250 })] },
  { tab: "Pricing", fields: [pick("model", "Pricing Model", ["Per Unit", "Tiered", "Volume", "Package"], { required: true }), text("unit_name", "Unit Name", { required: true }), money("price", "Price", { required: true }), num("trial_days", "Free Trial (days)"), money("setup_fee", "Setup Fee"), radio("goods_or_service", "Type", ["Goods", "Service"])] },
  { tab: "Hosted Payment Pages & Portal", fields: [{ key: "widgets_pref", label: "Widgets Preference", kind: "switch" as const, hint: "Display this plan in the pricing and checkout widgets" }, { key: "plan_change", label: "Plan Change", kind: "switch" as const, hint: "Allow customers to switch to this plan from the portal" }] },
  { tab: "Other Details", fields: [pick("plan_account", "Plan Account", ACCOUNTS, { required: true }), pick("fund_type", "Fund Type", ["Revenue", "Corpus"])] },
];

export const PLANS: EntityConfig = {
  slug: "plans", resource: "plans", label: "Plans", singular: "Plan", layout: "split", defaultFilter: "All", filters: ACTIVE_FILTERS, sibling: { label: "Products", slug: "products" },
  columns: [col("name", "Plan Name"), col("product", "Product"), col("code", "Plan Code"), status, col("frequency", "Billing Frequency"), col("price", "Price", { align: "right", money: true })],
  rowTitle: (r) => String(r.name), rowSub: (r) => String(r.product ?? ""),
  headline: (r) => `${String(r.name)} · ${String(r.code)}`,
  summary: [{ label: "Price", key: "price", money: true }, { label: "Billing Frequency", key: "frequency" }],
  tabs: [
    { id: "details", label: "Plan Details", kind: "fields", fields: [{ label: "Product", key: "product" }, { label: "Plan Code", key: "code" }, { label: "Pricing Model", key: "model" }, { label: "Billing Frequency", key: "frequency" }, { label: "Price", key: "price", money: true }, { label: "Free Trial (days)", key: "trial_days" }, { label: "Setup Fee", key: "setup_fee", money: true }, { label: "Account", key: "plan_account" }] },
    { id: "addons", label: "Addons", kind: "empty", title: "No addons are attached to this plan", text: "Addons marked for All Plans appear here." },
    { id: "pricelists", label: "Price Lists", kind: "empty", title: "No price lists use this plan" },
    { id: "activity", label: "Activity Logs", kind: "activity" },
  ],
  sections: planFields("plan"),
  empty: { title: "Create tailor-made plans for any pricing model", text: "Plans define what customers pay and how often.", actions: ["New Plan"] },
  defaults: { model: "Per Unit", frequency: "1 month(s)", plan_account: "Sales", goods_or_service: "Service" },
};

export const ADDONS: EntityConfig = {
  slug: "addons", resource: "addons", label: "Addons", singular: "Addon", layout: "split", defaultFilter: "All", sibling: { label: "Products", slug: "products" },
  filters: [...ACTIVE_FILTERS, f("Recurring", "Recurring"), f("OneTime", "One Time")],
  columns: [col("name", "Addon Name"), col("product", "Product"), col("code", "Addon Code"), status, col("type", "Type"), col("frequency", "Interval"), col("price", "Price", { align: "right", money: true })],
  rowTitle: (r) => String(r.name), rowSub: (r) => String(r.product ?? ""),
  summary: [{ label: "Price", key: "price", money: true }, { label: "Type", key: "type" }],
  tabs: [
    { id: "details", label: "Addon Details", kind: "fields", fields: [{ label: "Product", key: "product" }, { label: "Addon Code", key: "code" }, { label: "Type", key: "type" }, { label: "Pricing Model", key: "model" }, { label: "Interval", key: "frequency" }, { label: "Associated Plans", key: "plans" }, { label: "Price", key: "price", money: true }] },
    { id: "plans", label: "Plans", kind: "empty", title: "Applies to all plans" },
    { id: "activity", label: "Activity Logs", kind: "activity" },
  ],
  sections: planFields("addon"),
  empty: { title: "Pack extra value into subscriptions", text: "Addons are one-time or recurring extras customers add to a plan.", actions: ["New Addon"] },
  defaults: { type: "Recurring", model: "Per Unit", frequency: "Month(s)", plans: "All Plans", addon_account: "Sales", goods_or_service: "Service" },
};

export const PRODUCTS: EntityConfig = {
  slug: "products", resource: "products", label: "Products", singular: "Product", layout: "split", defaultFilter: "All", filters: ACTIVE_FILTERS, modalForm: true,
  columns: [col("name", "Name"), col("description", "Description"), status, col("plan_count", "Plans", { align: "right" }), col("addon_count", "Addons", { align: "right" })],
  rowTitle: (r) => String(r.name), rowSub: (r) => String(r.description ?? ""),
  headerActions: ["Add Plan", "Add Addon"],
  tabs: [
    { id: "plans", label: "Plans", kind: "rows", rowsKey: "plan_rows", counted: true, empty: "Almost there! Finish creating your product", columns: [col("name", "Plan"), col("code", "Code"), col("price", "Price", { align: "right", money: true })] },
    { id: "addons", label: "Addons", kind: "rows", rowsKey: "addon_rows", counted: true, empty: "Almost there! Finish creating your product", columns: [col("name", "Addon"), col("code", "Code"), col("price", "Price", { align: "right", money: true })] },
  ],
  sections: [{ fields: [text("name", "Name", { required: true, max: 100 }), area("description", "Description", { max: 250 })] }],
  empty: { title: "Create your first product", text: "A product groups the plans and addons you sell.", actions: ["New Product"] },
  deleteText: (r) => `"${String(r.name)}" and its plans and addons will be removed from the list. This cannot be undone.`,
};

export const PRICELISTS: EntityConfig = {
  slug: "pricelists", resource: "pricelists", label: "Price Lists", singular: "Price List", layout: "table", defaultFilter: "All",
  filters: [f("All", "All Price Lists"), f("Sales", "Sales"), f("Purchase", "Purchase")],
  columns: [col("name", "Name"), col("description", "Description"), col("currency", "Currency"), col("details", "Details"), col("scheme", "Pricing Scheme"), col("round_off", "Round Off Preference")],
  rowTitle: (r) => String(r.name),
  tabs: [],
  sections: [{ fields: [text("name", "Name", { required: true, max: 100 }), radio("transaction_type", "Transaction Type", ["Sales", "Purchase"]), radio("scheme", "Price List Type", ["All Items", "Individual Items"]), area("description", "Description", { max: 250 }),
    radio("pricing_rule", "Pricing Rule", ["Markup", "Markdown"]), num("percentage", "Sales Rate by %", { required: true }), pick("round_off", "Round Off To", ["Never mind", "Nearest whole number", "0.99", "0.50", "0.49"], { required: true })] }],
  empty: { title: "Customize Your Item Pricing with Flexibility", text: "Create price lists to sell or buy items at different rates.", actions: ["Create Price List"], diagram: true },
  defaults: { transaction_type: "Sales", scheme: "All Items", pricing_rule: "Markdown", round_off: "Never mind", currency: "INR" },
  derive: (b) => ({ ...b, currency: "INR", details: `${String(b.pricing_rule)} ${String(b.transaction_type).toLowerCase()} rate by ${String(b.percentage)} %` }),
};

export const WIDGETS: EntityConfig = {
  slug: "widgets", resource: "widgets", label: "Pricing Widgets", singular: "Pricing Widget", layout: "table", defaultFilter: "All", filters: ACTIVE_FILTERS, modalForm: true,
  columns: [col("name", "Name"), col("product", "Product"), status, col("created_time", "Created")],
  rowTitle: (r) => String(r.name), tabs: [],
  sections: [{ fields: [text("name", "Name", { required: true, max: 100 }), { ...pick("product", "Product", [], { required: true }), ...PRODUCT_OPTIONS }] }],
  empty: { title: "Create Your First Pricing Widget", text: "Embed a pricing table for your plans on your own website.", actions: ["New Pricing Widget"] },
  afterCreate: (id) => `/items/widgets/builder/${id}`,
};

export const COUPONS: EntityConfig = {
  slug: "coupons", resource: "coupons", label: "Coupons", singular: "Coupon", layout: "split", defaultFilter: "All", filters: [...ACTIVE_FILTERS, f("Expired", "Expired")],
  columns: [col("name", "Name"), col("code", "Coupon Code"), status, col("discount_value", "Discount Value", { align: "right" }), col("discount_by", "Discount By"), col("type", "Redemption Type"), col("max_redemption", "Maximum Redemption", { align: "right" }), col("valid_upto", "Valid Upto")],
  rowTitle: (r) => String(r.name), rowSub: (r) => String(r.code ?? ""),
  headline: (r) => `${String(r.name)} · ${String(r.code)}`,
  summary: [{ label: "Discount", key: "discount_value" }, { label: "Discount By", key: "discount_by" }, { label: "Redemption Type", key: "type" }],
  tabs: [
    { id: "details", label: "Coupon Details", kind: "fields", fields: [{ label: "Coupon Name", key: "name" }, { label: "Coupon Code", key: "code" }, { label: "Discount By", key: "discount_by" }, { label: "Discount Value", key: "discount_value" }, { label: "Redemption Type", key: "type" }, { label: "Maximum Redemption", key: "max_redemption" }, { label: "Valid Upto", key: "valid_upto" }, { label: "Applicable To", key: "product_scope" }] },
    { id: "code", label: "Coupon Code", kind: "empty", title: "No Additional Coupon Codes Created Yet!", actions: ["New", "Import"] },
    { id: "transactions", label: "Transactions", kind: "rows", rowsKey: "transactions", empty: "No Events found", columns: [col("availed_on", "Availed On"), col("invoice", "Invoice Number"), col("customer", "Customer Name"), col("amount", "Discount Amount", { align: "right", money: true })] },
    { id: "activity", label: "Activity Logs", kind: "activity" },
  ],
  sections: [{ fields: [text("name", "Coupon Name", { required: true, max: 100 }), text("code", "Coupon Code", { required: true, max: 30 }), radio("discount_by", "Discount By", ["Percentage", "Flat"]), num("discount_value", "Discount Value", { required: true }),
    radio("type", "Redemption Type", ["One Time", "Unlimited"]), num("max_redemption", "Maximum Redemption"), { key: "valid_upto", label: "Valid Upto", kind: "date" }, pick("product_scope", "Applicable To", ["All Products", "Selected Products"], { required: true })] }],
  empty: { title: "Create coupons to give your customers a discount", text: "Coupons can be applied to plans and addons at checkout.", actions: ["New Coupon"] },
  defaults: { discount_by: "Percentage", type: "One Time", product_scope: "All Products" },
};

/** Every module tab that is a generated screen, by URL slug. Items itself has its own hand-built screens. */
export const ENTITIES: Record<string, EntityConfig> = Object.fromEntries([COMPOSITE, BOM, PLANS, ADDONS, PRODUCTS, PRICELISTS, WIDGETS, COUPONS].map((e) => [e.slug, e]));
