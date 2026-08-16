import { NextResponse } from "next/server";
import { getConnectionStatus } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await safeFetch(() => getConnectionStatus());
  return NextResponse.json(result);
}
