import { FeaturesDashboard } from "@/features/features/components/features-dashboard";
import { getFeaturesListData } from "@/features/features/queries";
import { getServerI18n } from "@/i18n/server";
import type { FeaturesSearchParams } from "@/features/features/types";

export const revalidate = 0;

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Promise<FeaturesSearchParams>;
}) {
  const i18n = await getServerI18n();
  const data = await getFeaturesListData(await searchParams, i18n.locale);
  return <FeaturesDashboard data={data} />;
}
