"use client";

import { Card, CardHeader, CardTitle, DescriptionList } from "@/components/ui/data-display";
import { Heading, Text } from "@/components/ui/typography";
import { Stack, Grid } from "@/components/ui/layout";
import { formatGb } from "@/integrations/runpod/formatters";
import { useI18n } from "@/i18n/client";
import type { NetworkVolumeDetail } from "@/integrations/runpod/types";

interface NetworkVolumeDetailShellProps {
  volume: NetworkVolumeDetail;
}

export function NetworkVolumeDetailShell({
  volume,
}: NetworkVolumeDetailShellProps) {
  const { t } = useI18n();
  return (
    <Stack gap="lg">
      <div>
        <Heading level={3}>{volume.name ?? t("runpod.common.unnamed")}</Heading>
        <Text size="sm" tone="muted">
          {volume.id}
        </Text>
      </div>

      <Grid columns={2} gap="md">
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {t("runpod.networkVolumes.sizeLabel")}
            </Text>
            <Text weight="semibold">{formatGb(volume.size)}</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              {t("runpod.common.dataCenter")}
            </Text>
            <Text weight="semibold">{volume.dataCenterId ?? "—"}</Text>
          </Stack>
        </Card>
      </Grid>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>{t("runpod.common.details")}</CardTitle>
        </CardHeader>
        <DescriptionList
          items={[
            { term: t("runpod.networkVolumes.volumeId"), description: volume.id },
            { term: t("runpod.common.name"), description: volume.name ?? "—" },
            { term: t("runpod.networkVolumes.size"), description: formatGb(volume.size) },
            { term: t("runpod.common.dataCenter"), description: volume.dataCenterId ?? "—" },
          ]}
        />
      </Card>
    </Stack>
  );
}
