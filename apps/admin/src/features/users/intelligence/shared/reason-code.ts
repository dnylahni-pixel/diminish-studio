export type ConfidenceLevel = "high" | "medium" | "low";

export interface ReasonedFinding<CodeType extends string = string> {
  readonly code: CodeType;
  readonly severity: "info" | "warning" | "critical";
  readonly message: string;
  readonly weight: number;
  readonly evidence?: Record<string, unknown>;
}

export interface ExplainableResult<
  CodeType extends string = string,
  Payload = unknown,
> {
  readonly payload: Payload;
  readonly reasons: ReasonedFinding<CodeType>[];
  readonly confidence: ConfidenceLevel;
  readonly dataSufficiency: "sufficient" | "partial" | "insufficient";
}

export function deriveConfidenceFromSignalCount(
  signalCount: number,
  minimumForHighConfidence = 3,
): ConfidenceLevel {
  if (signalCount >= minimumForHighConfidence) return "high";
  if (signalCount >= 1) return "medium";
  return "low";
}
