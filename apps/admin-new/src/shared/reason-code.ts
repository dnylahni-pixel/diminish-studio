// =============================================================================
// Explainable-result kernel
// -----------------------------------------------------------------------------
// Every decision-support engine in this project (health scoring, next-best-
// action, reconciliation, anomaly detection) must return *why* it reached a
// conclusion, not just the conclusion. `ReasonedFinding` is the shared shape
// used across domains so the UI can render one generic "reason" table.
// =============================================================================

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ReasonedFinding<CodeType extends string = string> {
  readonly code: CodeType;
  readonly severity: "info" | "warning" | "critical";
  readonly messageFa: string;
  readonly weight: number;
  readonly evidence?: Record<string, unknown>;
}

export interface ExplainableResult<CodeType extends string = string, Payload = unknown> {
  readonly payload: Payload;
  readonly reasons: ReasonedFinding<CodeType>[];
  readonly confidence: ConfidenceLevel;
  readonly dataSufficiency: "sufficient" | "partial" | "insufficient";
}

/** Confidence degrades automatically as the number of supporting signals shrinks. */
export function deriveConfidenceFromSignalCount(signalCount: number, minimumForHighConfidence = 3): ConfidenceLevel {
  if (signalCount >= minimumForHighConfidence) return "high";
  if (signalCount >= 1) return "medium";
  return "low";
}
