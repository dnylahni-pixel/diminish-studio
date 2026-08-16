import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes, formatCredits } from "@/lib/format";
import type {
  CreditAccount,
  SubscriptionWithPlan,
  User,
} from "@/features/users/types";

interface Props {
  user: User;
  subscription: SubscriptionWithPlan | null;
  creditAccount: CreditAccount | null;
}

export function UserSummaryCards({ user, subscription, creditAccount }: Props) {
  const storagePct =
    user.storageQuotaBytes > 0
      ? Math.min(100, Math.round((user.storageUsedBytes / user.storageQuotaBytes) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {subscription?.plan?.name ?? "No active plan"}
          </p>
          {subscription?.planVersion && (
            <p className="text-xs text-muted-foreground">
              v{subscription.planVersion.versionNumber} · {subscription.planVersion.title}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Available Credit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {formatCredits(creditAccount?.balance ?? 0)}
          </p>
          {creditAccount && creditAccount.reservedBalance > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCredits(creditAccount.reservedBalance)} reserved
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Lifetime Credit Used</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {formatCredits(creditAccount?.lifetimeUsed ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            of {formatCredits(creditAccount?.lifetimeGranted ?? 0)} granted
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {formatBytes(user.storageUsedBytes)} / {formatBytes(user.storageQuotaBytes)}
          </p>
          <p className="text-xs text-muted-foreground">{storagePct}% used</p>
        </CardContent>
      </Card>
    </div>
  );
}
