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
  formatDate,
  formatDateTime,
  formatMoney,
  titleize,
} from "../formatters";

function billingTone(status: string) {
  if (["paid", "succeeded", "active"].includes(status)) return "success" as const;
  if (["failed", "uncollectible", "voided"].includes(status)) return "danger" as const;
  if (["open", "pending", "partially_refunded"].includes(status))
    return "warning" as const;
  return "neutral" as const;
}

export function UserBillingTab({ detail }: { detail: UserDetail }) {
  const { invoices, transactions, paymentMethods, commerce, couponRedemptions } =
    detail;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <Text size="xs" tone="muted">
            Lifetime invoiced
          </Text>
          <div className="mt-2 space-y-1">
            {commerce.lifetimeInvoiced.length === 0 ? (
              <Text size="lg" weight="semibold">
                —
              </Text>
            ) : (
              commerce.lifetimeInvoiced.map((total) => (
                <Text key={total.currency} size="lg" weight="semibold">
                  {formatMoney(total.amount, total.currency)}
                </Text>
              ))
            )}
          </div>
        </Card>
        <Card>
          <Text size="xs" tone="muted">
            Successful payments
          </Text>
          <div className="mt-2 space-y-1">
            {commerce.successfulPayments.length === 0 ? (
              <Text size="lg" weight="semibold">
                —
              </Text>
            ) : (
              commerce.successfulPayments.map((total) => (
                <Text key={total.currency} size="lg" weight="semibold">
                  {formatMoney(total.amount, total.currency)}
                </Text>
              ))
            )}
          </div>
        </Card>
        <Card>
          <Text size="xs" tone="muted">
            Billing attention
          </Text>
          <Text size="lg" weight="semibold" className="mt-2">
            {commerce.overdueInvoiceCount} overdue
          </Text>
          <Text size="xs" tone="subtle" className="mt-1">
            {commerce.openInvoiceCount} total open invoice
            {commerce.openInvoiceCount === 1 ? "" : "s"} ·{" "}
            {commerce.paymentMethodOnFile ? "payment method ready" : "no active method"}
          </Text>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Invoices</CardTitle>
            <Text size="xs" tone="muted" className="mt-1">
              Recent formal billing documents for this account.
            </Text>
          </div>
          <Badge tone="neutral">{invoices.length}</Badge>
        </CardHeader>
        {invoices.length === 0 ? (
          <EmptyState title="No invoices" />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Invoice</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Total</TableHeaderCell>
                <TableHeaderCell className="text-right">Due</TableHeaderCell>
                <TableHeaderCell>Issued</TableHeaderCell>
                <TableHeaderCell>Due date</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <Badge tone={billingTone(invoice.status)} size="sm">
                      {titleize(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(invoice.totalAmount, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(invoice.amountDue, invoice.currency)}
                  </TableCell>
                  <TableCell>{formatDate(invoice.issuedAt ?? invoice.createdAt)}</TableCell>
                  <TableCell>{formatDate(invoice.dueAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
          </CardHeader>
          {transactions.length === 0 ? (
            <EmptyState title="No transactions" />
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-neutral-100 p-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Text size="sm" weight="semibold">
                        {titleize(transaction.type)}
                      </Text>
                      <Badge tone={billingTone(transaction.status)} size="sm">
                        {titleize(transaction.status)}
                      </Badge>
                    </div>
                    <Text size="xs" tone="subtle" className="mt-1">
                      {formatDateTime(
                        transaction.processedAt ?? transaction.createdAt,
                      )}
                    </Text>
                  </div>
                  <Text size="sm" weight="semibold">
                    {formatMoney(transaction.amount, transaction.currency)}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Payment methods & promotions</CardTitle>
              <Text size="xs" tone="muted" className="mt-1">
                Safe payment metadata and applied coupon history.
              </Text>
            </div>
          </CardHeader>
          <div className="space-y-5">
            <div className="space-y-3">
              {paymentMethods.length === 0 ? (
                <EmptyState title="No payment methods" />
              ) : (
                paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-neutral-100 p-3"
                  >
                    <div>
                      <Text size="sm" weight="semibold">
                        {method.brand
                          ? `${titleize(method.brand)} •••• ${method.last4 ?? "—"}`
                          : titleize(method.type)}
                      </Text>
                      <Text size="xs" tone="subtle" className="mt-1">
                        {method.provider}
                        {method.expMonth && method.expYear
                          ? ` · Expires ${method.expMonth}/${method.expYear}`
                          : ""}
                      </Text>
                    </div>
                    <Badge tone={billingTone(method.status)} size="sm">
                      {method.isDefault ? "Default" : titleize(method.status)}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            {couponRedemptions.length > 0 && (
              <div className="border-t border-neutral-100 pt-4">
                <Text size="xs" tone="muted" weight="semibold">
                  Recent coupon redemptions
                </Text>
                <div className="mt-3 space-y-2">
                  {couponRedemptions.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div>
                        <Text size="sm" weight="medium">
                          {coupon.couponLabel}
                        </Text>
                        <Text size="xs" tone="subtle">
                          {formatDate(coupon.redeemedAt)}
                        </Text>
                      </div>
                      <Badge tone={billingTone(coupon.status)} size="sm">
                        {titleize(coupon.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
