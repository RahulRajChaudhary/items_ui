import type { ApiErrorBody, ItemDto, ItemInputDto, PageContext, PreferencesDto } from "../api/contract";
import { ERROR_CODES } from "../api/contract";
import { SEED_PREFERENCES, seedItems } from "./seed";
import { handleCollection, type Store } from "./collections";
import { seedCollections } from "./seedCollections";

/** Result of a mock call: HTTP status and the JSON body, in the same envelope as the real backend. */
export type MockResponse = { status: number; body: Record<string, unknown> };

const err = (status: number, code: number, message: string): MockResponse => ({ status, body: { code, message } satisfies ApiErrorBody });
const ok = (message: string, data: Record<string, unknown>): MockResponse => ({ status: 200, body: { code: 0, message, ...data } });

/** In-memory database of the mock backend. One per mock server instance; tests create their own. */
export function createMockDb() {
  return { items: seedItems(), preferences: structuredClone(SEED_PREFERENCES) as PreferencesDto, store: seedCollections() as Store };
}
export type MockDb = ReturnType<typeof createMockDb>;

/** Does an item belong to a list filter? Mirrors what the real backend does for each `filter_by` id. */
function matches(item: ItemDto, filter: string): boolean {
  switch (filter) {
    case "All": return true;
    case "Active": return item.status === "active";
    case "Inactive": return item.status === "inactive";
    case "Sales": return item.rate > 0 && item.item_type !== "fund";
    case "Purchases": return item.purchase_rate > 0;
    case "Services": return item.item_type === "service";
    case "Inventory": return item.track_inventory;
    case "NonInventory": return !item.track_inventory;
    case "Returnable": return item.is_returnable;
    case "NonReturnable": return !item.is_returnable;
    case "Ungrouped": return !item.has_variant;
    case "Funds": return item.item_type === "fund";
    default:
      if (filter.startsWith("Fund.")) return item.fund_type === filter.slice(5);
      return false;
  }
}

const SORTABLE: Record<string, (a: ItemDto, b: ItemDto) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  sku: (a, b) => a.sku.localeCompare(b.sku),
  rate: (a, b) => a.rate - b.rate,
  purchase_rate: (a, b) => a.purchase_rate - b.purchase_rate,
  stock_on_hand: (a, b) => (a.stock_on_hand ?? -1) - (b.stock_on_hand ?? -1),
  created_time: (a, b) => a.created_time.localeCompare(b.created_time) || Number(a.item_id) - Number(b.item_id),
};

/** Validation rules from Settings > Items > Validation Rules: the first active rule an item breaks gives its alert (code 1070673). */
function violatedRule(db: MockDb, input: Partial<ItemInputDto>): string | null {
  const FIELD: Record<string, keyof ItemInputDto> = { "Selling Price": "rate", "Cost Price": "purchase_rate", "Item Name": "name", SKU: "sku", Unit: "unit" };
  for (const r of db.store.rules) {
    if (r.status !== "active") continue;
    const key = FIELD[String(r.field)];
    if (!key) continue;
    const actual = input[key];
    const want = String(r.value);
    const got = String(actual ?? "");
    const hit = r.comparator === "is" ? got === want : r.comparator === "is not" ? got !== want : r.comparator === "contains" ? got.includes(want) : r.comparator === "greater than" ? Number(got) > Number(want) : r.comparator === "less than" ? Number(got) < Number(want) : false;
    if (hit) return String(r.message || "This record cannot be saved.");
  }
  return null;
}

const PREF_KEYS = Object.keys(SEED_PREFERENCES);
const SUB_KEYS = Object.keys(SEED_PREFERENCES.additional_preferences);

/**
 * The mock backend: same paths, envelopes and error codes as the contract. `path` is relative to `/v3`.
 * `body` is the parsed `JSONString` of a write. Pure apart from the db it is given.
 */
