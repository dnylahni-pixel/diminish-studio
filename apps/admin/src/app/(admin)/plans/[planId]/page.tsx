import { notFound } from "next/navigation";
import { PlanDetail } from "@/features/plans/components/plan-detail";
import { getPlanDetail } from "@/features/plans/queries";

export const revalidate = 0;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PlanDetailPageProps {
  params: Promise<{ planId: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { planId } = await params;

  if (!UUID_PATTERN.test(planId)) {
    notFound();
  }

  const data = await getPlanDetail(planId);

  if (!data) {
    notFound();
  }

  return <PlanDetail data={data} />;
}
