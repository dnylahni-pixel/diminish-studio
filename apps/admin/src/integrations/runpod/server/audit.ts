import "server-only";
import { desc, count } from "drizzle-orm";
import { localDb as db } from "@/db/local";
import { runpodAuditLog } from "@/db/schema/integrations/runpod";
import type { AuditActionStatus, AuditLogEntry, RunpodErrorCategory, PaginatedResult } from "../types";
import type { RunpodPolicyContext } from "./policy";

export interface RecordAuditParams {
  context: RunpodPolicyContext;
  action: string;
  targetType: string;
  targetId: string | null;
  status: AuditActionStatus;
  durationMs: number;
  vendorRequestId?: string | null;
  errorCategory?: RunpodErrorCategory | null;
}

/**
 * Writes a single redacted audit row. Callers must never pass request/response
 * bodies, headers, or credential material in `metadata` — only small,
 * non-sensitive context (e.g. { podName: "..." }) is appropriate.
 */
export async function recordAudit(params: RecordAuditParams, metadata?: Record<string, unknown>): Promise<void> {
  await db.insert(runpodAuditLog).values({
    actorId: params.context.actorId,
    actorRole: params.context.role,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    status: params.status,
    durationMs: params.durationMs,
    vendorRequestId: params.vendorRequestId ?? null,
    errorCategory: params.errorCategory ?? null,
    metadata: metadata ?? null,
  });
}

export async function listAuditLog(page: number, pageSize: number): Promise<PaginatedResult<AuditLogEntry>> {
  const [{ value: total }] = await db.select({ value: count() }).from(runpodAuditLog);

  const rows = await db
    .select()
    .from(runpodAuditLog)
    .orderBy(desc(runpodAuditLog.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items: rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      actorRole: row.actorRole,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      status: row.status as AuditActionStatus,
      durationMs: row.durationMs,
      vendorRequestId: row.vendorRequestId,
      errorCategory: row.errorCategory as RunpodErrorCategory | null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt,
    })),
    total,
    page,
    pageSize,
    truncated: false,
  };
}

/**
 * Wraps a mutation with timing + audit recording, regardless of outcome.
 * Re-throws the original error after recording so callers still see the
 * normalized RunpodApiError.
 */
export async function withAudit<T>(
  params: Omit<RecordAuditParams, "status" | "durationMs" | "vendorRequestId" | "errorCategory">,
  metadata: Record<string, unknown> | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await fn();
    await recordAudit(
      { ...params, status: "succeeded", durationMs: Date.now() - startedAt },
      metadata
    );
    return result;
  } catch (error) {
    const vendorRequestId =
      typeof error === "object" && error !== null && "vendorRequestId" in error
        ? (error as { vendorRequestId?: string }).vendorRequestId
        : undefined;
    const errorCategory =
      typeof error === "object" && error !== null && "category" in error
        ? (error as { category?: RunpodErrorCategory }).category
        : undefined;
    await recordAudit(
      {
        ...params,
        status: "failed",
        durationMs: Date.now() - startedAt,
        vendorRequestId: vendorRequestId ?? null,
        errorCategory: errorCategory ?? "unexpected",
      },
      metadata
    );
    throw error;
  }
}
