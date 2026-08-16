export interface MockUser {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

export interface MockFeature {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
}

export interface MockFeatureDependency {
  id: string;
  feature_id: string;
  dependency_feature_id: string;
  type: string;
}

export interface MockPlan {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface MockPlanVersion {
  id: string;
  plan_id: string;
  version: number;
  status: string;
}

export interface MockPlanPrice {
  id: string;
  plan_version_id: string;
  billing_scheme: string;
  currency: string;
  amount: number; // in cents
  billing_period: string;
}

export interface MockPlanLimit {
  id: string;
  plan_version_id: string;
  feature_id: string;
  limit_value: number;
  overage_allowed: boolean;
  overage_unit_price: number;
}

export interface MockSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_version_id: string;
  status: string; // active, past_due, paused, canceled, trial
  current_period_start: Date;
  current_period_end: Date;
  trial_start?: Date;
  trial_end?: Date;
  cancel_at_period_end: boolean;
  created_at: Date;
}

export interface MockInvoice {
  id: string;
  user_id: string;
  subscription_id: string;
  number: string;
  status: string; // paid, open, draft, void
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  due_date: Date;
  paid_at?: Date;
  created_at: Date;
}

export interface MockTransaction {
  id: string;
  user_id: string;
  invoice_id?: string;
  amount: number;
  currency: string;
  type: string; // charge, refund
  status: string; // success, failed, reversed
  gateway: string;
  gateway_reference: string;
  created_at: Date;
}

export interface MockCreditAccount {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  reserved_balance: number;
  lifetime_granted: number;
  lifetime_used: number;
}

export interface MockCreditLedger {
  id: string;
  credit_account_id: string;
  type: string; // grant, usage, reservation_hold, reservation_capture, reservation_release
  amount: number;
  direction: string; // debit, credit
  current_balance: number;
  reference_type?: string;
  reference_id?: string;
  created_at: Date;
}

export interface MockCreditGrant {
  id: string;
  credit_account_id: string;
  amount: number;
  remaining_amount: number;
  expiration_date: Date;
  source: string;
  status: string;
  created_at: Date;
}

export interface MockUsageDailyAggregate {
  id: string;
  user_id: string;
  subscription_id: string;
  feature_id: string;
  date: Date;
  total_quantity: number;
}

export interface MockSubscriptionSchedule {
  id: string;
  subscription_id: string;
  target_plan_id: string;
  scheduled_date: Date;
  status: string; // pending, executed
}

export interface MockPlanCreditPolicy {
  id: string;
  plan_version_id: string;
  initial_grant_amount: number;
  recurring_grant_amount: number;
  grant_interval: string;
  rollover_policy: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: "usr-01", email: "alice@example.com", name: "الیس احمدی", created_at: new Date("2025-01-01") },
  { id: "usr-02", email: "bob@example.com", name: "بابک پارسا", created_at: new Date("2025-01-15") },
  { id: "usr-03", email: "charlie@example.com", name: "شارلی صبوری", created_at: new Date("2025-02-01") },
  { id: "usr-04", email: "diana@example.com", name: "دیانا مرادی", created_at: new Date("2025-02-10") },
  { id: "usr-05", email: "evan@example.com", name: "احسان امینی", created_at: new Date("2025-02-15") },
  { id: "usr-06", email: "fiona@example.com", name: "فریبا نیکو", created_at: new Date("2025-01-10") },
  { id: "usr-07", email: "george@example.com", name: "گرشا رضایی", created_at: new Date("2025-02-20") },
  { id: "usr-08", email: "hannah@example.com", name: "هانیه کرمی", created_at: new Date("2025-02-25") },
];

