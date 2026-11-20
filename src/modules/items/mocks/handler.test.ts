import { describe, expect, it } from "vitest";
import { SEED_PREFERENCES } from "./seed";
import { createMockDb, handleMock } from "./handler";

const q = (s: string) => new URLSearchParams(`organization_id=1&${s}`);

describe("mock items API", () => {
  it("rejects a bad organization id with code 2", () => {
    const r = handleMock(createMockDb(), "GET", "/items", new URLSearchParams("organization_id=abc"), undefined);
    expect(r.status).toBe(400);
    expect(r.body.code).toBe(2);
  });

  it("pages and filters the list", () => {
    const db = createMockDb();
    const r = handleMock(db, "GET", "/items", q("page=1&per_page=25&filter_by=Active&sort_column=name&sort_order=A"), undefined);
    const ctx = r.body.page_context as { has_more_page: boolean; total: number };
    expect((r.body.items as unknown[]).length).toBe(25);
    expect(ctx.has_more_page).toBe(true);
    expect(ctx.total).toBeGreaterThan(1000);
  });

  it("returns 404 code 5 for a missing item", () => {
    const r = handleMock(createMockDb(), "GET", "/items/nope", q(""), undefined);
    expect(r.status).toBe(404);
    expect(r.body.code).toBe(5);
  });

  it("refuses a partial preferences save with code 8 and accepts a full one", () => {
    const db = createMockDb();
    expect(handleMock(db, "PUT", "/settings/preferences/items", q(""), { quantity_precision: 4 }).body.code).toBe(8);
    const full = handleMock(db, "PUT", "/settings/preferences/items", q(""), { ...SEED_PREFERENCES, quantity_precision: 4 });
    expect(full.body.code).toBe(0);
    expect(handleMock(db, "GET", "/settings/preferences/items", q(""), undefined).body.preferences_items).toMatchObject({ quantity_precision: 4 });
  });

  it("refuses turning inventory tracking off while inventory items exist", () => {
    const r = handleMock(createMockDb(), "PUT", "/settings/preferences/items", q(""), { ...SEED_PREFERENCES, is_inventory_enabled: false });
    expect(r.status).toBe(400);
  });

  const body = { name: "Brand New Lamp", sku: "", product_type: "goods", unit: "pcs", rate: 100, purchase_rate: 50, description: "", purchase_description: "", category_name: "", brand: "", manufacturer: "", account_name: "Sales", purchase_account_name: "Cost of Goods Sold", track_inventory: true, inventory_valuation_method: "FIFO", is_returnable: true, reorder_level: null };

  it("creates an item and refuses a duplicate name with code 150003", () => {
    const db = createMockDb();
    expect(handleMock(db, "POST", "/items", q(""), body).body.code).toBe(0);
    const dup = handleMock(db, "POST", "/items", q(""), body);
    expect(dup.status).toBe(400);
    expect(dup.body.code).toBe(150003);
  });

  it("refuses an empty or too long name", () => {
    const db = createMockDb();
    expect(handleMock(db, "POST", "/items", q(""), { ...body, name: " " }).body.code).toBe(2);
    expect(handleMock(db, "POST", "/items", q(""), { ...body, name: "x".repeat(101) }).body.code).toBe(15);
  });

  it("refuses edit and delete while locked, allows after unlock", () => {
    const db = createMockDb();
    handleMock(db, "POST", "/items/1/lock", q(""), undefined);
    const edit = handleMock(db, "PUT", "/items/1", q(""), { ...body, name: "LED Panel Light 40W" });
    expect(edit.body.message).toContain("record is locked");
    expect(handleMock(db, "DELETE", "/items/1", q(""), undefined).status).toBe(400);
    handleMock(db, "POST", "/items/1/unlock", q(""), undefined);
    expect(handleMock(db, "DELETE", "/items/1", q(""), undefined).body.code).toBe(0);
  });

  it("marks inactive and clones", () => {
    const db = createMockDb();
    handleMock(db, "POST", "/items/1/inactive", q(""), undefined);
    expect(db.items.find((i) => i.item_id === "1")?.status).toBe("inactive");
    const clone = handleMock(db, "POST", "/items/1/clone", q(""), undefined);
    expect((clone.body.item as { name: string }).name).toContain("(Copy)");
  });
});
