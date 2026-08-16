import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { getEndpoint } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { EndpointDetailShell } from "./_components/endpoint-detail-shell";

export const revalidate = 0;

interface EndpointDetailPageProps {
  params: Promise<{ endpointId: string }>;
}

export default async function RunpodEndpointDetailPage({
  params,
}: EndpointDetailPageProps) {
  const { endpointId } = await params;
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <EndpointDetailShell
        endpointId={endpointId}
        configStatus="not_configured"
        initialData={null}
      />
    );
  }

  const result = await safeFetch(() => getEndpoint(context, endpointId));

  return (
    <EndpointDetailShell
      endpointId={endpointId}
      configStatus="configured"
      initialData={result.ok ? result.data : null}
      initialError={result.ok ? undefined : { message: result.error.message, category: result.error.category }}
    />
  );
}
