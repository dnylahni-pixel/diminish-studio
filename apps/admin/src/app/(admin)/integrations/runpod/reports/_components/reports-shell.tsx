"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/selection";
import { DateRangePicker } from "@/components/ui/date-time";
import { Select } from "@/components/ui/select-combobox";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Card,
  CardTitle,
} from "@/components/ui/data-display";
import { Alert, EmptyState, Spinner } from "@/components/ui/feedback";
import { Text, Heading, NumericText } from "@/components/ui/typography";
import { Stack, Inline, Grid } from "@/components/ui/layout";
import { IconButton } from "@/components/ui/actions";
import {
  formatCredits,
  formatTimestamp,
} from "@/integrations/runpod/formatters";
import { RUNPOD_GPU_TYPE_OPTIONS } from "@/integrations/runpod/reference-data";
import { useI18n } from "@/i18n/client";
import type { BillingRecordView, NetworkVolumeBillingRecordView } from "@/integrations/runpod/types";
import type { DateRange } from "react-day-picker";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReportsShellProps {
  initialPodData: BillingRecordView[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUCKET_SIZE_OPTIONS = [
  { value: "hour", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const GPU_FILTER_OPTIONS = [
  { value: "", label: "All GPU types" },
  ...RUNPOD_GPU_TYPE_OPTIONS,
];

type BillingTab = "pods" | "endpoints" | "network-volumes";

const TABS: { value: BillingTab; label: string }[] = [
  { value: "pods", label: "Pods" },
  { value: "endpoints", label: "Endpoints" },
  { value: "network-volumes", label: "Network Volumes" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "—";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function formatSeconds(ms: number | null | undefined): string {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(0)}s`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportsShell({ initialPodData }: ReportsShellProps) {
  const { t } = useI18n();

  // --- Tab state ---
  const [activeTab, setActiveTab] = useState<BillingTab>("pods");

  // --- Filter state ---
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: thirtyDaysAgo,
    to: today,
  });
  const [bucketSize, setBucketSize] = useState("day");
  const [gpuType, setGpuType] = useState("");

  // --- Data state ---
  const [podData, setPodData] = useState<BillingRecordView[]>(initialPodData);
  const [endpointData, setEndpointData] = useState<BillingRecordView[]>([]);
  const [networkVolumeData, setNetworkVolumeData] = useState<
    NetworkVolumeBillingRecordView[]
  >([]);

  // --- UI state ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedOnce = useRef(false);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("type", activeTab);
    if (dateRange?.from) params.set("startTime", dateRange.from.toISOString());
    if (dateRange?.to) params.set("endTime", dateRange.to.toISOString());
    if (bucketSize) params.set("bucketSize", bucketSize);
    if (gpuType && activeTab === "pods") params.set("gpuTypeId", gpuType);
    return params;
  }, [activeTab, dateRange, bucketSize, gpuType]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = buildQuery();

    try {
      const res = await fetch(
        `/api/integrations/runpod/billing-reports?${params}`,
        { cache: "no-store" },
      );
      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? "Failed to load billing data.");
        return;
      }

      switch (activeTab) {
        case "pods":
          setPodData(json.data);
          break;
        case "endpoints":
          setEndpointData(json.data);
          break;
        case "network-volumes":
          setNetworkVolumeData(json.data);
          break;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while fetching billing data.",
      );
    } finally {
      setLoading(false);
    }
  }, [buildQuery, activeTab]);

  // Skip auto-fetch on initial mount for pods tab (SSR data already matches
  // the default filters). Fetch on all subsequent filter or tab changes.
  useEffect(() => {
    if (!hasFetchedOnce.current && activeTab === "pods") {
      hasFetchedOnce.current = true;
      return;
    }
    hasFetchedOnce.current = true;
    fetchData();
  }, [fetchData, activeTab]);

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const currentData = (() => {
    switch (activeTab) {
      case "pods":
        return podData;
      case "endpoints":
        return endpointData;
      case "network-volumes":
        return networkVolumeData;
    }
  })();

  const totalRecords = currentData.length;
  const totalAmount = currentData.reduce(
    (sum, r) => sum + (r.amount ?? 0),
    0,
  );

  const totalTimeBilledMs =
    activeTab !== "network-volumes"
      ? (currentData as BillingRecordView[]).reduce(
          (sum, r) => sum + (r.timeBilledMs ?? 0),
          0,
        )
      : 0;

  const totalDiskBilledGb =
    activeTab === "network-volumes"
      ? (currentData as NetworkVolumeBillingRecordView[]).reduce(
          (sum, r) => sum + (r.diskSpaceBilledGb ?? 0),
          0,
        )
      : null;

  // -----------------------------------------------------------------------
  // Renders
  // -----------------------------------------------------------------------

  const renderSummaryCards = () => (
    <Grid columns={3} gap="md">
      <Card padding="md">
        <Stack gap="xs">
          <Text size="sm" tone="muted">
            Total records
          </Text>
          <NumericText size="lg">{totalRecords.toLocaleString()}</NumericText>
        </Stack>
      </Card>
      <Card padding="md">
        <Stack gap="xs">
          <Text size="sm" tone="muted">
            Total amount
          </Text>
          <NumericText size="lg">{formatCredits(totalAmount)}</NumericText>
        </Stack>
      </Card>
      <Card padding="md">
        <Stack gap="xs">
          <Text size="sm" tone="muted">
            {activeTab === "network-volumes"
              ? "Total disk billed"
              : "Total time billed"}
          </Text>
          <NumericText size="lg">
            {activeTab === "network-volumes"
              ? totalDiskBilledGb != null
                ? `${totalDiskBilledGb.toLocaleString()} GB`
                : "—"
              : formatDuration(totalTimeBilledMs)}
          </NumericText>
        </Stack>
      </Card>
    </Grid>
  );

  const renderPodTable = () => {
    const records = currentData as BillingRecordView[];
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
            <TableHeaderCell>Time billed</TableHeaderCell>
            <TableHeaderCell>Pod ID</TableHeaderCell>
            <TableHeaderCell>GPU type</TableHeaderCell>
            <TableHeaderCell>Disk billed</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={`pod-${record.time}-${index}`}>
              <TableCell>
                <span title={formatTimestamp(record.time, t).absolute}>
                  {formatTimestamp(record.time, t).relative}
                </span>
              </TableCell>
              <TableCell className="tabular-nums">
                {formatCredits(record.amount)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatSeconds(record.timeBilledMs)}
              </TableCell>
              <TableCell>
                {record.podId ? (
                  <code className="text-xs">{record.podId.slice(0, 12)}</code>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{record.gpuTypeId ?? "—"}</TableCell>
              <TableCell>
                {record.diskSpaceBilledGb != null
                  ? `${record.diskSpaceBilledGb} GB`
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderEndpointTable = () => {
    const records = currentData as BillingRecordView[];
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
            <TableHeaderCell>Time billed</TableHeaderCell>
            <TableHeaderCell>Endpoint ID</TableHeaderCell>
            <TableHeaderCell>GPU type</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={`ep-${record.time}-${index}`}>
              <TableCell>
                <span title={formatTimestamp(record.time, t).absolute}>
                  {formatTimestamp(record.time, t).relative}
                </span>
              </TableCell>
              <TableCell className="tabular-nums">
                {formatCredits(record.amount)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatSeconds(record.timeBilledMs)}
              </TableCell>
              <TableCell>
                {record.endpointId ? (
                  <code className="text-xs">
                    {record.endpointId.slice(0, 12)}
                  </code>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{record.gpuTypeId ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderNetworkVolumeTable = () => {
    const records = currentData as NetworkVolumeBillingRecordView[];
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
            <TableHeaderCell>Disk space billed</TableHeaderCell>
            <TableHeaderCell>High perf. storage amount</TableHeaderCell>
            <TableHeaderCell>High perf. storage disk</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={`nv-${record.time}-${index}`}>
              <TableCell>
                <span title={formatTimestamp(record.time, t).absolute}>
                  {formatTimestamp(record.time, t).relative}
                </span>
              </TableCell>
              <TableCell className="tabular-nums">
                {formatCredits(record.amount)}
              </TableCell>
              <TableCell>
                {record.diskSpaceBilledGb != null
                  ? `${record.diskSpaceBilledGb} GB`
                  : "—"}
              </TableCell>
              <TableCell className="tabular-nums">
                {record.highPerformanceStorageAmount != null
                  ? formatCredits(record.highPerformanceStorageAmount)
                  : "—"}
              </TableCell>
              <TableCell>
                {record.highPerformanceStorageDiskSpaceBilledGb != null
                  ? `${record.highPerformanceStorageDiskSpaceBilledGb} GB`
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderTable = () => {
    switch (activeTab) {
      case "pods":
        return renderPodTable();
      case "endpoints":
        return renderEndpointTable();
      case "network-volumes":
        return renderNetworkVolumeTable();
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <Alert tone="danger" title="Failed to load billing data">
          <p className="mb-3">{error}</p>
          <IconButton
            label="Retry"
            variant="secondary"
            size="sm"
            onClick={fetchData}
          >
            <RotateCcw className="size-4" />
          </IconButton>
        </Alert>
      );
    }

    if (loading && currentData.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      );
    }

    if (currentData.length === 0) {
      return (
        <EmptyState
          title="No billing records"
          description="No billing records are available for the selected period and filters."
        />
      );
    }

    return (
      <Stack gap="md">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Spinner size="sm" />
            <span>Updating…</span>
          </div>
        )}
        {renderSummaryCards()}
        {renderTable()}
      </Stack>
    );
  };

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <Stack gap="md">
      {/* Header */}
      <div>
        <Heading level={3}>Billing Reports</Heading>
        <Text size="sm" tone="muted">
          View and filter Runpod billing records across pods, endpoints, and
          network volumes.
        </Text>
      </div>

      {/* Filters */}
      <Card padding="md">
        <Inline gap="md" align="end" wrap>
          <div className="flex-1 min-w-[200px]">
            <Text size="sm" weight="medium" className="mb-1.5">
              Date range
            </Text>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range"
            />
          </div>

          <div className="w-[160px]">
            <Text size="sm" weight="medium" className="mb-1.5">
              Bucket size
            </Text>
            <Select
              options={BUCKET_SIZE_OPTIONS}
              value={bucketSize}
              onValueChange={setBucketSize}
              placeholder="Select bucket"
            />
          </div>

          {activeTab === "pods" && (
            <div className="w-[240px]">
              <Text size="sm" weight="medium" className="mb-1.5">
                GPU type
              </Text>
              <Select
                options={GPU_FILTER_OPTIONS}
                value={gpuType}
                onValueChange={setGpuType}
                placeholder="All GPU types"
              />
            </div>
          )}

          <IconButton
            label="Refresh"
            variant="secondary"
            onClick={fetchData}
            loading={loading}
          >
            <RotateCcw className="size-4" />
          </IconButton>
        </Inline>
      </Card>

      {/* Tab navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as BillingTab)}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {renderContent()}
          </TabsContent>
        ))}
      </Tabs>
    </Stack>
  );
}
