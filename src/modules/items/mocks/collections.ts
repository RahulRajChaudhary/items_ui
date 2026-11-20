import type { RecordAction, RecordDto, ResourceName } from "../api/resources";
import { RESOURCES } from "../api/resources";
import { ERROR_CODES } from "../api/contract";

export type Store = Record<ResourceName, RecordDto[]>;
export type CollectionResponse = { status: number; body: Record<string, unknown> };

const err = (status: number, code: number, message: string): CollectionResponse => ({ status, body: { code, message } });
const ok = (message: string, data: Record<string, unknown>): CollectionResponse => ({ status: 200, body: { code: 0, message, ...data } });

const NAMES = Object.keys(RESOURCES) as ResourceName[];
/** Longest paths first so "/settings/fields" is never mistaken for a shorter prefix. */
const BY_PATH = [...NAMES].sort((a, b) => RESOURCES[b].path.length - RESOURCES[a].path.length);

/** Does a record belong to a list filter? Filters are plain words ("Active", "Recurring", "Assembly", "LowStock"...). */
function inFilter(r: RecordDto, filter: string): boolean {
  const f = filter.replace(/^[A-Za-z]+\./, "");
  switch (f) {
    case "All": return true;
    case "Active": return r.status === "active";
    case "Inactive": return r.status === "inactive";
    case "Expired": return r.expired === true;
    case "LowStock": return typeof r.stock === "number" && typeof r.reorder === "number" && r.stock <= r.reorder;
    case "Ungrouped": return true;
    default: return String(r.type ?? "").replace(/\s/g, "") === f;
  }
}

/**
 * Generic CRUD for every secondary resource (see RESOURCES). Returns null when the path is not one of them.
 * One problem is reported per write, like the real backend: missing name (code 2), a name over 100 characters (code 15),
 * a duplicate name (code 150003). Fields that are created by the system (`std`) cannot be deleted.
 */
export function handleCollection(store: Store, method: string, path: string, query: URLSearchParams, body: unknown): CollectionResponse | null {
  for (const name of BY_PATH) {
    const base = RESOURCES[name].path;
    if (path !== base && !path.startsWith(`${base}/`)) continue;
    const rest = path.slice(base.length).split("/").filter(Boolean);
    const [id, action] = rest;
    const keys = RESOURCES[name];
    const rows = store[name];
    const notFound = () => err(404, ERROR_CODES.notFound, "We couldnt find any resource for the given ID. Please verify the ID and try again.");

    if (method === "GET" && !id) {
      const page = Math.max(1, Number(query.get("page") ?? 1));
      const perPage = Math.min(200, Math.max(1, Number(query.get("per_page") ?? 200)));
      const filter = query.get("filter_by") ?? "All";
      const sortKey = query.get("sort_column") ?? "name";
      const dir = query.get("sort_order") === "D" ? -1 : 1;
      const list = rows.filter((r) => inFilter(r, filter)).sort((a, b) => dir * String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? "")));
      const start = (page - 1) * perPage;
      return ok("success", { [keys.list]: list.slice(start, start + perPage).map((r) => decorate(name, r, store)), page_context: { page, per_page: perPage, has_more_page: start + perPage < list.length, applied_filter: filter, sort_column: sortKey, sort_order: dir === 1 ? "A" : "D", total: list.length } });
    }
    const rec = id ? rows.find((r) => r.id === id) : undefined;
    if (method === "GET" && id) return rec ? ok("success", { [keys.one]: decorate(name, rec, store) }) : notFound();

    if (method === "POST" && !id) {
      const input = body as Record<string, unknown> | null;
      const bad = validate(rows, input);
      if (bad) return bad;
      const nextId = String(Math.max(0, ...rows.map((r) => Number(r.id.replace(/\D/g, "")) || 0)) + 1);
      const created: RecordDto = { status: "active", ...(input as object), id: nextId, created_time: new Date().toISOString() } as RecordDto;
      rows.unshift(created);
      return ok("The record has been created.", { [keys.one]: created });
    }
    if (method === "PUT" && id) {
      if (!rec) return notFound();
      const bad = validate(rows, body as Record<string, unknown> | null, rec.id);
      if (bad) return bad;
      Object.assign(rec, body, { id: rec.id });
      return ok("The record has been updated.", { [keys.one]: rec });
    }
    if (method === "DELETE" && id) {
      if (!rec) return notFound();
      if (rec.std === true) return err(400, 1001, "This field is created by the system and cannot be deleted.");
      store[name] = rows.filter((r) => r !== rec);
      return ok("The record has been deleted.", {});
    }
    if (method === "POST" && id && action) {
      if (!rec) return notFound();
      const a = action as RecordAction;
      if (a === "active" || a === "inactive") rec.status = a;
      else if (a === "mandatory") rec.mandatory = true;
      else if (a === "optional") rec.mandatory = false;
      else if (a === "showpdf") rec.show_in_pdf = true;
      else if (a === "hidepdf") rec.show_in_pdf = false;
      else return err(404, ERROR_CODES.notFound, "Invalid URL Passed");
      return ok("The record has been updated.", { [keys.one]: rec });
    }
    return null;
  }
  return null;
}

/** Products carry counts and the plans and addons that belong to them (derived from the other lists, never stored). */
function decorate(name: ResourceName, rec: RecordDto, store: Store): RecordDto {
  if (name !== "products") return rec;
  const plan_rows = store.plans.filter((p) => p.product === rec.name);
  const addon_rows = store.addons.filter((a) => a.product === rec.name);
  return { ...rec, plan_count: plan_rows.length, addon_count: addon_rows.length, plan_rows, addon_rows };
}

function validate(rows: RecordDto[], input: Record<string, unknown> | null, selfId?: string): CollectionResponse | null {
  const name = input?.name;
  if (typeof name !== "string" || name.trim() === "") return err(400, ERROR_CODES.invalidValue, "Invalid value passed for name");
  if (name.length > 100) return err(400, ERROR_CODES.tooLong, 'Please ensure that the "name" has less than 100 characters.');
  if (rows.some((r) => r.id !== selfId && String(r.name).toLowerCase() === name.trim().toLowerCase())) return err(400, 150003, `The name '${name.trim()}' already exists. Please enter a different name.`);
  return null;
}
