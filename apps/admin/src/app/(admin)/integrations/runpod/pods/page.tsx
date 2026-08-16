import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { listPods, listTemplates, listContainerRegistryAuths } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { Alert } from "@/components/ui/feedback";
import { Heading, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack } from "@/components/ui/layout";
import { getServerI18n } from "@/i18n/server";
import { localePrefix } from "@/i18n/config";
import { PodsShell } from "./_components/pods-shell";

export const revalidate = 0;

export default async function RunpodPodsPage() {
  const i18n = await getServerI18n();
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.pods.title")}</Heading>
        <Alert tone="warning" title={i18n.t("runpod.common.notConnected")}>
          {i18n.t("runpod.pods.notConnectedPrefix")}
          <Code>RUNPOD_API_KEY</Code>
          {i18n.t("runpod.pods.notConnectedSuffix")}
        </Alert>
      </Stack>
    );
  }

  const pageSize = 20;

  const [podsResult, templatesResult, registryAuthsResult] = await Promise.all([
    safeFetch(() => listPods(context, { page: 1, pageSize: 100 })),
    safeFetch(() => listTemplates(context, { page: 1, pageSize: 100 })),
    safeFetch(() => listContainerRegistryAuths(context)),
  ]);

  if (!podsResult.ok) {
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.pods.title")}</Heading>
        <Alert
          tone="danger"
          title={i18n.t("runpod.pods.loadErrorTitle", { category: podsResult.error.category })}
        >
          {podsResult.error.message}{" "}
          <TextLink href={localePrefix(i18n.locale, "/integrations/runpod/settings")}>
            {i18n.t("runpod.common.checkConnectionSettings")}
          </TextLink>
        </Alert>
      </Stack>
    );
  }

  const { items, total } = podsResult.data;
  const templates = templatesResult.ok ? templatesResult.data.items : [];
  const registryAuths = registryAuthsResult.ok ? registryAuthsResult.data : [];

  return (
    <PodsShell
      pods={items}
      total={total}
      templates={templates}
      registryAuths={registryAuths}
      pageSize={pageSize}
    />
  );
}
