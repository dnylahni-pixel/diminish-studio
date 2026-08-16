import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { listAuditLog } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { Alert } from "@/components/ui/feedback";
import { Heading } from "@/components/ui/typography";
import { Stack } from "@/components/ui/layout";
import { getServerI18n } from "@/i18n/server";
import { ActivityShell } from "./_components/activity-shell";

export const revalidate = 0;

const PAGE_SIZE = 500;

export default async function RunpodActivityPage() {
  const i18n = await getServerI18n();
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  // Fetch a larger initial batch so client-side filtering works for most cases
  const initialPageSize =
    config.status === "configured"
      ? Math.min(config.maxListItems, PAGE_SIZE)
      : PAGE_SIZE;

  const result = await safeFetch(() => listAuditLog(context, 1, initialPageSize));

  if (!result.ok) {
    return (
      <Stack gap="md">
        <Heading level={3}>{i18n.t("runpod.activity.title")}</Heading>
        <Alert
          tone="danger"
          title={i18n.t("runpod.activity.loadErrorTitle", {
            category: result.error.category,
          })}
        >
          {result.error.message}
        </Alert>
      </Stack>
    );
  }

  return <ActivityShell items={result.data.items} total={result.data.total} />;
}