export const MOCK_FEATURES: MockFeature[] = [
  { id: "feat-api", code: "api_calls", name: "درخواست‌های API", description: "تعداد فراخوانی‌های سرویس هوش مصنوعی", type: "metered" },
  { id: "feat-seats", code: "team_seats", name: "تعداد اعضای تیم", description: "تعداد کاربران مجاز در یک سازمان", type: "licensed" },
  { id: "feat-sso", code: "sso_auth", name: "اتصال SSO", description: "سیستم احراز هویت یکپارچه سازمانی", type: "boolean" },
  { id: "feat-reports", code: "adv_reports", name: "گزارش‌های پیشرفته", description: "دسترسی به گزارشات تحلیلی", type: "boolean" },
  { id: "feat-brand", code: "custom_branding", name: "برندینگ اختصاصی", description: "شخصی‌سازی کامل برند و لوگو", type: "boolean" },
];

// Intentionally introducing a cycle for testing: custom_branding -> adv_reports -> sso_auth -> custom_branding
export const MOCK_FEATURE_DEPENDENCIES: MockFeatureDependency[] = [
  { id: "dep-1", feature_id: "feat-reports", dependency_feature_id: "feat-api", type: "requires" },
  // Cycle dependencies for George (usr-07) testing
  { id: "dep-2", feature_id: "feat-brand", dependency_feature_id: "feat-reports", type: "requires" },
  { id: "dep-3", feature_id: "feat-reports", dependency_feature_id: "feat-sso", type: "requires" },
  { id: "dep-4", feature_id: "feat-sso", dependency_feature_id: "feat-brand", type: "requires" }, // This completes the cycle!
];

export const MOCK_PLANS: MockPlan[] = [
  { id: "plan-free", code: "free", name: "پلن رایگان", status: "active" },
  { id: "plan-pro", code: "pro", name: "پلن حرفه‌ای", status: "active" },
  { id: "plan-ent", code: "enterprise", name: "پلن سازمانی", status: "active" },
];

export const MOCK_PLAN_VERSIONS: MockPlanVersion[] = [
  { id: "ver-free-1", plan_id: "plan-free", version: 1, status: "published" },
  { id: "ver-pro-1", plan_id: "plan-pro", version: 1, status: "published" },
  { id: "ver-pro-2", plan_id: "plan-pro", version: 2, status: "draft" }, // Version diff test
  { id: "ver-ent-1", plan_id: "plan-ent", version: 1, status: "published" },
];

export const MOCK_PLAN_PRICES: MockPlanPrice[] = [
  { id: "price-free", plan_version_id: "ver-free-1", billing_scheme: "flat", currency: "USD", amount: 0, billing_period: "monthly" },
  { id: "price-pro-v1", plan_version_id: "ver-pro-1", billing_scheme: "flat", currency: "USD", amount: 2900, billing_period: "monthly" }, // $29.00
  { id: "price-pro-v2", plan_version_id: "ver-pro-2", billing_scheme: "flat", currency: "USD", amount: 3500, billing_period: "monthly" }, // $35.00
  { id: "price-ent", plan_version_id: "ver-ent-1", billing_scheme: "flat", currency: "USD", amount: 29900, billing_period: "monthly" }, // $299.00
];

export const MOCK_PLAN_LIMITS: MockPlanLimit[] = [
  { id: "lim-free-api", plan_version_id: "ver-free-1", feature_id: "feat-api", limit_value: 100, overage_allowed: false, overage_unit_price: 0 },
  { id: "lim-pro-api", plan_version_id: "ver-pro-1", feature_id: "feat-api", limit_value: 1000, overage_allowed: true, overage_unit_price: 15 }, // $0.15 per extra call
  { id: "lim-pro-seats", plan_version_id: "ver-pro-1", feature_id: "feat-seats", limit_value: 5, overage_allowed: false, overage_unit_price: 0 },
  { id: "lim-ent-api", plan_version_id: "ver-ent-1", feature_id: "feat-api", limit_value: 50000, overage_allowed: true, overage_unit_price: 5 }, // $0.05 per extra call
];

export const MOCK_PLAN_CREDIT_POLICIES: MockPlanCreditPolicy[] = [
  { id: "pol-free", plan_version_id: "ver-free-1", initial_grant_amount: 500, recurring_grant_amount: 0, grant_interval: "one_time", rollover_policy: "expire" },
  { id: "pol-pro", plan_version_id: "ver-pro-1", initial_grant_amount: 2000, recurring_grant_amount: 1000, grant_interval: "monthly", rollover_policy: "rollover" },
  { id: "pol-ent", plan_version_id: "ver-ent-1", initial_grant_amount: 10000, recurring_grant_amount: 5000, grant_interval: "monthly", rollover_policy: "rollover" },
];

