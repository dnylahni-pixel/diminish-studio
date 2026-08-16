import Link from "next/link";
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/data-display";
import { EmptyState } from "@/components/ui/feedback";
import { Text } from "@/components/ui/typography";
import type { UserDetail } from "../detail-types";
import {
  formatCredits,
  formatDate,
  formatDateTime,
  formatNumber,
  titleize,
} from "../formatters";

export function UserCreditsTab({ detail }: { detail: UserDetail }) {
  const {
    user,
    creditAccount,
    creditGrants,
    creditReservations,
    creditLedger,
    intelligence,
  } = detail;

  if (!creditAccount) {
    return (
      <EmptyState
        title="No credit account"
        description="This user does not have a credit wallet."
      />
    );
  }

  const reconciliation = intelligence.creditReconciliation;
  const runway = intelligence.creditRunway;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <Card>
          <Text size="xs" tone="muted">
            Wallet balance
          </Text>
          <Text size="lg" weight="semibold" className="mt-1">
            {formatCredits(creditAccount.balance)}
          </Text>
          <Text size="xs" tone="subtle" className="mt-1">
            {formatCredits(creditAccount.reservedBalance)} reserved
          </Text>
        </Card>
        <Card>
          <Text size="xs" tone="muted">
            Available balance
          </Text>
          <Text size="lg" weight="semibold" className="mt-1">
            {formatCredits(intelligence.availableCredit ?? 0)}
          </Text>
          <Badge
            tone={creditAccount.status === "active" ? "success" : "warning"}
            size="sm"
            className="mt-2"
          >
            {titleize(creditAccount.status)}
          </Badge>
        </Card>
        <Card>
          <Text size="xs" tone="muted">
            Credit runway
          </Text>
          <Text size="lg" weight="semibold" className="mt-1">
            {runway?.runwayLabel ?? "Unknown"}
          </Text>
          <Text size="xs" tone="subtle" className="mt-1">
            {runway
              ? `${formatNumber(Math.round(runway.averageDailyBurn))} average credits/day`
              : "No recent usage data"}
          </Text>
        </Card>
        <Card>
          <Text size="xs" tone="muted">
            Ledger reconciliation
          </Text>
          <Text size="lg" weight="semibold" className="mt-1">
            {reconciliation?.reconciled ? "Balanced" : "Review required"}
          </Text>
          <Text size="xs" tone="subtle" className="mt-1">
            {reconciliation?.discrepancy === null ||
            reconciliation?.discrepancy === undefined
              ? "No balance snapshot available"
              : `${formatNumber(reconciliation.discrepancy)} discrepancy`}
          </Text>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Credit grants</CardTitle>
              <Text size="xs" tone="muted" className="mt-1">
                Recent grant buckets and their remaining balances.
              </Text>
            </div>
            <Badge tone="neutral">{creditGrants.length}</Badge>
          </CardHeader>
          {creditGrants.length === 0 ? (
            <EmptyState title="No credit grants" />
          ) : (
            <div className="space-y-3">
              {creditGrants.map((grant) => (
                <div
                  key={grant.id}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-neutral-100 p-3"
                >
                  <div>
                    <Text size="sm" weight="semibold">
                      {titleize(grant.source)}
                    </Text>
                    <Text size="xs" tone="subtle" className="mt-1">
                      Granted {formatDate(grant.grantedAt)}
                      {grant.expiresAt ? ` · Expires ${formatDate(grant.expiresAt)}` : ""}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text size="sm" weight="semibold">
                      {formatCredits(grant.amountRemaining)}
                    </Text>
                    <Text size="xs" tone="subtle">
                      of {formatCredits(grant.amountGranted)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Active reservations</CardTitle>
              <Text size="xs" tone="muted" className="mt-1">
                Credit holds that have not been fully captured or released.
              </Text>
            </div>
            <Badge tone={creditReservations.length > 0 ? "warning" : "neutral"}>
              {creditReservations.length}
            </Badge>
          </CardHeader>
          {creditReservations.length === 0 ? (
            <EmptyState title="No active reservations" />
          ) : (
            <div className="space-y-3">
              {creditReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-[var(--radius-md)] border border-neutral-100 p-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <Text size="sm" weight="semibold">
                      {formatCredits(reservation.reservedAmount)}
                    </Text>
                    <Badge tone="warning" size="sm">
                      {titleize(reservation.status)}
                    </Badge>
                  </div>
                  <Text size="xs" tone="subtle" className="mt-1">
                    Captured {formatNumber(reservation.capturedAmount)} · Released{" "}
                    {formatNumber(reservation.releasedAmount)}
                    {reservation.expiresAt
                      ? ` · Expires ${formatDate(reservation.expiresAt)}`
                      : ""}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent ledger entries</CardTitle>
            <Text size="xs" tone="muted" className="mt-1">
              Immutable balance movements from credit_ledger.
            </Text>
          </div>
          <Link
            href={`/credits?userId=${user.id}`}
            className="text-sm font-medium text-primary-700 hover:underline"
          >
            Open credit workspace
          </Link>
        </CardHeader>
        {creditLedger.length === 0 ? (
          <EmptyState title="No ledger entries" />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Balance after
                </TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {creditLedger.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge tone={entry.amount < 0 ? "warning" : "success"} size="sm">
                      {titleize(entry.entryType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(entry.amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.balanceAfter === null
                      ? "—"
                      : formatNumber(entry.balanceAfter)}
                  </TableCell>
                  <TableCell>{entry.description ?? "—"}</TableCell>
                  <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
