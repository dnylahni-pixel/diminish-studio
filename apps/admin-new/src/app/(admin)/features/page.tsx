import type { Metadata } from "next";
import { FeaturesDashboard } from "@/components/features/features-dashboard";
import {
  getFeatureCreationData,
  getFeatureEditData,
  getFeaturesListData,
} from "@/features/features/queries";
import type { FeaturesSearchParams } from "@/features/features/types";

export const metadata: Metadata = {
  title: "قابلیت‌ها | Diminish Admin v2",
};

interface FeaturesPageProps {
  searchParams: Promise<FeaturesSearchParams>;
}

export default async function FeaturesPage({
  searchParams,
}: FeaturesPageProps) {
  const params = await searchParams;
  const [listData, creationData, editData] = await Promise.all([
    getFeaturesListData(params ?? {}, "fa"),
    getFeatureCreationData(),
    getFeatureEditData(),
  ]);

  return (
    <FeaturesDashboard
      data={listData}
      availableFeatures={creationData.features}
      editableFeatures={editData}
    />
  );
}
