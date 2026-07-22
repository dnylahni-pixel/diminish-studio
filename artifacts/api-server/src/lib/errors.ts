/**
 * Typed errors for Clerk API integration.
 * Allows middleware and route handlers to map Clerk failures
 * to appropriate HTTP responses without leaking internal details.
 */

export enum ClerkErrorKind {
  /** User not found in Clerk (e.g. session references a deleted user) */
  NotFound = "NOT_FOUND",
  /** Clerk rate-limited the request */
  RateLimited = "RATE_LIMITED",
  /** Clerk API is unreachable (network / 5xx) */
  Unavailable = "UNAVAILABLE",
  /** Unexpected Clerk error */
  Unknown = "UNKNOWN",
}

/**
 * A discriminated error wrapping a Clerk API failure.
 * The `kind` property tells calling code which HTTP status to return.
 */
export class ClerkServiceError extends Error {
  public readonly kind: ClerkErrorKind;
  public readonly httpStatus: number;
  public readonly clerkHttpStatus: number | null;

  constructor(
    message: string,
    kind: ClerkErrorKind,
    clerkHttpStatus: number | null = null,
  ) {
    super(message);
    this.name = "ClerkServiceError";
    this.kind = kind;
    this.clerkHttpStatus = clerkHttpStatus;
    this.httpStatus = clerkHttpStatusCodeToClient(kind);
  }
}

/** Map internal error kind to the HTTP status we return to the front-end. */
function clerkHttpStatusCodeToClient(kind: ClerkErrorKind): number {
  switch (kind) {
    case ClerkErrorKind.NotFound:
      return 401; // session references a non-existent user → auth invalid
    case ClerkErrorKind.RateLimited:
      return 429;
    case ClerkErrorKind.Unavailable:
      return 502;
    default:
      return 502;
  }
}

/**
 * Inspect a raw error thrown by @clerk/backend and wrap it in a ClerkServiceError.
 * Call this in your catch blocks when calling clerkClient.users.getUser() etc.
 */
export function classifyClerkError(err: unknown): ClerkServiceError {
  // Clerk's own error classes (ClerkAPIResponseError) are available at runtime.
  // We use duck-typing to avoid a hard import dependency that may shift between versions.
  const e = err as Record<string, unknown> & { status?: number; message?: string };

  // ClerkAPIResponseError has a .status number and a .errors array
  const status: number | undefined =
    typeof e.status === "number" ? e.status : undefined;

  const msg = typeof e.message === "string" ? e.message : "Clerk error";

  if (status === 404) {
    return new ClerkServiceError(msg, ClerkErrorKind.NotFound, status);
  }
  if (status === 429) {
    return new ClerkServiceError(msg, ClerkErrorKind.RateLimited, status);
  }
  if (status !== undefined && status >= 500) {
    return new ClerkServiceError(msg, ClerkErrorKind.Unavailable, status);
  }
  // Network errors (fetch failures) also map to Unavailable
  if (err instanceof TypeError || (err as Error).name === "FetchError") {
    return new ClerkServiceError(msg, ClerkErrorKind.Unavailable, null);
  }
  return new ClerkServiceError(msg, ClerkErrorKind.Unknown, status ?? null);
}