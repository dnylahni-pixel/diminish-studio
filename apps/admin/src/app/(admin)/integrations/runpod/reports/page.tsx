import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { getPodBillingReport } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { Alert } from "@/components/ui/feedback";
import { Heading, Text, Code, Link as TextLink } from "@/components/ui/typography";
import { Stack } from "@/components/ui/layout";
import { ReportsShell } from "./_components/reports-shell";

export const revalidate = 0;

export default async function RunpodReportsPage() {
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <Stack gap="md">
        <Heading level={3}>Billing Reports</Heading>
        <Alert tone="warning" title="Not connected">
          Set <Code>RUNPOD_API_KEY</Code> in your environment to view billing reports.
        </Alert>
      </Stack>
    );
  }

  // Fetch initial pod billing data with default filters (last 30 days, day
  // bucket) so the shell can hydrate with meaningful data before the client
  // takes over.
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const defaultFilters = {
    startTime: thirtyDaysAgo.toISOString(),
    endTime: now.toISOString(),
    bucketSize: "day",
  };

  const result = await safeFetch(() =>
    getPodBillingReport(context, defaultFilters),
  );

  if (!result.ok) {
    return (
      <Stack gap="md">
        <Heading level={3}>Billing Reports</Heading>
        <Alert tone="danger" title={`Could not load billing data — ${result.error.category}`}>
          {result.error.message}{" "}
          <TextLink href="/integrations/runpod/settings">Check connection settings</TextLink>
        </Alert>
      </Stack>
    );
  }

  return (
    <ReportsShell initialPodData={result.data} />
  );
}
