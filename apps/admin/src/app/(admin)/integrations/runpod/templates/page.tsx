import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { listTemplates, listContainerRegistryAuths } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { Alert } from "@/components/ui/feedback";
import { Heading, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack } from "@/components/ui/layout";
import { TemplatesShell } from "./_components/templates-shell";

export const revalidate = 0;

export default async function RunpodTemplatesPage() {
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>Templates</Heading>
        <Alert tone="warning" title="Not connected">
          Set <Code>RUNPOD_API_KEY</Code> in your environment to view templates.
        </Alert>
      </Stack>
    );
  }

  const pageSize = 20;

  const [templatesResult, registryAuthsResult] = await Promise.all([
    safeFetch(() => listTemplates(context, { page: 1, pageSize: 200 })),
    safeFetch(() => listContainerRegistryAuths(context)),
  ]);

  if (!templatesResult.ok) {
    return (
      <Stack gap="md">
        <Heading level={3}>Templates</Heading>
        <Alert tone="danger" title={`Could not load templates — ${templatesResult.error.category}`}>
          {templatesResult.error.message}{" "}
          <TextLink href="/integrations/runpod/settings">Check connection settings</TextLink>
        </Alert>
      </Stack>
    );
  }

  const { items, total } = templatesResult.data;
  const registryAuths = registryAuthsResult.ok ? registryAuthsResult.data : [];

  return (
    <TemplatesShell
      templates={items}
      total={total}
      registryAuths={registryAuths}
      pageSize={pageSize}
    />
  );
}
