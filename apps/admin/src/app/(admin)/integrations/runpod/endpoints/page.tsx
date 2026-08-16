import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getRunpodConfig } from "@/integrations/runpod/config";
import { listEndpoints, listTemplates, listNetworkVolumes } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import { EndpointsShell } from "./_components/endpoints-shell";

export const revalidate = 0;

export default async function RunpodEndpointsPage() {
  const context = await resolveRunpodPolicyContext();
  const config = getRunpodConfig();

  if (config.status !== "configured") {
    return (
      <EndpointsShell
        configStatus="not_configured"
        initialData={null}
        templates={[]}
        networkVolumes={[]}
      />
    );
  }

  const endpointsResult = await safeFetch(() => listEndpoints(context, { page: 1, pageSize: 100 }));
  const templatesResult = await safeFetch(() => listTemplates(context, { page: 1, pageSize: 100 }));
  const volumesResult = await safeFetch(() => listNetworkVolumes(context, { page: 1, pageSize: 100 }));

  return (
    <EndpointsShell
      configStatus="configured"
      initialData={endpointsResult.ok ? endpointsResult.data : null}
      initialError={endpointsResult.ok ? undefined : { message: endpointsResult.error.message, category: endpointsResult.error.category }}
      templates={templatesResult.ok ? templatesResult.data.items : []}
      networkVolumes={volumesResult.ok ? volumesResult.data.items : []}
    />
  );
}
