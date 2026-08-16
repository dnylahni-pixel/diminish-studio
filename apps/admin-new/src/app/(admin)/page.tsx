import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { Input } from "@appica/ui-react/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@appica/ui-react/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@appica/ui-react/tabs";
import { getServerI18n } from "@/i18n/server";

export default async function HomePage() {
  const i18n = await getServerI18n();
  const t = i18n.t;

  return (
    <div className="mx-auto max-w-4xl p-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-foreground-intense text-3xl font-bold">
          {t("home.title")}
        </h1>
        <Badge variant="outline">{t("home.badge")}</Badge>
      </div>
      <p className="text-foreground-muted mt-3">
        {t("home.subtitle")}
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button variant="primary">{t("home.buttonPrimary")}</Button>
        <Button variant="outline">{t("home.buttonOutline")}</Button>
        <Button variant="ghost">{t("home.buttonGhost")}</Button>
        <Input placeholder={t("home.search")} className="w-56" />
      </div>

      <Tabs defaultValue="features" className="mt-10">
        <TabsList>
          <TabsTrigger value="features">{t("home.tabFeatures")}</TabsTrigger>
          <TabsTrigger value="plans">{t("home.tabPlans")}</TabsTrigger>
        </TabsList>
        <TabsContent value="features">
          <Table hoverableRows className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>{t("home.colName")}</TableHead>
                <TableHead>{t("home.colCode")}</TableHead>
                <TableHead>{t("home.colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{t("home.rowChord")}</TableCell>
                <TableCell>{t("home.rowChordCode")}</TableCell>
                <TableCell>
                  <Badge variant="success">{t("home.statusActive")}</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("home.rowStem")}</TableCell>
                <TableCell>{t("home.rowStemCode")}</TableCell>
                <TableCell>
                  <Badge variant="warning">{t("home.statusDraft")}</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="plans">
          <p className="text-foreground-muted mt-6">
            {t("home.plansComingSoon")}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
