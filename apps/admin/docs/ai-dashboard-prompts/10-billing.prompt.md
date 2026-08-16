# Prompt 10 — Billing

Implement `/billing` as the financial operations page. Preserve all previous work and keep this stage read-only.

## Project Capsule

- Next.js 16, TypeScript, Drizzle + Neon.
- Reuse existing Card, Chart, DataTable, Tabs, DateRangePicker, Select, Badge, StatusIndicator, DropdownMenu and feedback primitives.
- Currency integrity and exact statuses matter more than visual decoration.
- Never display provider payloads, payment tokens or full billing addresses.

## Data Sources

- `invoices`: invoiceNumber, userId, subscriptionId, paymentMethodId, transactionId, status, currency, subtotalAmount, discountAmount, taxAmount, totalAmount, amountPaid, amountDue, taxCountry, taxRegion, provider, providerInvoiceId, issuedAt, dueAt, paidAt, voidedAt, createdAt
- `invoiceItems`: invoiceId, type, description, quantity, unitAmount, subtotalAmount, discountAmount, taxAmount, totalAmount, currency
- `transactions`: subscriptionId, userId, type, status, currency, amount, externalRef, description, processedAt, createdAt
- `paymentMethods`: userId, provider, type, brand, last4, expMonth, expYear, billingCountry, isDefault, status
- `taxRates`: name, country, region, taxType, rateBps, inclusive, appliesTo, status, validFrom, validTo
- `users`: username, email
- `subscriptions`: status

## KPI Definitions

All money KPIs require one selected currency:

- Net Revenue: succeeded charges minus succeeded refunds.
- Collected: sum invoice `amountPaid`.
- Outstanding: sum positive `amountDue` for open invoices.
- Failed Volume: failed transaction amount.
- Refund Rate: succeeded refund amount divided by succeeded charge amount, zero-safe.

## Layout

1. Header with date range and currency selector.
2. Four KPI cards: Net Revenue, Collected, Outstanding, Failed Volume.
3. Revenue trend `ChartContainer` using transaction dates.
4. Status distribution card for invoices and transactions.
5. Tabs:
   - Invoices
   - Transactions
   - Payment Methods
   - Tax Rates

## Invoices Table

- Invoice number
- Customer
- Subscription short ID
- Status
- Total
- Paid
- Due
- Issued/Due date
- Provider reference

An expandable or drawer detail may show invoice items and amount formula. Do not create a separate route unless already supported.

## Transactions Table

- Date
- Customer
- Type
- Status
- Signed amount
- Invoice/subscription reference
- External reference
- Description

Refunds and debit adjustments must not visually appear as positive revenue.

## Payment Methods

- Customer, provider, type/brand, masked last4, expiry, country, default, status.
- Never render providerPaymentMethodId in full; show only a short safe suffix when needed.

## Tax Rates

- Name, jurisdiction, type, rate percent from basis points, inclusive/exclusive, appliesTo, validity, status.

## URL and Query Rules

- Preserve selected tab, date, currency, status, type, query and page in URL.
- Every tab uses server pagination.
- Never join all invoice items for the invoice list; load items only for selected detail.
- Use zero-safe empty states.

## Files Allowed

- `src/app/(admin)/billing/page.tsx`
- `src/app/(admin)/billing/loading.tsx`
- `src/features/billing/queries.ts`
- `src/features/billing/types.ts`
- `src/features/billing/components/*`

## Acceptance

- Mixed currencies are never summed.
- Invoice arithmetic is displayed consistently.
- Sensitive payment/provider data is protected.
- Empty billing database renders correctly.
- Build and lint succeed.

If web-only, return complete file contents ready to paste.
