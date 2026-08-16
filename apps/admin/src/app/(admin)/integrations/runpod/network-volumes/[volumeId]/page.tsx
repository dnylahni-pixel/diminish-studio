import { notFound } from "next/navigation";
import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { getNetworkVolume } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { Alert } from "@/components/ui/feedback";
import { Heading, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack } from "@/components/ui/layout";
import { getServerI18n } from "@/i18n/server";
import { localePrefix } from "@/i18n/config";
import { NetworkVolumeDetailShell } from "./_components/network-volume-detail-shell";

export const revalidate = 0;

interface NetworkVolumeDetailPageProps {
  params: Promise<{ volumeId: string }>;
}

export default async function RunpodNetworkVolumeDetailPage({
  params,
}: NetworkVolumeDetailPageProps) {
  const { volumeId } = await params;
  const i18n = await getServerI18n();
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.networkVolumes.detail.title")}</Heading>
        <Alert tone="warning" title={i18n.t("runpod.common.notConnected")}>
          {i18n.t("runpod.networkVolumes.detail.notConnectedPrefix")}
          <Code>RUNPOD_API_KEY</Code>
          {i18n.t("runpod.networkVolumes.detail.notConnectedSuffix")}
        </Alert>
      </Stack>
    );
  }

  const result = await safeFetch(() => getNetworkVolume(context, volumeId));

  if (!result.ok) {
    if (result.error.category === "not_found") {
      notFound();
    }
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.networkVolumes.detail.title")}</Heading>
        <Alert
          tone="danger"
          title={i18n.t("runpod.networkVolumes.detail.loadErrorTitle", {
            category: result.error.category,
          })}
        >
          {result.error.message}{" "}
          <TextLink href={localePrefix(i18n.locale, "/integrations/runpod/network-volumes")}>
            {i18n.t("runpod.networkVolumes.detail.backToNetworkVolumes")}
          </TextLink>
        </Alert>
      </Stack>
    );
  }

  return <NetworkVolumeDetailShell volume={result.data} />;
}
