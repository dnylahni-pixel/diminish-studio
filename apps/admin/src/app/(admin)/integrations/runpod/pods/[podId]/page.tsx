import { notFound } from "next/navigation";
import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { getPod } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { getServerI18n } from "@/i18n/server";
import { localePrefix } from "@/i18n/config";
import {
  Card, Badge, DescriptionList, Divider,
} from "@/components/ui/data-display";
import { Alert } from "@/components/ui/feedback";
import { Heading, Text, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack, Inline } from "@/components/ui/layout";
import {
  formatCreditsPerHour, formatGb, formatCount, formatTimestamp, formatUptime,
  podStatusTone, podStatusLabel,
} from "@/integrations/runpod/formatters";

export const revalidate = 0;

interface PodDetailPageProps {
  params: Promise<{ podId: string }>;
}

export default async function RunpodPodDetailPage({
  params,
}: PodDetailPageProps) {
  const { podId } = await params;
  const i18n = await getServerI18n();
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.pods.detail.title")}</Heading>
        <Alert tone="warning" title={i18n.t("runpod.common.notConnected")}>
          {i18n.t("runpod.pods.detail.notConnectedPrefix")}
          <Code>RUNPOD_API_KEY</Code>
          {i18n.t("runpod.pods.detail.notConnectedSuffix")}
        </Alert>
      </Stack>
    );
  }

  const result = await safeFetch(() => getPod(context, podId));

  if (!result.ok) {
    if (result.error.category === "not_found") {
      notFound();
    }
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.pods.detail.title")}</Heading>
        <Alert
          tone="danger"
          title={i18n.t("runpod.pods.detail.loadErrorTitle", { category: result.error.category })}
        >
          {result.error.message}{" "}
          <TextLink href={localePrefix(i18n.locale, "/integrations/runpod/pods")}>
            {i18n.t("runpod.pods.detail.backToPods")}
          </TextLink>
        </Alert>
      </Stack>
    );
  }

  const pod = result.data;

  return (
    <Stack gap="lg">
      <div>
        <Inline gap="md" align="center" justify="between">
          <div>
            <Heading level={3}>
              {pod.name ?? i18n.t("runpod.pods.unnamed", { id: pod.id.slice(0, 8) })}
            </Heading>
            <Text size="sm" tone="muted">
              {pod.id}
            </Text>
          </div>
          <Badge tone={podStatusTone(pod.desiredStatus)} size="md">
            {i18n.t(podStatusLabel(pod.desiredStatus))}
          </Badge>
        </Inline>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {i18n.t("runpod.pods.detail.statComputeType")}
            </Text>
            <Text weight="semibold">{pod.computeType ?? "—"}</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {i18n.t("runpod.pods.detail.statGpu")}
            </Text>
            <Text weight="semibold">
              {pod.gpuDisplayName ??
                (pod.gpuCount ? `${pod.gpuCount}x GPU` : "—")}
            </Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {i18n.t("runpod.pods.detail.statCost")}
            </Text>
            <Text weight="semibold">
              {formatCreditsPerHour(pod.costPerHr)}
            </Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {i18n.t("runpod.pods.detail.statUptime")}
            </Text>
            <Text weight="semibold">{formatUptime(pod.uptimeSeconds)}</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {i18n.t("runpod.pods.detail.statVcpuCount")}
            </Text>
            <Text weight="semibold">{formatCount(pod.vcpuCount)}</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {i18n.t("runpod.pods.detail.statMemory")}
            </Text>
            <Text weight="semibold">{formatGb(pod.memoryInGb)}</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {i18n.t("runpod.common.containerDisk")}
            </Text>
            <Text weight="semibold">{formatGb(pod.containerDiskInGb)}</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {i18n.t("runpod.common.volume")}
            </Text>
            <Text weight="semibold">{formatGb(pod.volumeInGb)}</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {i18n.t("runpod.common.dataCenter")}
            </Text>
            <Text weight="semibold">
              {pod.machine?.dataCenterId ?? pod.dataCenterId ?? "—"}
            </Text>
          </Stack>
        </Card>
      </div>

      <Card padding="lg">
        <Heading level={4}>{i18n.t("runpod.common.details")}</Heading>
        <Divider className="my-4" />
        <DescriptionList
          items={[
            { term: i18n.t("runpod.pods.detail.podId"), description: pod.id },
            { term: i18n.t("runpod.common.name"), description: pod.name ?? "—" },
            { term: i18n.t("runpod.common.image"), description: pod.imageName ?? "—" },
            { term: i18n.t("runpod.pods.detail.desiredStatus"), description: i18n.t(podStatusLabel(pod.desiredStatus)) },
            { term: i18n.t("runpod.pods.detail.statComputeType"), description: pod.computeType ?? "—" },
            { term: i18n.t("runpod.pods.detail.statGpu"), description: pod.gpuDisplayName ?? "—" },
            { term: i18n.t("runpod.common.gpuCount"), description: formatCount(pod.gpuCount) },
            {
              term: i18n.t("runpod.pods.detail.costPerHour"),
              description: formatCreditsPerHour(pod.costPerHr),
            },
            {
              term: i18n.t("runpod.pods.detail.adjustedCostPerHour"),
              description: formatCreditsPerHour(pod.adjustedCostPerHr),
            },
            { term: i18n.t("runpod.pods.detail.vcpu"), description: formatCount(pod.vcpuCount) },
            { term: i18n.t("runpod.pods.detail.statMemory"), description: formatGb(pod.memoryInGb) },
            { term: i18n.t("runpod.common.containerDisk"), description: formatGb(pod.containerDiskInGb) },
            { term: i18n.t("runpod.common.volume"), description: formatGb(pod.volumeInGb) },
            { term: i18n.t("runpod.common.volumeMountPath"), description: pod.volumeMountPath ?? "—" },
            { term: i18n.t("runpod.common.dataCenter"), description: pod.dataCenterId ?? "—" },
            { term: i18n.t("runpod.common.ports"), description: pod.ports ?? "—" },
            { term: i18n.t("runpod.common.templateId"), description: pod.templateId ?? "—" },
            {
              term: i18n.t("runpod.common.registryAuthId"),
              description: pod.containerRegistryAuthId ?? "—",
            },
            { term: i18n.t("runpod.common.created"), description: formatTimestamp(pod.createdAt).absolute },
            {
              term: i18n.t("runpod.pods.detail.lastStatusChange"),
              description: formatTimestamp(pod.lastStatusChange).absolute,
            },
            { term: i18n.t("runpod.pods.detail.statUptime"), description: formatUptime(pod.uptimeSeconds) },
            {
              term: i18n.t("runpod.pods.detail.secureCloud"),
              description: pod.machine?.secureCloud ? i18n.t("common.yes") : i18n.t("common.no"),
            },
          ]}
        />
      </Card>

      {Object.keys(pod.env).length > 0 && (
        <Card padding="lg">
          <Heading level={4}>{i18n.t("runpod.common.environmentVariables")}</Heading>
          <Divider className="my-4" />
          <DescriptionList
            items={Object.entries(pod.env).map(([key, value]) => ({
              term: key,
              description: value,
            }))}
          />
        </Card>
      )}
    </Stack>
  );
}
