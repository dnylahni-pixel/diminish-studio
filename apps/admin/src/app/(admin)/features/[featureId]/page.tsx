import { notFound } from "next/navigation";
import { FeatureDetail } from "@/features/features/components/feature-detail";
import { getFeatureDetail } from "@/features/features/queries";

export const revalidate = 0;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ featureId: string }>;
}) {
  const { featureId } = await params;
  if (!UUID_PATTERN.test(featureId)) notFound();

  const data = await getFeatureDetail(featureId);
  if (!data) notFound();

  return <FeatureDetail data={data} />;
}
