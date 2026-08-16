"use client";

import * as React from "react";
import { runEndpointJobAction } from "@/integrations/runpod/server/mutations";
import { Button, IconButton } from "@/components/ui/actions";
import { Badge, Card } from "@/components/ui/data-display";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Heading, Text, Code } from "@/components/ui/typography";
import { Stack, Inline } from "@/components/ui/layout";
import {
  Send,
  Copy,
  Check,
  Loader2,
  Terminal,
  ImageIcon,
  MessageSquare,
  Music,
  RefreshCw,
  Clock,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EndpointPlaygroundShellProps {
  endpointId: string;
  endpointName: string | null;
}

interface JobRecord {
  id: string;
  status: "COMPLETED" | "FAILED";
  executionTimeMs: number;
  output: unknown;
  error?: string;
}

// ---------------------------------------------------------------------------
// Payload templates
// ---------------------------------------------------------------------------

const SDXL_TEMPLATE = {
  prompt:
    "An oil painting of a futuristic cybernetic city in the clouds, high detail, masterpiece",
  width: 1024,
  height: 1024,
  steps: 30,
};

const LLM_TEMPLATE = {
  messages: [
    {
      role: "user",
      content: "Explain quantum computing in simple terms for a 10-year old.",
    },
  ],
  temperature: 0.7,
  max_tokens: 256,
};

/**
 * Audio analysis job format — matches the structure sent by
 * diminish-studio's POST /songs/:id/analyze route:
 *   { input: { audio_url: "..." } }
 * (The `{ input }` wrapper is added by runEndpointJobAction; this
 *  template provides the inner payload.)
 */
const AUDIO_ANALYSIS_TEMPLATE = {
  audio_url: "https://storage.example.com/uploads/song-abc123.mp3",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EndpointPlaygroundShell({
  endpointId,
  endpointName,
}: EndpointPlaygroundShellProps) {
  const { t } = useI18n();
  const [payloadText, setPayloadText] = React.useState(
    JSON.stringify(SDXL_TEMPLATE, null, 2),
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [runDuration, setRunDuration] = React.useState(0);
  const [runError, setRunError] = React.useState<string | null>(null);
  const [lastResult, setLastResult] = React.useState<JobRecord | null>(null);
  const [jobHistory, setJobHistory] = React.useState<JobRecord[]>([]);
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleRun = React.useCallback(async () => {
    // Validate JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payloadText) as Record<string, unknown>;
    } catch {
      setRunError(t("runpod.endpoints.playground.invalidJson"));
      return;
    }
    setRunError(null);
    setIsRunning(true);
    setLastResult(null);
    setRunDuration(0);

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      setRunDuration(Date.now() - startTime);
    }, 100);

    try {
      const res = await runEndpointJobAction({
        endpointId,
        inputPayload: parsed,
      });

      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!res.ok) {
        setRunError(res.error.message);
        setIsRunning(false);
        return;
      }

      const job: JobRecord = {
        id: res.data.id,
        status: res.data.status === "COMPLETED" ? "COMPLETED" : "FAILED",
        executionTimeMs: res.data.executionTime,
        output: res.data.output,
        error: res.data.error,
      };

      setLastResult(job);
      setJobHistory((prev) => [job, ...prev]);
      setIsRunning(false);
    } catch (err: unknown) {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRunError(
        err instanceof Error ? err.message : t("runpod.common.unexpectedError"),
      );
      setIsRunning(false);
    }
  }, [endpointId, payloadText, t]);

  const loadTemplate = React.useCallback(
    (template: "sdxl" | "llm" | "audio") => {
      const map = { sdxl: SDXL_TEMPLATE, llm: LLM_TEMPLATE, audio: AUDIO_ANALYSIS_TEMPLATE };
      setPayloadText(JSON.stringify(map[template], null, 2));
      setRunError(null);
      setLastResult(null);
    },
    [],
  );

  const handleCopy = React.useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return (
    <Stack gap="lg">
      {/* Header */}
      <div>
        <Heading level={4}>{t("runpod.endpoints.playground.title")}</Heading>
        <Text size="sm" tone="muted">
          {t("runpod.endpoints.playground.sendPrefix")}
          <Code>{endpointName ?? endpointId}</Code>
          {t("runpod.endpoints.playground.sendSuffix")}
        </Text>
      </div>

      {/* Main playground grid: input + output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ─── Left: Input ─────────────────────────────────────────── */}
        <Card padding="none" className="flex flex-col overflow-hidden">
          {/* Payload toolbar */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {t("runpod.endpoints.playground.jsonPayload")}
            </span>
            <Inline gap="xs">
              <Button
                variant="soft"
                size="sm"
                leadingIcon={<ImageIcon className="size-3.5" />}
                onClick={() => loadTemplate("sdxl")}
              >
                SDXL
              </Button>
              <Button
                variant="soft"
                size="sm"
                leadingIcon={<MessageSquare className="size-3.5" />}
                onClick={() => loadTemplate("llm")}
              >
                LLM
              </Button>
              <Button
                variant="soft"
                size="sm"
                leadingIcon={<Music className="size-3.5" />}
                onClick={() => loadTemplate("audio")}
              >
                {t("runpod.endpoints.playground.audioTemplate")}
              </Button>
            </Inline>
          </div>

          {/* Textarea */}
          <textarea
            value={payloadText}
            onChange={(e) => {
              setPayloadText(e.target.value);
              setRunError(null);
            }}
            className="w-full flex-1 min-h-[280px] p-4 font-mono text-xs leading-relaxed text-neutral-800 bg-neutral-0 resize-none outline-none border-0 focus:ring-0"
            spellCheck={false}
          />

          {/* Send button */}
          <div className="border-t border-neutral-200 p-3">
            <Button
              fullWidth
              loading={isRunning}
              leadingIcon={<Send className="size-4" />}
              onClick={handleRun}
            >
              {isRunning
                ? t("runpod.endpoints.playground.running", {
                    seconds: (runDuration / 1000).toFixed(1),
                  })
                : t("runpod.endpoints.playground.sendRequest")}
            </Button>
          </div>
        </Card>

        {/* ─── Right: Response ─────────────────────────────────────── */}
        <Card padding="none" className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {t("runpod.endpoints.playground.response")}
            </span>
            {lastResult && (
              <Badge
                tone={lastResult.status === "COMPLETED" ? "success" : "danger"}
                size="sm"
              >
                {lastResult.status === "COMPLETED"
                  ? t("runpod.endpoints.playground.success")
                  : t("runpod.endpoints.playground.failed")}
              </Badge>
            )}
          </div>

          <div className="flex-1 min-h-[280px] p-4 overflow-auto">
            {/* Idle state */}
            {!isRunning && !lastResult && !runError && (
              <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400 gap-2">
                <Terminal className="size-8" />
                <Text size="sm" tone="muted">
                  {t("runpod.endpoints.playground.idleHint")}
                </Text>
              </div>
            )}

            {/* Loading state */}
            {isRunning && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <Loader2 className="size-8 text-primary-500 animate-spin" />
                <div>
                  <Text weight="semibold">{t("runpod.endpoints.playground.processing")}</Text>
                  <Text size="sm" tone="muted">
                    {t("runpod.endpoints.playground.elapsed", {
                      seconds: (runDuration / 1000).toFixed(1),
                    })}
                  </Text>
                </div>
              </div>
            )}

            {/* Error state */}
            {!isRunning && runError && (
              <Alert tone="danger" title={t("runpod.endpoints.playground.requestFailed")}>
                {runError}
              </Alert>
            )}

            {/* Result */}
            {!isRunning && lastResult && lastResult.status === "COMPLETED" && (
              <Stack gap="md">
                {/* Image output detection */}
                {isImageOutput(lastResult.output) && (
                  <div className="space-y-2">
                    <div className="relative rounded-[var(--radius-md)] overflow-hidden border border-neutral-200 bg-neutral-100 aspect-video max-h-64 group">
                      <img
                        src={getImageUrl(lastResult.output)}
                        alt={t("runpod.endpoints.playground.imageAlt")}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={getImageUrl(lastResult.output)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-neutral-0 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors"
                        >
                          {t("runpod.endpoints.playground.viewFullSize")}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-[var(--radius-sm)] px-3 py-2">
                      <Clock className="size-3.5" />
                      <span className="tabular-nums">
                        {t("runpod.endpoints.playground.executionTime", {
                          ms: lastResult.executionTimeMs,
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Text / JSON output */}
                {!isImageOutput(lastResult.output) && (
                  <pre className="text-xs font-mono leading-relaxed text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-[var(--radius-md)] p-4 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                    {formatOutput(lastResult.output)}
                  </pre>
                )}
              </Stack>
            )}

            {/* Failed result */}
            {!isRunning && lastResult && lastResult.status === "FAILED" && (
              <Alert tone="danger" title={t("runpod.endpoints.playground.executionFailed")}>
                {lastResult.error ?? t("runpod.endpoints.playground.noErrorMessage")}
              </Alert>
            )}
          </div>

          {/* Copy raw output */}
          {lastResult && !isRunning && (
            <div className="border-t border-neutral-200 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                {lastResult.id.slice(0, 12)}&hellip;
              </span>
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={
                  copied ? (
                    <Check className="size-3.5 text-success-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )
                }
                onClick={() =>
                  handleCopy(
                    typeof lastResult.output === "string"
                      ? lastResult.output
                      : JSON.stringify(lastResult.output, null, 2),
                  )
                }
              >
                {copied ? t("common.copied") : t("runpod.endpoints.playground.copyOutput")}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Job history ──────────────────────────────────────────── */}
      <div>
        <Heading level={4}>{t("runpod.endpoints.playground.jobHistory")}</Heading>
        <Text size="sm" tone="muted" className="mb-3">
          {t("runpod.endpoints.playground.jobHistoryHint")}
        </Text>

        {jobHistory.length === 0 ? (
          <Text size="sm" tone="muted">
            {t("runpod.endpoints.playground.noJobs")}
          </Text>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-neutral-200">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                  <th className="px-4 py-2.5 font-semibold">{t("runpod.endpoints.playground.colJobId")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("runpod.endpoints.playground.colStatus")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("runpod.endpoints.playground.colLatency")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {jobHistory.map((job) => (
                  <tr key={job.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-neutral-600">
                      {job.id.slice(0, 16)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        size="sm"
                        tone={job.status === "COMPLETED" ? "success" : "danger"}
                      >
                        {job.status === "COMPLETED" ? (
                          <>
                            <CheckCircle2 className="size-3" />
                            {t("runpod.endpoints.playground.completed")}
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3" />
                            {t("runpod.endpoints.playground.failed")}
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-neutral-600 tabular-nums">
                      {job.executionTimeMs}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isImageOutput(output: unknown): boolean {
  if (typeof output === "string") return output.startsWith("http");
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") {
    return (output[0] as string).startsWith("http");
  }
  return false;
}

function getImageUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") {
    return output[0] as string;
  }
  return "";
}

function formatOutput(output: unknown): string {
  if (typeof output === "string") return output;
  return JSON.stringify(output, null, 2);
}
