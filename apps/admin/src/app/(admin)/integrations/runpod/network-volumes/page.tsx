import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { listNetworkVolumes } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { Alert } from "@/components/ui/feedback";
import { Heading, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack } from "@/components/ui/layout";
import { getServerI18n } from "@/i18n/server";
import { localePrefix } from "@/i18n/config";
import { NetworkVolumesShell } from "./_components/network-volumes-shell";

export const revalidate = 0;

export default async function RunpodNetworkVolumesPage() {
  const i18n = await getServerI18n();
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.networkVolumes.title")}</Heading>
        <Alert tone="warning" title={i18n.t("runpod.common.notConnected")}>
          {i18n.t("runpod.networkVolumes.notConnectedPrefix")}
          <Code>RUNPOD_API_KEY</Code>
          {i18n.t("runpod.networkVolumes.notConnectedSuffix")}
        </Alert>
      </Stack>
    );
  }

  const result = await safeFetch(() =>
    listNetworkVolumes(context, { page: 1, pageSize: 500 })
  );

  if (!result.ok) {
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.networkVolumes.title")}</Heading>
        <Alert
          tone="danger"
          title={i18n.t("runpod.networkVolumes.loadErrorTitle", {
            category: result.error.category,
          })}
        >
          {result.error.message}{" "}
          <TextLink href={localePrefix(i18n.locale, "/integrations/runpod/settings")}>
            {i18n.t("runpod.common.checkConnectionSettings")}
          </TextLink>
        </Alert>
      </Stack>
    );
  }

  return (
    <NetworkVolumesShell
      items={result.data.items}
      total={result.data.total}
      truncated={result.data.truncated}
    />
  );
}
