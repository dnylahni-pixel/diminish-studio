"use client";

import { useState, useCallback } from "react";
import { Alert } from "@/components/ui/feedback";
import {
  Badge,
  StatusIndicator,
  Card,
  DescriptionList,
  Divider,
} from "@/components/ui/data-display";
import { Button, IconButton } from "@/components/ui/actions";
import { Heading, Text, Link } from "@/components/ui/typography";
import { Stack, Inline } from "@/components/ui/layout";
import { Copy, CheckCircle2, RefreshCw } from "lucide-react";
import type { ConnectionStatus } from "@/integrations/runpod/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StatusResult =
  | { ok: true; data: ConnectionStatus }
  | {
      ok: false;
      error: { message: string; category: string };
    };

interface SettingsClientProps {
  initialStatus: StatusResult;
  requiredEnvVars: readonly string[];
  optionalEnvVars: readonly string[];
  officialDocumentation: readonly string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsClient({
  initialStatus,
  requiredEnvVars,
  optionalEnvVars,
  officialDocumentation,
}: SettingsClientProps) {
  const [statusResult, setStatusResult] = useState<StatusResult>(initialStatus);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const runConnectionCheck = useCallback(async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch("/api/integrations/runpod/connection-status");
      if (!res.ok) {
        setCheckError(`Server returned ${res.status}`);
        return;
      }
      const data: StatusResult = await res.json();
      setStatusResult(data);
    } catch (err) {
      setCheckError(
        err instanceof Error ? err.message : "Failed to check connection"
      );
    } finally {
      setChecking(false);
    }
  }, []);

  const isConfigured =
    statusResult.ok && statusResult.data.state === "connected";

  return (
    <Stack gap="lg">
      <div>
        <Heading level={3}>Settings</Heading>
        <Text tone="muted">
          Runpod integration connection settings and environment configuration.
        </Text>
      </div>

      {/* ── Connection status ─────────────────────────────────────── */}
      <Card padding="lg">
        <Inline gap="md" align="center" justify="between">
          <Heading level={4}>Connection status</Heading>
          <Inline gap="sm">
            <Button
              variant="secondary"
              size="sm"
              loading={checking}
              leadingIcon={<RefreshCw className="size-3.5" />}
              onClick={runConnectionCheck}
            >
              Test connection
            </Button>
          </Inline>
        </Inline>

        <Divider className="my-4" />

        {checkError && (
          <Alert tone="danger" title="Connection check failed">
            {checkError}
          </Alert>
        )}

        {/* Fetch-level error */}
        {!statusResult.ok && (
          <Alert
            tone="danger"
            title={`Connection check failed — ${statusResult.error.category}`}
          >
            {statusResult.error.message}
          </Alert>
        )}

        <Stack gap="sm">
          {/* Connected */}
          {statusResult.ok && statusResult.data.state === "connected" && (
            <>
              <StatusIndicator tone="success" label="Connected" pulse />
              <Text size="sm" tone="muted" className="mt-2">
                The Runpod API connection is active and functioning.
              </Text>
            </>
          )}

          {/* Not configured */}
          {statusResult.ok &&
            statusResult.data.state === "not_configured" && (
              <>
                <StatusIndicator tone="neutral" label="Not configured" />
                <Text size="sm" tone="muted" className="mt-2">
                  The Runpod API key has not been set. Follow the steps below to
                  configure the integration.
                </Text>
              </>
            )}

          {/* Invalid format */}
          {statusResult.ok &&
            statusResult.data.state === "invalid_format" && (
              <>
                <StatusIndicator tone="danger" label="Invalid configuration" />
                <Alert tone="danger" title="Configuration error">
                  {statusResult.data.reason}
                </Alert>
              </>
            )}

          {/* Unauthorized */}
          {statusResult.ok &&
            statusResult.data.state === "unauthorized" && (
              <>
                <StatusIndicator tone="danger" label="Unauthorized" />
                <Alert tone="danger" title="Authentication failed">
                  {statusResult.data.message}
                </Alert>
              </>
            )}

          {/* Upstream unavailable */}
          {statusResult.ok &&
            statusResult.data.state === "upstream_unavailable" && (
              <>
                <StatusIndicator tone="danger" label="Service unavailable" />
                <Alert tone="danger" title="Service unavailable">
                  {statusResult.data.message}
                </Alert>
              </>
            )}
        </Stack>
      </Card>

      {/* ── Environment variables ─────────────────────────────────── */}
      <Card padding="lg">
        <Heading level={4}>Environment variables</Heading>
        <Divider className="my-4" />
        <Stack gap="md">
          <div>
            <Text weight="semibold" size="sm">
              Required
            </Text>
            <DescriptionList
              items={requiredEnvVars.map((name) => ({
                term: name,
                description: (
                  <Inline gap="sm">
                    <Badge tone={isConfigured ? "success" : "neutral"}>
                      {isConfigured ? "Set" : "Not set"}
                    </Badge>
                    <EnvVarCopyButton value={name} />
                  </Inline>
                ),
              }))}
            />
          </div>
          <Divider />
          <div>
            <Text weight="semibold" size="sm">
              Optional
            </Text>
            <DescriptionList
              items={optionalEnvVars.map((name) => ({
                term: name,
                description: (
                  <Inline gap="sm">
                    <Badge tone="neutral">Has default</Badge>
                    <EnvVarCopyButton value={name} />
                  </Inline>
                ),
              }))}
            />
          </div>
        </Stack>
      </Card>

      {/* ── Documentation ─────────────────────────────────────────── */}
      <Card padding="lg">
        <Heading level={4}>Documentation</Heading>
        <Divider className="my-4" />
        <Text size="sm" tone="muted" className="mb-3">
          Refer to the following resources for more information about the
          Runpod API and how to configure this integration.
        </Text>
        <ul className="space-y-2">
          {officialDocumentation.map((url) => (
            <li key={url}>
              <Link href={url} target="_blank" rel="noopener noreferrer">
                {new URL(url).hostname}
                {new URL(url).pathname !== "/" && new URL(url).pathname}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* ── Account info when connected ───────────────────────────── */}
      {isConfigured && (
        <AccountCard
          account={
            (statusResult.data as Extract<ConnectionStatus, { state: "connected" }>)
              .account
          }
        />
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Account info sub-component
// ---------------------------------------------------------------------------

function AccountCard({
  account,
}: {
  account: Extract<ConnectionStatus, { state: "connected" }>["account"];
}) {
  return (
    <Card padding="lg">
      <Heading level={4}>Account</Heading>
      <Divider className="my-4" />
      <DescriptionList
        items={[
          { term: "User ID", description: account.userId ?? "—" },
          { term: "Email", description: account.maskedEmail ?? "—" },
          {
            term: "Balance",
            description:
              account.clientBalance != null
                ? `$${account.clientBalance.toFixed(2)}`
                : "—",
          },
          {
            term: "Spend limit",
            description:
              account.spendLimit != null
                ? `$${account.spendLimit.toFixed(2)}`
                : "—",
          },
        ]}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Env var copy button
// ---------------------------------------------------------------------------

function EnvVarCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <IconButton
      label={`Copy ${value}`}
      variant="ghost"
      size="sm"
      onClick={handleCopy}
    >
      {copied ? (
        <CheckCircle2 className="size-3.5 text-success-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </IconButton>
  );
}
