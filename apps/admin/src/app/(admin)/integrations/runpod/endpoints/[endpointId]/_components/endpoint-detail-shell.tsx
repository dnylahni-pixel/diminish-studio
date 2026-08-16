"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import {
  Card, Badge, DescriptionList, Divider,
} from "@/components/ui/data-display";
import { Alert, EmptyState, Spinner } from "@/components/ui/feedback";
import { Heading, Text, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack, Inline } from "@/components/ui/layout";
import { RUNPOD_ROUTE_PREFIX } from "@/integrations/runpod/contract";
import {
  formatTimestamp, formatCount,
} from "@/integrations/runpod/formatters";
import { LocalizedLink, useI18n } from "@/i18n/client";
import { localePrefix } from "@/i18n/config";
import type { EndpointDetail } from "@/integrations/runpod/types";
import { EndpointPlaygroundShell } from "./endpoint-playground-shell";

interface EndpointDetailShellProps {
  endpointId: string;
  configStatus: "configured" | "not_configured";
  initialData: EndpointDetail | null;
  initialError?: { message: string; category: string };
}

export function EndpointDetailShell({
  endpointId,
  configStatus,
  initialData,
  initialError,
}: EndpointDetailShellProps) {
  const { t, locale } = useI18n();

  // Not connected state
  if (configStatus !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>{t("runpod.endpoints.detail.title")}</Heading>
        <Alert tone="warning" title={t("runpod.common.notConnected")}>
          {t("runpod.endpoints.detail.notConnectedPrefix")}
          <Code>RUNPOD_API_KEY</Code>
          {t("runpod.endpoints.detail.notConnectedSuffix")}
        </Alert>
      </Stack>
    );
  }

  // Error state
  if (initialError) {
    return (
      <Stack gap="md">
        <Heading level={3}>{t("runpod.endpoints.detail.title")}</Heading>
        <Alert
          tone="danger"
          title={t("runpod.endpoints.detail.loadErrorTitle", { category: initialError.category })}
        >
          {initialError.message}{" "}
          <TextLink href={localePrefix(locale, `${RUNPOD_ROUTE_PREFIX}/endpoints`)}>
            {t("runpod.endpoints.detail.backToEndpoints")}
          </TextLink>
        </Alert>
      </Stack>
    );
  }

  // Loading state (shouldn't happen with server component fetching, but handled)
  if (!initialData) {
    return (
      <Stack gap="md" align="center">
        <Spinner size="lg" />
        <Text tone="muted">{t("runpod.endpoints.detail.loading")}</Text>
      </Stack>
    );
  }

  const endpoint = initialData;
  const name = endpoint.name ?? t("runpod.endpoints.detail.unnamed", { id: endpoint.id.slice(0, 8) });

  const [activeTab, setActiveTab] = React.useState<"details" | "playground">("details");

  // Stats for the stat cards
  const stats = [
    {
      label: t("runpod.endpoints.detail.statWorkers"),
      value: `${endpoint.workerState.running} / ${endpoint.workerState.total} running`,
    },
    {
      label: t("runpod.common.gpuCount"),
      value: formatCount(endpoint.gpuCount),
    },
    {
      label: t("runpod.endpoints.detail.statScaler"),
      value: endpoint.scalerType ? `${endpoint.scalerType} (${endpoint.scalerValue})` : "—",
    },
    {
      label: t("runpod.common.idleTimeout"),
      value: endpoint.idleTimeout != null ? `${endpoint.idleTimeout}m` : "—",
    },
    {
      label: t("runpod.common.executionTimeout"),
      value: endpoint.executionTimeoutMs != null ? `${endpoint.executionTimeoutMs}ms` : "—",
    },
    {
      label: t("runpod.endpoints.detail.statWorkersRange"),
      value: `${endpoint.workersMin ?? "—"} – ${endpoint.workersMax ?? "—"}`,
    },
  ];

  const tabStyle = (tab: "details" | "playground") =>
    cn(
      "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
      activeTab === tab
        ? "border-primary-600 text-primary-700"
        : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300",
    );

  return (
    <Stack gap="lg">
      {/* Header */}
      <div>
        <Inline gap="md" align="center" justify="between">
          <div>
            <Heading level={3}>{name}</Heading>
            <Text size="sm" tone="muted">
              {endpoint.id}
            </Text>
          </div>
          <Badge tone={endpoint.computeType === "GPU" ? "info" : "neutral"} size="md">
            {endpoint.computeType ?? t("runpod.endpoints.detail.unknown")}
          </Badge>
        </Inline>
      </div>

      {/* Sub-tabs: Details | Playground */}
      <div className="flex gap-1 border-b border-neutral-200 pb-0">
        <button onClick={() => setActiveTab("details")} className={tabStyle("details")}>
          {t("runpod.common.details")}
        </button>
        <button onClick={() => setActiveTab("playground")} className={tabStyle("playground")}>
          {t("runpod.endpoints.detail.tabPlayground")}
        </button>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <Stack gap="lg">
          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    {stat.label}
                  </Text>
                  <Text weight="semibold">{stat.value}</Text>
                </Stack>
              </Card>
            ))}
          </div>

          {/* Details card */}
          <Card padding="lg">
            <Heading level={4}>{t("runpod.common.details")}</Heading>
            <Divider className="my-4" />
            <DescriptionList
              items={[
                { term: t("runpod.endpoints.detail.endpointId"), description: endpoint.id },
                { term: t("runpod.common.name"), description: endpoint.name ?? "—" },
                { term: t("runpod.common.type"), description: endpoint.computeType ?? "—" },
                {
                  term: t("runpod.common.templateId"),
                  description: (
                    <LocalizedLink
                      href={`${RUNPOD_ROUTE_PREFIX}/templates`}
                      className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {endpoint.templateId ?? "—"}
                    </LocalizedLink>
                  ),
                },
                { term: t("runpod.endpoints.detail.templateName"), description: endpoint.templateName ?? "—" },
                { term: t("runpod.endpoints.detail.workersMin"), description: formatCount(endpoint.workersMin) },
                { term: t("runpod.endpoints.detail.workersMax"), description: formatCount(endpoint.workersMax) },
                { term: t("runpod.endpoints.detail.scalerType"), description: endpoint.scalerType ?? "—" },
                { term: t("runpod.endpoints.detail.scalerValue"), description: endpoint.scalerValue != null ? String(endpoint.scalerValue) : "—" },
                { term: t("runpod.endpoints.detail.gpuTypeIds"), description: endpoint.gpuTypeIds.length > 0 ? endpoint.gpuTypeIds.join(", ") : "—" },
                { term: t("runpod.common.gpuCount"), description: formatCount(endpoint.gpuCount) },
                { term: t("runpod.common.idleTimeout"), description: endpoint.idleTimeout != null ? `${endpoint.idleTimeout}m` : "—" },
                { term: t("runpod.common.executionTimeout"), description: endpoint.executionTimeoutMs != null ? `${endpoint.executionTimeoutMs}ms` : "—" },
                {
                  term: t("runpod.endpoints.detail.dataCenters"),
                  description: endpoint.dataCenterIds.length > 0
                    ? endpoint.dataCenterIds.join(", ")
                    : "—",
                },
                { term: t("runpod.common.networkVolumeId"), description: endpoint.networkVolumeId ?? "—" },
                { term: t("runpod.endpoints.detail.version"), description: endpoint.version != null ? String(endpoint.version) : "—" },
                { term: t("runpod.common.created"), description: formatTimestamp(endpoint.createdAt).absolute },
              ]}
            />
          </Card>

          {/* Workers card */}
          <Card padding="lg">
            <Heading level={4}>{t("runpod.endpoints.detail.workersHeading")}</Heading>
            <Divider className="my-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: t("runpod.endpoints.detail.workerRunning"), value: endpoint.workerState.running, tone: "success" as const },
                { label: t("runpod.endpoints.detail.workerIdle"), value: endpoint.workerState.idle, tone: "neutral" as const },
                { label: t("runpod.endpoints.detail.workerInitializing"), value: endpoint.workerState.initializing, tone: "info" as const },
                { label: t("runpod.endpoints.detail.workerThrottled"), value: endpoint.workerState.throttled, tone: "warning" as const },
                { label: t("runpod.endpoints.detail.workerUnhealthy"), value: endpoint.workerState.unhealthy, tone: "danger" as const },
                { label: t("runpod.endpoints.detail.workerOther"), value: endpoint.workerState.other, tone: "neutral" as const },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-neutral-50 p-4">
                  <Text size="sm" tone="muted">{item.label}</Text>
                  <Text weight="semibold" className="tabular-nums">{item.value}</Text>
                </div>
              ))}
            </div>
          </Card>

          {/* Environment variables card */}
          {Object.keys(endpoint.env).length > 0 && (
            <Card padding="lg">
              <Heading level={4}>{t("runpod.common.environmentVariables")}</Heading>
              <Divider className="my-4" />
              <DescriptionList
                items={Object.entries(endpoint.env).map(([key, value]) => ({
                  term: key,
                  description: value,
                }))}
              />
            </Card>
          )}
        </Stack>
      )}

      {/* Tab: Playground */}
      {activeTab === "playground" && (
        <EndpointPlaygroundShell
          endpointId={endpoint.id}
          endpointName={endpoint.name}
        />
      )}
    </Stack>
  );
}
