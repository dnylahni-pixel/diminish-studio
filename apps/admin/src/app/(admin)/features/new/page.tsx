import { FeatureBuilder } from "@/features/features/components/feature-builder";
import { getFeatureCreationData } from "@/features/features/queries";

export const revalidate = 0;

export default async function NewFeaturePage() {
  const data = await getFeatureCreationData();
  return <FeatureBuilder data={data} />;
}
