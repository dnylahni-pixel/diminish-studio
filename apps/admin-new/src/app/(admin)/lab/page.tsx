import type { Metadata } from "next";
import { ReviewLab } from "@/components/lab/review-lab";
import { getSettingsListData } from "@/features/settings/queries";
import { getAuditListData } from "@/features/audit/queries";
import { getPlansWorkspaceData } from "@/features/plans/queries";

export const metadata: Metadata = {
  title: "آزمایشگاه | Diminish Admin v2",
};

export const dynamic = "force-dynamic";

/**
 * Review Lab (آزمایشگاه تاییدنشده) — landing page.
 *
 * UNVERIFIED / DRAFT AREA: new hub screens (Settings, Audit & Versions) are
 * scaffolded inside this container until the owner approves them. Later agents
 * fill the tabs in `@/components/lab/` and move approved screens to their final
 * routes. See `apps/admin-new/src/components/lab/CONVENTIONS.md`.
 */
export default async function LabPage() {
  const [settingsData, auditData, plansData] = await Promise.all([
    getSettingsListData(),
    getAuditListData(),
    getPlansWorkspaceData(),
  ]);
  return (
    <ReviewLab
      settingsData={settingsData}
      auditData={auditData}
      plansData={plansData}
    />
  );
}
