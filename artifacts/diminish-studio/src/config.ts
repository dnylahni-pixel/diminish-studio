import { parseFrontendEnvironment } from "./config-schema";

const environment = parseFrontendEnvironment(import.meta.env);

export const frontendConfig = {
  appEnvironment: environment.VITE_APP_ENVIRONMENT,
  apiBaseUrl: environment.VITE_API_BASE_URL.replace(/\/+$/, ""),
  clerkPublishableKey: environment.VITE_CLERK_PUBLISHABLE_KEY,
} as const;
