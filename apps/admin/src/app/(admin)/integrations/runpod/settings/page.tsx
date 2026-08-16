import { resolveRunpodPolicyContext } from "@/integrations/runpod/server/identity-adapter";
import { getConnectionStatus } from "@/integrations/runpod/server/queries";
import { safeFetch } from "@/integrations/runpod/safe-fetch";
import {
  RUNPOD_REQUIRED_ENV_VARS,
  RUNPOD_OPTIONAL_ENV_VARS,
} from "@/integrations/runpod/config";
import { runpodModuleMetadata } from "@/integrations/runpod/contract";
import { SettingsClient } from "./_components/settings-client";

export const revalidate = 0;

export default async function RunpodSettingsPage() {
  await resolveRunpodPolicyContext();
  const statusResult = await safeFetch(() => getConnectionStatus());

  return (
    <SettingsClient
      initialStatus={
        statusResult.ok
          ? { ok: true, data: statusResult.data }
          : {
              ok: false,
              error: {
                message: statusResult.error.message,
                category: statusResult.error.category,
              },
            }
      }
      requiredEnvVars={RUNPOD_REQUIRED_ENV_VARS}
      optionalEnvVars={RUNPOD_OPTIONAL_ENV_VARS}
      officialDocumentation={runpodModuleMetadata.officialDocumentation}
    />
  );
}
