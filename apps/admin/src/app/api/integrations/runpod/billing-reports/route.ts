import { NextRequest, NextResponse } from "next/server";
import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import {
  getPodBillingReport,
  getEndpointBillingReport,
  getNetworkVolumeBillingReport,
} from "@/integrations/runpod/server/queries";
import { RunpodApiError } from "@/integrations/runpod/server/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "pods";

  const query: Record<string, string | undefined> = {
    startTime: searchParams.get("startTime") ?? undefined,
    endTime: searchParams.get("endTime") ?? undefined,
    bucketSize: searchParams.get("bucketSize") ?? undefined,
    gpuTypeId: searchParams.get("gpuTypeId") ?? undefined,
    podId: searchParams.get("podId") ?? undefined,
    endpointId: searchParams.get("endpointId") ?? undefined,
  };

  try {
    const context = await resolveRunpodPolicyContext();

    let data;
    switch (type) {
      case "endpoints":
        data = await getEndpointBillingReport(context, query);
        break;
      case "network-volumes":
        data = await getNetworkVolumeBillingReport(context, query);
        break;
      case "pods":
      default:
        data = await getPodBillingReport(context, query);
        break;
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof RunpodApiError) {
      return NextResponse.json(
        { ok: false, error: { message: error.message, category: error.category } },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: error instanceof Error ? error.message : "An unexpected error occurred",
          category: "unexpected",
        },
      },
      { status: 500 },
    );
  }
}
