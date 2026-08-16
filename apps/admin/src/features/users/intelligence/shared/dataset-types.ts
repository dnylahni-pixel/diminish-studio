export interface CreditLedgerSnapshot {
  id: string;
  amount: number;
  balanceAfter: number | null;
  createdAt: Date;
}

export interface DailyCreditUsage {
  date: Date;
  credits: number;
}

export interface UserHealthSignals {
  subscriptionStatus: string | null;
  openInvoiceCount: number;
  overdueInvoiceCount: number;
  failedPaymentCount: number;
  availableCredit: number | null;
  runwayDays: number | null;
  storageUtilization: number;
  daysSinceLastActivity: number | null;
}
