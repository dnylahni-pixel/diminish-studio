// =============================================================================
// Server -> Client serialization helpers
// -----------------------------------------------------------------------------
// `bigint` cannot cross the Server/Client Component boundary or survive
// `JSON.stringify` used by Next.js route handlers. Every API response and
// every prop passed from a server component to a client component must be
// run through `serializeForClient` first.
// =============================================================================

export type Serialized<T> = T extends bigint
  ? string
  : T extends Date
    ? string
    : T extends (infer Item)[]
      ? Serialized<Item>[]
      : T extends object
        ? { [Key in keyof T]: Serialized<T[Key]> }
        : T;

export function serializeForClient<T>(value: T): Serialized<T> {
  return serializeRecursively(value) as Serialized<T>;
}

function serializeRecursively(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeRecursively);
  }
  if (value !== null && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = serializeRecursively(entry);
    }
    return output;
  }
  return value;
}
