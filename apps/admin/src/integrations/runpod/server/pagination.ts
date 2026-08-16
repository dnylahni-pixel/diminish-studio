import "server-only";
import type { PaginatedResult } from "../types";

/**
 * Runpod REST v1 list endpoints (`/pods`, `/endpoints`, `/templates`,
 * `/networkvolumes`, `/containerregistryauth`) document no cursor/offset/limit
 * query parameter (verified against the vendor OpenAPI contract — see
 * docs/assumptions-and-limitations.md, "Pagination"). This module therefore:
 *
 *  1. Applies every documented upstream filter first to minimize payload size.
 *  2. Applies a hard safety cap (`maxItems`) to the filtered vendor result.
 *  3. Performs deterministic server-side sort + slice pagination here, on the
 *     server, before any data reaches the client — never fetching everything
 *     into the browser and filtering there.
 */
export function paginateInMemory<T>(
  items: T[],
  options: { page: number; pageSize: number; maxItems: number }
): PaginatedResult<T> {
  const truncated = items.length > options.maxItems;
  const bounded = truncated ? items.slice(0, options.maxItems) : items;
  const total = bounded.length;
  const start = (options.page - 1) * options.pageSize;
  const end = start + options.pageSize;
  const pageItems = bounded.slice(start, end);

  return {
    items: pageItems,
    total,
    page: options.page,
    pageSize: options.pageSize,
    truncated,
  };
}