export const MOCK_SUBSCRIPTIONS: MockSubscription[] = [
  {
    id: "sub-01",
    user_id: "usr-01",
    plan_id: "plan-pro",
    plan_version_id: "ver-pro-1",
    status: "active",
    current_period_start: new Date("2026-02-01"),
    current_period_end: new Date("2026-03-01"),
    cancel_at_period_end: false,
    created_at: new Date("2025-01-01"),
  },
  {
    id: "sub-02",
    user_id: "usr-02",
    plan_id: "plan-pro",
    plan_version_id: "ver-pro-1",
    status: "past_due",
    current_period_start: new Date("2026-01-15"),
    current_period_end: new Date("2026-02-15"), // Past due subscription!
    cancel_at_period_end: false,
    created_at: new Date("2025-01-15"),
  },
  {
    id: "sub-03",
    user_id: "usr-03",
    plan_id: "plan-free",
    plan_version_id: "ver-free-1",
    status: "active",
    current_period_start: new Date("2026-02-01"),
    current_period_end: new Date("2026-03-01"),
    cancel_at_period_end: false,
    created_at: new Date("2025-02-01"),
  },
  {
    id: "sub-04",
    user_id: "usr-04",
    plan_id: "plan-pro",
    plan_version_id: "ver-pro-1",
    status: "trial",
    current_period_start: new Date("2026-02-20"),
    current_period_end: new Date("2026-03-06"),
    trial_start: new Date("2026-02-20"),
    trial_end: new Date("2026-03-06"),
    cancel_at_period_end: false,
    created_at: new Date("2026-02-20"),
  },
  {
    id: "sub-05",
    user_id: "usr-05",
    plan_id: "plan-ent",
    plan_version_id: "ver-ent-1",
    status: "paused",
    current_period_start: new Date("2026-02-15"),
    current_period_end: new Date("2026-03-15"),
    cancel_at_period_end: false,
    created_at: new Date("2025-02-15"),
  },
  {
    id: "sub-06",
    user_id: "usr-06",
    plan_id: "plan-pro",
    plan_version_id: "ver-pro-1",
    status: "canceled",
    current_period_start: new Date("2026-01-10"),
    current_period_end: new Date("2026-02-10"),
    cancel_at_period_end: true,
    created_at: new Date("2025-01-10"),
  },
  {
    id: "sub-07",
    user_id: "usr-07",
    plan_id: "plan-pro",
    plan_version_id: "ver-pro-1",
    status: "active",
    current_period_start: new Date("2026-02-20"),
    current_period_end: new Date("2026-03-20"),
    cancel_at_period_end: false,
    created_at: new Date("2026-02-20"),
  },
  {
    id: "sub-08",
    user_id: "usr-08",
    plan_id: "plan-pro",
    plan_version_id: "ver-pro-1",
    status: "active",
    current_period_start: new Date("2026-02-25"),
    current_period_end: new Date("2026-03-25"),
    cancel_at_period_end: false,
    created_at: new Date("2026-02-25"),
  },
];

