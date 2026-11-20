import type { ApiErrorBody } from "./contract";

/** Error thrown by the API client for any refused request. `message` is the server sentence and is shown to the user as is. */
export class ApiError extends Error {
  readonly code: number;
  readonly status: number;
  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.status = status;
  }
}

/** Thrown when the session has expired; the host decides where to send the user (handled in one place). */
export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "SessionExpiredError";
  }
}

/** True for failures worth retrying (network, 5xx); never for 4xx. */
export function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) return error.status >= 500;
  return !(error instanceof SessionExpiredError);
}
