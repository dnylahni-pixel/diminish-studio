import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCredits, formatDate, formatRelativeTime } from "@/lib/format";
import type {
  CreditAccount,
  CreditGrant,
  CreditLedgerEntry,
  CreditReservation,
} from "@/features/users/types";
import Link from "next/link";

interface Props {
  userId: number;
  creditAccount: CreditAccount | null;
  grants: CreditGrant[];
  reservations: CreditReservation[];
  ledger: CreditLedgerEntry[];
}

export function UserCreditsTab({
  userId,
  creditAccount,
  grants,
  reservations,
  ledger,
}: Props) {
  if (!creditAccount) {
    return <EmptyState title="No credit account" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{creditAccount.status}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCredits(creditAccount.balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCredits(creditAccount.reservedBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Lifetime Granted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCredits(creditAccount.lifetimeGranted)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Grants</CardTitle>
          </CardHeader>
          <CardContent>
            {grants.length === 0 ? (
              <EmptyState title="No active grants" />
            ) : (
              <ul className="space-y-2">
                {grants.map((g) => (
                  <li key={g.id} className="flex justify-between text-sm">
                    <span>{g.reason ?? "Grant"}</span>
                    <span className="font-medium">{formatCredits(g.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <EmptyState title="No active reservations" />
            ) : (
              <ul className="space-y-2">
                {reservations.map((r) => (
                  <li key={r.id} className="flex justify-between text-sm">
                    <span>{r.reason ?? "Reservation"}</span>
                    <span className="font-medium">{formatCredits(r.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Ledger Entries</CardTitle>
          <Link
            href={`/credits?userId=${userId}`}
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <EmptyState title="No ledger entries" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.entryType}</TableCell>
                    <TableCell>{formatCredits(entry.amount)}</TableCell>
                    <TableCell>{formatCredits(entry.balanceAfter)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.description ?? "—"}
                    </TableCell>
                    <TableCell title={formatDate(entry.createdAt)}>
                      {formatRelativeTime(entry.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
