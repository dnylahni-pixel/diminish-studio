import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  DescriptionList,
} from "@/components/ui/data-display";
import { EmptyState } from "@/components/ui/feedback";
import { Text } from "@/components/ui/typography";
import type { UserDetail } from "../detail-types";
import {
  formatDate,
  formatMoney,
  titleize,
} from "../formatters";

export function UserOverviewTab({ detail }: { detail: UserDetail }) {
  const { user, subscription, commerce, entitlements, intelligence } = detail;

  return (
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Account identity</CardTitle>
            <Text size="xs" tone="muted" className="mt-1">
              Non-sensitive profile data from the primary users table.
            </Text>
          </div>
        </CardHeader>
        <DescriptionList
          items={[
            { term: "Username", description: user.username },
            { term: "Email", description: user.email },
            { term: "User ID", description: `#${user.id}` },
            {
              term: "External identity",
              description: user.clerkId ?? "Not linked",
            },
            {
              term: "Preferred instrument",
              description: user.preferredInstrument ?? "Not specified",
            },
            { term: "Joined", description: formatDate(user.createdAt) },
            { term: "Bio", description: user.bio ?? "No bio provided" },
          ]}
        />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Commercial snapshot</CardTitle>
            <Text size="xs" tone="muted" className="mt-1">
              Current plan, billing exposure and payment readiness.
            </Text>
          </div>
        </CardHeader>
        <DescriptionList
          items={[
            {
              term: "Plan",
              description: subscription?.plan.name ?? "No subscription",
            },
            {
              term: "Subscription status",
              description: subscription ? titleize(subscription.status) : "—",
            },
            {
              term: "Recurring price",
              description: subscription?.planPrice
                ? formatMoney(
                    subscription.planPrice.amount,
                    subscription.planPrice.currency,
                  )
                : "Not priced",
            },
            {
              term: "Open invoices",
              description: commerce.openInvoiceCount,
            },
            {
              term: "Payment method",
              description: commerce.paymentMethodOnFile
                ? "Active method on file"
                : "No active method",
            },
            {
              term: "Entitlements",
              description: `${entitlements.includedFeatures} features · ${entitlements.configuredLimits} limits · ${entitlements.activeAddons} add-ons`,
            },
          ]}
        />
      </Card>

      <Card className="2xl:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>Explainable account intelligence</CardTitle>
            <Text size="xs" tone="muted" className="mt-1">
              Every health deduction is derived from live subscription, billing,
              credit, usage and storage signals.
            </Text>
          </div>
          <Badge
            tone={intelligence.health.reasons.length === 0 ? "success" : "warning"}
          >
            {intelligence.health.reasons.length} signal
            {intelligence.health.reasons.length === 1 ? "" : "s"}
          </Badge>
        </CardHeader>
        {intelligence.health.reasons.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="size-5" />}
            title="No account risk signals"
            description="The account is commercially and operationally healthy."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {intelligence.health.reasons.map((reason) => (
              <div
                key={reason.code}
                className="rounded-[var(--radius-md)] border border-warning-100 bg-warning-50/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-700" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Text size="sm" weight="semibold">
                        {titleize(reason.code)}
                      </Text>
                      <Badge
                        tone={reason.severity === "critical" ? "danger" : "warning"}
                        size="sm"
                      >
                        -{reason.weight}
                      </Badge>
                    </div>
                    <Text size="sm" tone="muted" className="mt-1">
                      {reason.message}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
