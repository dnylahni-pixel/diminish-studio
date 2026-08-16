"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@appica/ui-react/tabs";
import { Badge } from "@appica/ui-react/badge";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@appica/ui-react/alert";
import { FlaskConical, Gauge, History, Settings } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { translate, type LabKey } from "@/i18n/lab";
import type { SettingsListData } from "@/features/settings/types";
import type { AuditListData } from "@/features/audit/types";
import type { PlansWorkspaceData } from "@/features/plans/types";
import { SettingsDashboard } from "@/components/settings/settings-dashboard";
import { AuditDashboard } from "@/components/audit/audit-dashboard";
import { PlansDashboard } from "@/components/plans/plans-dashboard";

/**
 * Review Lab landing — a clearly-marked UNVERIFIED / DRAFT container for hub
 * screens under construction. Later agents fill the Settings and Audit &
 * Versions tabs; approved screens move out of here to their final routes.
 */
export function ReviewLab({
  settingsData,
  auditData,
  plansData,
}: {
  settingsData: SettingsListData;
  auditData: AuditListData;
  plansData: PlansWorkspaceData;
}) {
  const { locale } = useLocale();
  const t = (key: LabKey) => translate(locale, key);

  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-foreground-intense text-2xl font-bold">
              {t("page.title")}
            </h1>
            <Badge variant="warning">
              <FlaskConical data-icon="start" className="size-3.5" />
              {t("page.badge")}
            </Badge>
          </div>
          <p className="text-foreground-muted mt-1 max-w-2xl text-sm">
            {t("page.subtitle")}
          </p>
        </div>
      </div>

      <Alert variant="info" className="mt-6">
        <AlertIcon>
          <FlaskConical className="size-4" />
        </AlertIcon>
        <AlertTitle>{t("page.noteTitle")}</AlertTitle>
        <AlertDescription>{t("page.noteBody")}</AlertDescription>
      </Alert>

      <Tabs defaultValue="settings" className="mt-8">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings data-icon="start" />
            {t("tabs.settings")}
          </TabsTrigger>
          <TabsTrigger value="plans">
            <Gauge data-icon="start" />
            {t("tabs.plans")}
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History data-icon="start" />
            {t("tabs.audit")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <SettingsDashboard data={settingsData} />
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <PlansDashboard data={plansData} />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditDashboard data={auditData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
