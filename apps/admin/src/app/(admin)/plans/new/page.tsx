import { PlanBuilder } from "@/features/plans/components/plan-builder";
import { getPlanCreationData } from "@/features/plans/queries";

export const revalidate = 0;

export default async function NewPlanPage() {
  const data = await getPlanCreationData();

  return <PlanBuilder data={data} />;
}
