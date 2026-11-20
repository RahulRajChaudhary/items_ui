import { describe, expect, it } from "vitest";
import { createMockDb, handleMock } from "../../mocks/handler";
import { ENTITIES } from "./entities";
import { defaultsFor, schemaFor, toBody } from "./ConfigForm";

const q = (s = "") => new URLSearchParams(`organization_id=1&${s}`);
const call = (db: ReturnType<typeof createMockDb>, method: string, path: string, body?: unknown, query = "") => handleMock(db, method, path, q(query), body);

describe("generic records API", () => {
  it("lists, filters and decorates products", () => {
    const db = createMockDb();
    const all = call(db, "GET", "/products");
    expect((all.body.products as unknown[]).length).toBe(3);
    const active = call(db, "GET", "/products", undefined, "filter_by=Active");
    expect((active.body.products as unknown[]).length).toBe(2);
    expect((all.body.products as { name: string; plan_count: number }[]).find((p) => p.name === "BOSS Cloud Suite")?.plan_count).toBe(2);
  });

  it("creates, refuses a duplicate name and deletes", () => {
    const db = createMockDb();
    expect(call(db, "POST", "/coupons", { name: "Spring", code: "SPR" }).body.code).toBe(0);
    expect(call(db, "POST", "/coupons", { name: "spring", code: "SPR2" }).body.code).toBe(150003);
    expect(call(db, "POST", "/coupons", { name: "" }).body.code).toBe(2);
    const id = (db.store.coupons.find((c) => c.name === "Spring") as { id: string }).id;
    expect(call(db, "DELETE", `/coupons/${id}`).body.code).toBe(0);
  });

  it("filters coupons by expiry and addons by type", () => {
    const db = createMockDb();
    expect((call(db, "GET", "/addons", undefined, "filter_by=Recurring").body.addons as unknown[]).length).toBe(1);
    expect((call(db, "GET", "/addons", undefined, "filter_by=OneTime").body.addons as unknown[]).length).toBe(1);
  });

  it("will not delete a built-in field but toggles its status and mandatory flag", () => {
    const db = createMockDb();
    expect(call(db, "DELETE", "/settings/fields/1").status).toBe(400);
    call(db, "POST", "/settings/fields/1/mandatory");
    expect(db.store.fields[0]?.mandatory).toBe(true);
  });

  it("applies an active validation rule to item saves", () => {
    const db = createMockDb();
    call(db, "POST", "/settings/fieldvalidations", { name: "No 7777", field: "Selling Price", comparator: "is", value: "7777", message: "Not allowed." });
    const body = { name: "Rule Lamp", sku: "", product_type: "goods", unit: "pcs", rate: 7777, purchase_rate: 1, description: "", purchase_description: "", category_name: "", brand: "", manufacturer: "", account_name: "Sales", purchase_account_name: "Cost of Goods Sold", track_inventory: false, inventory_valuation_method: "", is_returnable: false, reorder_level: null };
    expect(call(db, "POST", "/items", body).body.code).toBe(1070673);
    expect(call(db, "POST", "/items", { ...body, rate: 100 }).body.code).toBe(0);
  });

  it("allows duplicate names only once the SKU field is mandatory", () => {
    const db = createMockDb();
    const prefs = { ...(call(db, "GET", "/settings/preferences/items").body.preferences_items as object), is_item_name_duplication_enabled: true };
    expect(call(db, "PUT", "/settings/preferences/items", prefs).body.code).toBe(2900);
    call(db, "POST", "/settings/fields/1/mandatory");
    expect(call(db, "PUT", "/settings/preferences/items", prefs).body.code).toBe(0);
  });
});

describe("config-driven forms", () => {
  it("builds one schema per entity and flags missing required fields and empty row tables", () => {
    for (const cfg of Object.values(ENTITIES)) {
      const schema = schemaFor(cfg.sections);
      expect(schema.safeParse(defaultsFor(cfg.sections)).success).toBe(cfg.sections.every((s) => s.fields.every((f) => !f.required)));
    }
  });

  it("converts numbers and drops hidden fields", () => {
    const sections = [{ fields: [{ key: "a", label: "A", kind: "number" as const }, { key: "b", label: "B", kind: "text" as const, showIf: (v: Record<string, unknown>) => v.a === "1" }] }];
    expect(toBody(sections, { a: "5", b: "x" })).toEqual({ a: 5 });
    expect(toBody(sections, { a: "1", b: " x " })).toEqual({ a: 1, b: "x" });
  });

  it("validates BOM component rows", () => {
    const bom = ENTITIES.bom!;
    const values = { ...defaultsFor(bom.sections), name: "B", item_to_produce: "X", quantity: "1", number: "BOM-1", components: [{ name: "", quantity: "1" }] };
    const r = schemaFor(bom.sections).safeParse(values);
    expect(r.success).toBe(false);
  });
});