export const MOCK_INVOICES: MockInvoice[] = [
  // Alice
  { id: "inv-1001", user_id: "usr-01", subscription_id: "sub-01", number: "INV-1001", status: "paid", subtotal: 2900, tax: 0, discount: 0, total: 2900, currency: "USD", due_date: new Date("2026-02-01"), paid_at: new Date("2026-02-01"), created_at: new Date("2026-02-01") },
  // Bob - Marked Paid, but transactional check fails!
  { id: "inv-1002", user_id: "usr-02", subscription_id: "sub-02", number: "INV-1002", status: "paid", subtotal: 2900, tax: 0, discount: 0, total: 2900, currency: "USD", due_date: new Date("2026-01-15"), paid_at: new Date("2026-01-15"), created_at: new Date("2026-01-15") },
  // Bob - Has an unpaid, overdue open invoice as well
  { id: "inv-1003", user_id: "usr-02", subscription_id: "sub-02", number: "INV-1003", status: "open", subtotal: 2900, tax: 0, discount: 0, total: 2900, currency: "USD", due_date: new Date("2026-02-15"), created_at: new Date("2026-02-15") },
  // Evan
  { id: "inv-1004", user_id: "usr-05", subscription_id: "sub-05", number: "INV-1004", status: "paid", subtotal: 29900, tax: 0, discount: 0, total: 29900, currency: "USD", due_date: new Date("2026-02-15"), paid_at: new Date("2026-02-15"), created_at: new Date("2026-02-15") },
];

export const MOCK_TRANSACTIONS: MockTransaction[] = [
  // Alice success
  { id: "tx-2001", user_id: "usr-01", invoice_id: "inv-1001", amount: 2900, currency: "USD", type: "charge", status: "success", gateway: "stripe", gateway_reference: "ch_stripe_01", created_at: new Date("2026-02-01") },
  // Bob failure: Invoice marked paid, but txn failed! This is billing anomaly / revenue leakage!
  { id: "tx-2002", user_id: "usr-02", invoice_id: "inv-1002", amount: 2900, currency: "USD", type: "charge", status: "failed", gateway: "stripe", gateway_reference: "ch_stripe_02", created_at: new Date("2026-01-15") },
  // Hannah has a successful transaction but NO invoice! Revenue tracking anomaly.
  { id: "tx-2003", user_id: "usr-08", amount: 4900, currency: "USD", type: "charge", status: "success", gateway: "stripe", gateway_reference: "ch_stripe_03", created_at: new Date("2026-02-26") },
];

export const MOCK_CREDIT_ACCOUNTS: MockCreditAccount[] = [
  { id: "acc-01", user_id: "usr-01", currency: "CREDIT", balance: 1000, reserved_balance: 100, lifetime_granted: 2000, lifetime_used: 900 },
  { id: "acc-02", user_id: "usr-02", currency: "CREDIT", balance: 500, reserved_balance: 0, lifetime_granted: 1000, lifetime_used: 500 },
  { id: "acc-03", user_id: "usr-03", currency: "CREDIT", balance: 10, reserved_balance: 0, lifetime_granted: 500, lifetime_used: 490 }, // credit exhaust, runway risk
  { id: "acc-04", user_id: "usr-04", currency: "CREDIT", balance: 2000, reserved_balance: 0, lifetime_granted: 2000, lifetime_used: 0 },
  // Evan: Ledger Mismatch. Account Balance says 500, but sum of ledger items is 800!
  { id: "acc-05", user_id: "usr-05", currency: "CREDIT", balance: 500, reserved_balance: 50, lifetime_granted: 1000, lifetime_used: 450 },
  { id: "acc-06", user_id: "usr-06", currency: "CREDIT", balance: 0, reserved_balance: 0, lifetime_granted: 1000, lifetime_used: 1000 },
  { id: "acc-07", user_id: "usr-07", currency: "CREDIT", balance: 1500, reserved_balance: 0, lifetime_granted: 2000, lifetime_used: 500 },
  // Hannah: Negative balance! -200 credits
  { id: "acc-08", user_id: "usr-08", currency: "CREDIT", balance: -200, reserved_balance: 0, lifetime_granted: 1000, lifetime_used: 1200 },
];