export function handleMock(db: MockDb, method: string, path: string, query: URLSearchParams, body: unknown): MockResponse {
  if (!/^\d+$/.test(query.get("organization_id") ?? "")) return err(400, ERROR_CODES.invalidValue, "Invalid value passed for organization_id");

  if (method === "GET" && path === "/items") {
    const page = Math.max(1, Number(query.get("page") ?? 1));
    const perPage = Math.min(200, Math.max(1, Number(query.get("per_page") ?? 25)));
    const filter = query.get("filter_by") ?? "All";
    const sortColumn = query.get("sort_column") ?? "created_time";
    const order = query.get("sort_order") === "D" ? "D" : "A";
    const search = (query.get("search_text") ?? "").toLowerCase();
    const cmp = SORTABLE[sortColumn];
    if (!cmp) return err(400, ERROR_CODES.invalidValue, "Invalid value passed for sort_column");
    let rows = db.items.filter((i) => (filter === "All" ? true : matches(i, filter)) && (!search || i.name.toLowerCase().includes(search) || i.sku.toLowerCase().includes(search)));
    rows = [...rows].sort((a, b) => (order === "A" ? cmp(a, b) : cmp(b, a)));
    const start = (page - 1) * perPage;
    const pageContext: PageContext = { page, per_page: perPage, has_more_page: start + perPage < rows.length, applied_filter: filter, sort_column: sortColumn, sort_order: order, total: rows.length };
    return ok("success", { items: rows.slice(start, start + perPage), page_context: pageContext });
  }

  const sub = /^\/items\/([^/]+)\/(locationdetails|history)$/.exec(path);
  if (method === "GET" && sub) {
    const item = db.items.find((i) => i.item_id === sub[1]);
    if (!item) return err(404, ERROR_CODES.notFound, "We couldnt find any resource for the given ID. Please verify the ID and try again.");
    if (sub[2] === "history") return ok("success", { history: [{ history_id: `${item.item_id}-h1`, date: item.created_time, details: "created by", by: "Admin" }] });
    if (!item.track_inventory) return ok("success", { locations: [] });
    const stock = item.stock_on_hand ?? 0;
    const locations = item.item_id === "1"
      ? [{ location_id: "l1", location_name: "Head Office - Hajipur", is_primary: false, stock_on_hand: 0, committed_stock: 0, available_for_sale: 0 }, { location_id: "l2", location_name: "Main Warehouse - Hajipur", is_primary: false, stock_on_hand: 0, committed_stock: 0, available_for_sale: 0 }, { location_id: "l3", location_name: "Head Office", is_primary: true, stock_on_hand: stock, committed_stock: 0, available_for_sale: stock }]
      : [{ location_id: "l3", location_name: "Head Office", is_primary: true, stock_on_hand: stock, committed_stock: 0, available_for_sale: stock }];
    return ok("success", { locations });
  }

  if (method === "GET" && path === "/items/transactions/estimates") {
    const id = query.get("item_id");
    const transactions = id === "1" ? [{ transaction_id: "q1", date: "2026-11-13", number: "QT-000001", customer_name: "Sunrise Retail Pvt Ltd", quantity: 20, rate: 1800, total: 36000, status: "Invoiced" }] : [];
    return ok("success", { transactions });
  }

  const one = /^\/items\/([^/]+)$/.exec(path);
  if (method === "GET" && one) {
    const item = db.items.find((i) => i.item_id === one[1]);
    return item ? ok("success", { item }) : err(404, ERROR_CODES.notFound, "We couldnt find any resource for the given ID. Please verify the ID and try again.");
  }

  if (path === "/settings/preferences/items") {
    if (method === "GET") return ok("success", { preferences_items: db.preferences });
    if (method === "PUT") {
      const next = body as Partial<PreferencesDto> | null;
      if (!next || PREF_KEYS.some((k) => !(k in next)) || SUB_KEYS.some((k) => !(k in (next.additional_preferences ?? {})))) return err(400, ERROR_CODES.invalidElement, "Invalid Element");
      const full = next as PreferencesDto;
      if (full.is_item_name_duplication_enabled && !db.store.fields.some((f) => f.name === "SKU" && f.mandatory === true)) return err(400, 2900, "The SKU field needs to be marked as mandatory to enable Item Name Duplication option.");
      if (!full.is_inventory_enabled && db.items.some((i) => i.track_inventory)) return err(400, 4, "Inventory tracking cannot be disabled as inventory item(s) exist!");
      db.preferences = structuredClone(full);
      return ok("Your item preferences have been saved.", { preferences_items: db.preferences });
    }
  }

  if (method === "GET" && path === "/product/editpage") {
    return ok("success", { units: ["pcs", "box", "kg", "g", "ltr", "dz"], categories: ["Lighting", "Electrical", "Services"], brands: ["Generic", "Acme"], manufacturers: ["In house", "Acme Works"], vendors: ["Sunrise Supplies", "City Traders"],
      income_accounts: ["Sales", "Other Income"], purchase_accounts: ["Cost of Goods Sold", "Purchases"], inventory_accounts: ["Finished Goods", "Inventory Asset"],
      valuation_methods: [{ id: "FIFO", label: "FIFO (First In First Out)" }, { id: "WAC", label: "Weighted Average Cost" }] });
  }

  const NOT_FOUND = "We couldnt find any resource for the given ID. Please verify the ID and try again.";
  const LOCKED = (what: string) => `You are restricted to perform this action ${what} as the record is locked.`;
  /** Server-side rules for create and update; one problem is reported per save, like the real backend. */
  const check = (input: Partial<ItemInputDto> | null, selfId?: string): MockResponse | null => {
    if (!input || typeof input.name !== "string" || input.name.trim() === "") return err(400, ERROR_CODES.invalidValue, "Invalid value passed for name");
    if (input.name.length > 100) return err(400, ERROR_CODES.tooLong, 'Please ensure that the "name" has less than 100 characters.');
    const name = input.name.trim().toLowerCase();
    if (!db.preferences.is_item_name_duplication_enabled && db.items.some((i) => i.item_id !== selfId && i.name.toLowerCase() === name)) return err(400, 150003, `The item "${input.name.trim()}" already exists. Please specify a different name.`);
    if (typeof input.rate !== "number" || input.rate < 0) return err(400, ERROR_CODES.invalidValue, "Invalid value passed for rate");
    const hit = violatedRule(db, input);
    if (hit) return err(400, ERROR_CODES.validationRule, hit);
    return null;
  };
  const build = (id: string, input: ItemInputDto, base?: ItemDto): ItemDto => {
    const goods = input.product_type === "goods";
    const tracked = goods && input.track_inventory;
    return {
      ...(base ?? { status: "active", committed_stock: null, available_for_sale: null, stock_on_hand: null, fund_type: "", has_variant: false, is_combo_product: false, lock_details: null, created_time: new Date().toISOString() }),
      ...input, item_id: id, name: input.name.trim(), item_type: tracked ? "inventory" : goods ? "sales" : "service", track_inventory: tracked,
      stock_on_hand: tracked ? (base?.stock_on_hand ?? 0) : null, available_for_sale: tracked ? (base?.available_for_sale ?? 0) : null,
    } as ItemDto;
  };

  if (method === "POST" && path === "/items") {
    const bad = check(body as Partial<ItemInputDto> | null);
    if (bad) return bad;
    const id = String(Math.max(0, ...db.items.map((i) => Number(i.item_id))) + 1);
    const item = build(id, body as ItemInputDto);
    db.items.unshift(item);
    return ok("The item has been added.", { item });
  }
  const act = /^\/items\/([^/]+)\/(active|inactive|lock|unlock|clone)$/.exec(path);
  const target = db.items.find((i) => i.item_id === (act?.[1] ?? one?.[1]));
  if (act && method === "POST") {
    if (!target) return err(404, ERROR_CODES.notFound, NOT_FOUND);
    if (act[2] === "clone") {
      const copy: ItemDto = { ...target, item_id: String(Math.max(...db.items.map((i) => Number(i.item_id))) + 1), name: `${target.name} (Copy)`, sku: target.sku ? `${target.sku}-COPY` : "", lock_details: null };
      db.items.unshift(copy);
      return ok("The item has been cloned.", { item: copy });
    }
    if (target.lock_details?.locked && act[2] !== "unlock") return err(400, 1000, LOCKED("Edit"));
    if (act[2] === "active" || act[2] === "inactive") target.status = act[2];
    if (act[2] === "lock") target.lock_details = { locked: true };
    if (act[2] === "unlock") target.lock_details = null;
    const said = { active: "marked as active", inactive: "marked as inactive", lock: "locked", unlock: "unlocked" }[act[2] as "active"];
    return ok(`The item has been ${said}.`, { item: target });
  }
  if (one && method === "PUT") {
    if (!target) return err(404, ERROR_CODES.notFound, NOT_FOUND);
    if (target.lock_details?.locked) return err(400, 1000, LOCKED("Edit"));
    const bad = check(body as Partial<ItemInputDto> | null, target.item_id);
    if (bad) return bad;
    Object.assign(target, build(target.item_id, body as ItemInputDto, target));
    return ok("The item has been updated.", { item: target });
  }
  if (one && method === "DELETE") {
    if (!target) return err(404, ERROR_CODES.notFound, NOT_FOUND);
    if (target.lock_details?.locked) return err(400, 1000, LOCKED("Delete"));
    db.items = db.items.filter((i) => i !== target);
    return ok("The item has been deleted.", {});
  }

  const coll = handleCollection(db.store, method, path, query, body);
  if (coll) return coll;

  return err(404, ERROR_CODES.notFound, "Invalid URL Passed");
}
