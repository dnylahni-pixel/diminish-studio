import { OverviewDashboard } from "@/features/overview/components/OverviewDashboard";
import { getOverviewDashboardData } from "@/features/overview/queries";
import { getServerI18n } from "@/i18n/server";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    currency?: string;
  }>;
}

export default async function OverviewPage({ searchParams }: PageProps) {
  const i18n = await getServerI18n();
  const data = await getOverviewDashboardData(await searchParams, i18n.t);

  return <OverviewDashboard data={data} />;
}