export const MOCK_CREDIT_LEDGER: MockCreditLedger[] = [
  // usr-01 Alice (Balance: 1000, Ledger: +2000 - 900 - 100 (res) = 1000)
  { id: "led-01", credit_account_id: "acc-01", type: "grant", amount: 2000, direction: "credit", current_balance: 2000, created_at: new Date("2026-02-01") },
  { id: "led-02", credit_account_id: "acc-01", type: "usage", amount: 900, direction: "debit", current_balance: 1100, created_at: new Date("2026-02-10") },
  { id: "led-03", credit_account_id: "acc-01", type: "reservation_hold", amount: 100, direction: "debit", current_balance: 1000, created_at: new Date("2026-02-28") },

  // usr-02 Bob (Balance: 500)
  { id: "led-04", credit_account_id: "acc-02", type: "grant", amount: 1000, direction: "credit", current_balance: 1000, created_at: new Date("2026-01-15") },
  { id: "led-05", credit_account_id: "acc-02", type: "usage", amount: 500, direction: "debit", current_balance: 500, created_at: new Date("2026-02-01") },

  // usr-03 Charlie (Balance: 10)
  { id: "led-06", credit_account_id: "acc-03", type: "grant", amount: 500, direction: "credit", current_balance: 500, created_at: new Date("2026-02-01") },
  { id: "led-07", credit_account_id: "acc-03", type: "usage", amount: 490, direction: "debit", current_balance: 10, created_at: new Date("2026-02-25") },

  // usr-05 Evan (Balance: 500, but sum of ledger items is 800! Discrepancy!)
  { id: "led-08", credit_account_id: "acc-05", type: "grant", amount: 1000, direction: "credit", current_balance: 1000, created_at: new Date("2026-02-15") },
  { id: "led-09", credit_account_id: "acc-05", type: "usage", amount: 200, direction: "debit", current_balance: 800, created_at: new Date("2026-02-20") },
  // (We skip the other debits in ledger, making ledger sum = 800 while account claims 500!)

  // usr-08 Hannah (Balance: -200)
  { id: "led-10", credit_account_id: "acc-08", type: "grant", amount: 1000, direction: "credit", current_balance: 1000, created_at: new Date("2026-02-25") },
  { id: "led-11", credit_account_id: "acc-08", type: "usage", amount: 1200, direction: "debit", current_balance: -200, created_at: new Date("2026-02-28") },
];

export const MOCK_CREDIT_GRANTS: MockCreditGrant[] = [
  { id: "gr-01", credit_account_id: "acc-01", amount: 2000, remaining_amount: 1100, expiration_date: new Date("2026-03-31"), source: "plan_grant", status: "active", created_at: new Date("2026-02-01") },
  { id: "gr-02", credit_account_id: "acc-02", amount: 1000, remaining_amount: 500, expiration_date: new Date("2026-02-28"), source: "plan_grant", status: "active", created_at: new Date("2026-01-15") }, // Expiring very soon!
  { id: "gr-03", credit_account_id: "acc-03", amount: 500, remaining_amount: 10, expiration_date: new Date("2026-03-01"), source: "plan_grant", status: "active", created_at: new Date("2026-02-01") }, // Almost exhausted & expiring!
];

export const MOCK_USAGE_DAILY_AGGREGATES: MockUsageDailyAggregate[] = [
  // Charlie has huge usage aggregates
  { id: "agg-01", user_id: "usr-03", subscription_id: "sub-03", feature_id: "feat-api", date: new Date("2026-02-20"), total_quantity: 25 },
  { id: "agg-02", user_id: "usr-03", subscription_id: "sub-03", feature_id: "feat-api", date: new Date("2026-02-21"), total_quantity: 30 },
  { id: "agg-03", user_id: "usr-03", subscription_id: "sub-03", feature_id: "feat-api", date: new Date("2026-02-22"), total_quantity: 15 },
  { id: "agg-04", user_id: "usr-03", subscription_id: "sub-03", feature_id: "feat-api", date: new Date("2026-02-23"), total_quantity: 40 },
  { id: "agg-05", user_id: "usr-03", subscription_id: "sub-03", feature_id: "feat-api", date: new Date("2026-02-24"), total_quantity: 150 }, // Huge spike! Anomaly detected!
];

export const MOCK_SUBSCRIPTION_SCHEDULES: MockSubscriptionSchedule[] = [
  { id: "sch-01", subscription_id: "sub-05", target_plan_id: "plan-free", scheduled_date: new Date("2026-03-15"), status: "pending" },
];
