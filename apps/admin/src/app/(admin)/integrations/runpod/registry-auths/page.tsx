import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { listContainerRegistryAuths } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { Alert } from "@/components/ui/feedback";
import { Heading, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack } from "@/components/ui/layout";
import { getServerI18n } from "@/i18n/server";
import { localePrefix } from "@/i18n/config";
import { RegistryAuthsShell } from "./_components/registry-auths-shell";

export const revalidate = 0;

export default async function RunpodRegistryAuthsPage() {
  const i18n = await getServerI18n();
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.registryAuths.title")}</Heading>
        <Alert tone="warning" title={i18n.t("runpod.common.notConnected")}>
          {i18n.t("runpod.registryAuths.notConnectedPrefix")}
          <Code>RUNPOD_API_KEY</Code>
          {i18n.t("runpod.registryAuths.notConnectedSuffix")}
        </Alert>
      </Stack>
    );
  }

  const result = await safeFetch(() => listContainerRegistryAuths(context));

  if (!result.ok) {
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.registryAuths.title")}</Heading>
        <Alert
          tone="danger"
          title={i18n.t("runpod.registryAuths.loadErrorTitle", {
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

  return <RegistryAuthsShell items={result.data} />;
}
