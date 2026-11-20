import { describe, expect, it } from "vitest";
import { createApiClient } from "./client";
import { ApiError } from "./errors";
import { createMockDb, handleMock } from "../mocks/handler";
import { createItemsApi } from "./endpoints";

/** A fetch that talks to the in-memory mock, so the real client code runs end to end. */
function mockFetch() {
  const db = createMockDb();
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(String(input), "http://x");
    let body: unknown;
    if (init?.body instanceof URLSearchParams) body = JSON.parse(init.body.get("JSONString") ?? "null");
    const r = handleMock(db, init?.method ?? "GET", url.pathname.replace(/^\/api\/mock\/v3/, ""), url.searchParams, body);
    return new Response(JSON.stringify(r.body), { status: r.status });
  };
  return fetchImpl;
}

describe("api client against the mock", () => {
  it("lists items through the typed endpoint", async () => {
    const api = createItemsApi(createApiClient({ baseUrl: "/api/mock", organizationId: "1", fetchImpl: mockFetch() }));
    const r = await api.listItems({ page: 1, per_page: 10, filter_by: "All", sort_column: "name", sort_order: "A" });
    expect(r.items).toHaveLength(10);
  });

  it("throws ApiError with the server sentence", async () => {
    const api = createItemsApi(createApiClient({ baseUrl: "/api/mock", organizationId: "1", fetchImpl: mockFetch() }));
    await expect(api.getItem("missing")).rejects.toMatchObject({ code: 5 });
    await expect(api.getItem("missing")).rejects.toBeInstanceOf(ApiError);
  });

  it("sends the full preferences object", async () => {
    const api = createItemsApi(createApiClient({ baseUrl: "/api/mock", organizationId: "1", fetchImpl: mockFetch() }));
    const cur = (await api.getPreferences()).preferences_items;
    const saved = await api.savePreferences({ ...cur, quantity_precision: 2 });
    expect(saved.preferences_items.quantity_precision).toBe(2);
  });
});
