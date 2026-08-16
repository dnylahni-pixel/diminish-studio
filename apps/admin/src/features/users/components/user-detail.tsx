import Link from "next/link";
import { ArrowLeft, DatabaseZap } from "lucide-react";
import { buttonVariants } from "@/components/ui/actions";
import { Badge, Card } from "@/components/ui/data-display";
import { Breadcrumb } from "@/components/ui/navigation";
import { Text } from "@/components/ui/typography";
import type { UserDetail as UserDetailData } from "../detail-types";
import { UserIdentityHeader } from "./user-identity-header";
import { UserSummaryCards } from "./user-summary-cards";
import { UserTabs } from "./user-tabs";

export function UserDetail({ detail }: { detail: UserDetailData }) {
  return (
    <div className="space-y-6 p-6 max-sm:p-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <Breadcrumb
          items={[
            { label: "Users", href: "/users" },
            { label: detail.user.username },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">
            <DatabaseZap className="size-3.5" />
            Live database
          </Badge>
          <Link
            href="/users"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            Back to users
          </Link>
        </div>
      </div>

      <Card padding="lg">
        <UserIdentityHeader detail={detail} />
      </Card>

      <UserSummaryCards detail={detail} />

      <Card padding="lg">
        <div className="mb-5 flex flex-col justify-between gap-2 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <Text size="sm" weight="semibold">
              User 360 intelligence
            </Text>
            <Text size="xs" tone="muted" className="mt-1">
              One operational read model across identity, billing, subscription,
              credits and activity.
            </Text>
          </div>
          <Badge tone="primary">Explainable · real-time</Badge>
        </div>
        <UserTabs detail={detail} />
      </Card>
    </div>
  );
}
