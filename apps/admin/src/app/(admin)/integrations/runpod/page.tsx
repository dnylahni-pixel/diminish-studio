import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getConnectionStatus } from "@/integrations/runpod/server/queries";
import { Card, Badge, StatusIndicator, DescriptionList, Divider } from "@/components/ui/data-display";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Heading, Text, NumericText, Code } from "@/components/ui/typography";
import { Stack, Inline, Grid } from "@/components/ui/layout";
import { Link } from "@/components/ui/typography";
import {
  formatCredits,
  formatCreditsPerHour,
  formatCount,
  formatMaskedEmail,
} from "@/integrations/runpod/formatters";
import { getServerI18n } from "@/i18n/server";
import { localePrefix } from "@/i18n/config";

export const revalidate = 0;

export default async function RunpodOverviewPage() {
  const i18n = await getServerI18n();
  await resolveRunpodPolicyContext();
  const status = await getConnectionStatus();

  return (
    <Stack gap="lg">
      <div>
        <Heading level={2}>{i18n.t("runpod.overview.title")}</Heading>
        <Text tone="muted">{i18n.t("runpod.overview.description")}</Text>
      </div>

      {status.state === "not_configured" && (
        <>
          <Alert tone="warning" title={i18n.t("runpod.overview.notConfigured.title")}>
            {i18n.t("runpod.overview.notConfigured.alertPrefix")}
            <Code>RUNPOD_API_KEY</Code>
            {i18n.t("runpod.overview.notConfigured.alertSuffix")}
          </Alert>
          <Card>
            <Text weight="semibold">
              {i18n.t("runpod.overview.notConfigured.requiredEnvVarsTitle")}
            </Text>
            <ul className="mt-2 space-y-1">
              {status.requiredEnvVars.map((env) => (
                <li key={env}>
                  <Code>{env}</Code>
                </li>
              ))}
            </ul>
          </Card>
          <Card padding="lg">
            <Text tone="muted">
              {i18n.t("runpod.overview.notConfigured.postConfigPrefix")}
              <Link href={localePrefix(i18n.locale, "/integrations/runpod/settings")}>
                {i18n.t("runpod.nav.settings")}
              </Link>
              {i18n.t("runpod.overview.notConfigured.postConfigSuffix")}
            </Text>
          </Card>
        </>
      )}

      {status.state === "invalid_format" && (
        <Alert tone="danger" title={i18n.t("runpod.overview.invalidConfigTitle")}>
          {status.reason}
        </Alert>
      )}

      {status.state === "unauthorized" && (
        <Alert tone="danger" title={i18n.t("runpod.overview.authFailedTitle")}>
          {i18n.t("runpod.overview.unauthorizedPrefix", { message: status.message })}
          <Code>RUNPOD_API_KEY</Code>
          {i18n.t("runpod.overview.unauthorizedSuffix")}
        </Alert>
      )}

      {status.state === "upstream_unavailable" && (
        <Alert tone="danger" title={i18n.t("runpod.overview.serviceUnavailableTitle")}>
          {i18n.t("runpod.overview.upstreamUnavailableBody", { message: status.message })}
        </Alert>
      )}

      {status.state === "connected" && (
        <>
          <Inline gap="sm">
            <StatusIndicator tone="success" label={i18n.t("runpod.common.connected")} pulse />
            <Badge tone="success">{i18n.t("runpod.overview.apiActive")}</Badge>
          </Inline>

          <Grid columns={4} gap="md">
            <Card>
              <Stack gap="xs">
                <Text size="sm" tone="muted">
                  {i18n.t("runpod.overview.accountLabel")}
                </Text>
                <Text weight="semibold">
                  {formatMaskedEmail(status.account.maskedEmail)}
                </Text>
              </Stack>
            </Card>
            <Card>
              <Stack gap="xs">
                <Text size="sm" tone="muted">
                  {i18n.t("runpod.overview.balanceLabel")}
                </Text>
                <NumericText size="lg">
                  {formatCredits(status.account.clientBalance)}
                </NumericText>
              </Stack>
            </Card>
            <Card>
              <Stack gap="xs">
                <Text size="sm" tone="muted">
                  {i18n.t("runpod.overview.spendLimitLabel")}
                </Text>
                <NumericText size="lg">
                  {formatCredits(status.account.spendLimit)}
                </NumericText>
              </Stack>
            </Card>
            <Card>
              <Stack gap="xs">
                <Text size="sm" tone="muted">
                  {i18n.t("runpod.overview.machineQuotaLabel")}
                </Text>
                <NumericText size="lg">
                  {formatCount(status.account.machineQuota)}
                </NumericText>
              </Stack>
            </Card>
          </Grid>

          <Card padding="lg">
            <Heading level={4}>{i18n.t("runpod.overview.accountDetailsTitle")}</Heading>
            <Divider className="my-4" />
            <DescriptionList
              items={[
                { term: i18n.t("runpod.overview.userId"), description: status.account.userId },
                {
                  term: i18n.t("runpod.overview.email"),
                  description: formatMaskedEmail(status.account.maskedEmail),
                },
                {
                  term: i18n.t("runpod.overview.balanceLabel"),
                  description: formatCredits(status.account.clientBalance),
                },
                {
                  term: i18n.t("runpod.overview.spendLimitLabel"),
                  description: formatCredits(status.account.spendLimit),
                },
                {
                  term: i18n.t("runpod.overview.currentSpendPerHour"),
                  description: formatCreditsPerHour(
                    status.account.currentSpendPerHr,
                  ),
                },
                {
                  term: i18n.t("runpod.overview.machineQuotaLabel"),
                  description: formatCount(status.account.machineQuota),
                },
                {
                  term: i18n.t("runpod.overview.maxServerlessConcurrency"),
                  description: formatCount(
                    status.account.maxServerlessConcurrency,
                  ),
                },
                {
                  term: i18n.t("runpod.overview.creditAlertThreshold"),
                  description: formatCredits(
                    status.account.creditAlertThreshold,
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </Stack>
  );
}
