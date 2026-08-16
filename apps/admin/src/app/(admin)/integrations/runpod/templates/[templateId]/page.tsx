import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { getTemplate } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { Alert } from "@/components/ui/feedback";
import { Heading, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack } from "@/components/ui/layout";
import { TemplateDetailShell } from "./_components/template-detail-shell";

export const revalidate = 0;

interface TemplateDetailPageProps {
  params: Promise<{ templateId: string }>;
}

export default async function RunpodTemplateDetailPage({
  params,
}: TemplateDetailPageProps) {
  const { templateId } = await params;
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>Template Details</Heading>
        <Alert tone="warning" title="Not connected">
          Set <Code>RUNPOD_API_KEY</Code> in your environment to view template details.
        </Alert>
      </Stack>
    );
  }

  const result = await safeFetch(() => getTemplate(context, templateId));

  if (!result.ok) {
    return (
      <Stack gap="md">
        <Heading level={3}>Template Details</Heading>
        <Alert tone="danger" title={`Could not load template — ${result.error.category}`}>
          {result.error.message}{" "}
          <TextLink href="/integrations/runpod/templates">Back to templates</TextLink>
        </Alert>
      </Stack>
    );
  }

  const template = result.data;

  return <TemplateDetailShell template={template} />;
}
