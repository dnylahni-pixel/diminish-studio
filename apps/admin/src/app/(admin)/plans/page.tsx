import { PlansDashboard } from "@/features/plans/components/plans-dashboard";
import { getPlansListData } from "@/features/plans/queries";
import type { PlansSearchParams } from "@/features/plans/types";

export const revalidate = 0;

interface PlansPageProps {
  searchParams: Promise<PlansSearchParams>;
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const data = await getPlansListData(await searchParams);

  return <PlansDashboard data={data} />;
}
