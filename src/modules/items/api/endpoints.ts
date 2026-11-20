import type { ApiClient } from "./client";
import type { ItemsEndpoints, ItemListQuery, ItemInputDto, PageContext } from "./contract";
import { RESOURCES, type RecordAction, type RecordDto, type RecordListQuery, type ResourceName } from "./resources";

/** Typed endpoint functions: the only callers of the client. Hooks use these; components never do. */
export function createItemsApi(client: ApiClient) {
  const records = new Map<ResourceName, RecordsApi>();
  return {
    /** Record API for a secondary resource, created once per resource. */
    records: (name: ResourceName): RecordsApi => { let r = records.get(name); if (!r) { r = createRecordsApi(client, name); records.set(name, r); } return r; },
    listItems: (q: ItemListQuery, signal?: AbortSignal) => client.get<ItemsEndpoints["GET /items"]["response"]>("/items", { ...q, usestate: "true" }, signal),
    getItem: (id: string, signal?: AbortSignal) => client.get<ItemsEndpoints["GET /items/{id}"]["response"]>(`/items/${encodeURIComponent(id)}`, {}, signal),
    getLocations: (id: string, signal?: AbortSignal) => client.get<ItemsEndpoints["GET /items/{id}/locationdetails"]["response"]>(`/items/${encodeURIComponent(id)}/locationdetails`, {}, signal),
    getTransactions: (id: string, signal?: AbortSignal) => client.get<ItemsEndpoints["GET /items/transactions/estimates"]["response"]>("/items/transactions/estimates", { item_id: id, page: 1 }, signal),
    getHistory: (id: string, signal?: AbortSignal) => client.get<ItemsEndpoints["GET /items/{id}/history"]["response"]>(`/items/${encodeURIComponent(id)}/history`, {}, signal),
    getEditPage: (signal?: AbortSignal) => client.get<ItemsEndpoints["GET /product/editpage"]["response"]>("/product/editpage", {}, signal),
    createItem: (body: ItemInputDto) => client.post<ItemsEndpoints["POST /items"]["response"]>("/items", body),
    updateItem: (id: string, body: ItemInputDto) => client.put<ItemsEndpoints["PUT /items/{id}"]["response"]>(`/items/${encodeURIComponent(id)}`, body),
    deleteItem: (id: string) => client.delete<ItemsEndpoints["DELETE /items/{id}"]["response"]>(`/items/${encodeURIComponent(id)}`),
    itemAction: (id: string, action: "active" | "inactive" | "lock" | "unlock" | "clone") => client.post<ItemsEndpoints["POST /items/{id}/{action}"]["response"]>(`/items/${encodeURIComponent(id)}/${action}`),
    getPreferences: (signal?: AbortSignal) => client.get<ItemsEndpoints["GET /settings/preferences/items"]["response"]>("/settings/preferences/items", {}, signal),
    savePreferences: (body: ItemsEndpoints["PUT /settings/preferences/items"]["body"]) => client.put<ItemsEndpoints["PUT /settings/preferences/items"]["response"]>("/settings/preferences/items", body),
  };
}

type Envelope = { code: 0; message: string } & Record<string, unknown>;

/** The shared record API of every secondary resource (see RESOURCES): list, get, create, update, delete, status actions. */
export function createRecordsApi(client: ApiClient, name: ResourceName) {
  const { path, list, one } = RESOURCES[name];
  const pick = <T>(r: Envelope, key: string) => r[key] as T;
  return {
    list: async (q: Partial<RecordListQuery>, signal?: AbortSignal) => {
      const r = await client.get<Envelope>(path, { ...q }, signal);
      return { records: pick<RecordDto[]>(r, list), page: pick<PageContext>(r, "page_context") };
    },
    get: async (id: string, signal?: AbortSignal) => pick<RecordDto>(await client.get<Envelope>(`${path}/${encodeURIComponent(id)}`, {}, signal), one),
    create: async (body: Record<string, unknown>) => { const r = await client.post<Envelope>(path, body); return { message: r.message, record: pick<RecordDto>(r, one) }; },
    update: async (id: string, body: Record<string, unknown>) => { const r = await client.put<Envelope>(`${path}/${encodeURIComponent(id)}`, body); return { message: r.message, record: pick<RecordDto>(r, one) }; },
    remove: async (id: string) => (await client.delete<Envelope>(`${path}/${encodeURIComponent(id)}`)).message,
    action: async (id: string, action: RecordAction) => { const r = await client.post<Envelope>(`${path}/${encodeURIComponent(id)}/${action}`); return { message: r.message, record: pick<RecordDto>(r, one) }; },
  };
}
export type RecordsApi = ReturnType<typeof createRecordsApi>;

export type ItemsApi = ReturnType<typeof createItemsApi>;
