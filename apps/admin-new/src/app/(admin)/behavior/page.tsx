import type { Metadata } from "next";
import { BehaviorControl } from "@/components/behavior/behavior-control";
import { getBehaviorControlData } from "@/features/behavior/queries";

export const metadata: Metadata = {
  title: "کنترل رفتار | Diminish Admin v2",
};

export default async function BehaviorPage() {
  const data = await getBehaviorControlData();
  return <BehaviorControl data={data} />;
}
