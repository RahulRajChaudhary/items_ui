import type { ApiErrorBody } from "./contract";
import { ApiError, SessionExpiredError } from "./errors";

export type ApiClientOptions = {
  /** Base URL up to (not including) `/v3`, for example "/api/mock" or "https://host/api". */
  baseUrl: string;
  organizationId: string;
  /** Test hook; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
};

export type ApiClient = {
  get<T>(path: string, query?: Record<string, string | number | undefined>, signal?: AbortSignal): Promise<T>;
  /** Writes send the form body the backend expects: `JSONString` (JSON text) plus `organization_id`. */
  put<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T>;
  post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T>;
  delete<T>(path: string, signal?: AbortSignal): Promise<T>;
};

/**
 * The only code that knows URLs and the wire format. Adds organization_id to every call, turns `code !== 0`
 * and HTTP errors into ApiError, and maps a sign-in redirect to SessionExpiredError. Never logs headers or cookies.
 */
export function createApiClient(opts: ApiClientOptions): ApiClient {
  const doFetch = opts.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));

  async function request<T>(method: string, path: string, query: Record<string, string | number | undefined> = {}, body?: unknown, signal?: AbortSignal): Promise<T> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params.set(k, String(v));
    params.set("organization_id", opts.organizationId);
    const init: RequestInit = { method, signal, credentials: "same-origin", redirect: "manual" };
    if (body !== undefined) {
      const form = new URLSearchParams();
      form.set("JSONString", JSON.stringify(body));
      form.set("organization_id", opts.organizationId);
      init.body = form;
      init.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    }
    const res = await doFetch(`${opts.baseUrl}/v3${path}?${params.toString()}`, init);
    if (res.type === "opaqueredirect" || res.status === 401) throw new SessionExpiredError();
    const json = (await res.json().catch(() => null)) as (ApiErrorBody & { code: number }) | null;
    if (!json) throw new ApiError(res.status, { code: -1, message: "The server sent an unreadable answer." });
    if (!res.ok || json.code !== 0) throw new ApiError(res.status, { code: json.code, message: json.message });
    return json as T;
  }

  return {
    get: (path, query, signal) => request("GET", path, query, undefined, signal),
    put: (path, body, signal) => request("PUT", path, {}, body, signal),
    post: (path, body, signal) => request("POST", path, {}, body, signal),
    delete: (path, signal) => request("DELETE", path, {}, undefined, signal),
  };
}
