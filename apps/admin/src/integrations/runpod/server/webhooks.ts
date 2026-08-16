import "server-only";

/**
 * Runpod does not document an account-level, signature-verifiable event
 * webhook system (see docs/assumptions-and-limitations.md, "Account-level
 * webhooks", and docs/official-sources.md row 5). The only documented
 * "webhook" is a per-job, fire-and-forget completion callback configured by
 * the caller of a Serverless job submission — a data-plane feature this
 * admin module intentionally excludes (see docs/service-capability-matrix.md,
 * "Serverless" domain).
 *
 * This file exists to satisfy the architecture contract explicitly rather
 * than silently omitting webhook handling, and to give future maintainers a
 * single place to look before assuming a webhook route can be added. No
 * `/api/integrations/runpod/webhooks` route is registered by this module.
 */
export const RUNPOD_ACCOUNT_WEBHOOKS_SUPPORTED = false as const;

export function unsupportedWebhookReason(): string {
  return (
    "Runpod does not publish an account-level event-webhook API with signature " +
    "verification. Only per-job Serverless completion callbacks are documented, " +
    "which are a data-plane concern configured by job submitters, not an " +
    "administrable account resource. See docs/assumptions-and-limitations.md."
  );
}
