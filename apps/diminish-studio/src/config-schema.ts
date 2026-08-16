import { z } from "zod";

const frontendEnvironmentSchema = z.object({
  VITE_APP_ENVIRONMENT: z.enum([
    "development",
    "preview",
    "staging",
    "production",
    "test",
  ]),
  VITE_API_BASE_URL: z.string().trim().url(),
  VITE_CLERK_PUBLISHABLE_KEY: z.string().trim().min(1),
});

export function parseFrontendEnvironment(environment: Record<string, unknown>) {
  const result = frontendEnvironmentSchema.safeParse(environment);

  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid frontend environment:\n${details}`);
}
