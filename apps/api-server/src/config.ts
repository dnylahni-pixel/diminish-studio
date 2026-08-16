import { z } from "zod";

const requiredString = z.string().trim().min(1, "is required");
const requiredUrl = requiredString.url("must be a valid URL");
const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  requiredString.optional(),
);
const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  requiredUrl.optional(),
);

const backendEnvironmentSchema = z
  .object({
    APP_ENVIRONMENT: z.enum([
      "development",
      "preview",
      "staging",
      "production",
      "test",
    ]),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    RUN_MIGRATIONS: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    DATABASE_ENVIRONMENT: z.enum(["development", "staging", "production"]),
    DATABASE_URL: requiredUrl,
    CLERK_PUBLISHABLE_KEY: requiredString,
    CLERK_SECRET_KEY: requiredString,
    B2_ENDPOINT: requiredUrl,
    B2_REGION: requiredString,
    B2_KEY_ID: requiredString,
    B2_APPLICATION_KEY: requiredString,
    BUCKET_NAME: requiredString,
    RUNPOD_ENDPOINT: optionalUrl,
    RUNPOD_API_KEY: optionalString,
  })
  .superRefine((environment, context) => {
    const runPodValues = [
      environment.RUNPOD_ENDPOINT,
      environment.RUNPOD_API_KEY,
    ];

    if (runPodValues.filter(Boolean).length === 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RUNPOD_ENDPOINT"],
        message: "RUNPOD_ENDPOINT and RUNPOD_API_KEY must be configured together",
      });
    }

    if (
      environment.APP_ENVIRONMENT === "production" &&
      environment.DATABASE_ENVIRONMENT !== "production"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_ENVIRONMENT"],
        message: "must be production when APP_ENVIRONMENT is production",
      });
    }

    if (
      environment.APP_ENVIRONMENT !== "production" &&
      environment.DATABASE_ENVIRONMENT === "production"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_ENVIRONMENT"],
        message: "production database is forbidden outside production",
      });
    }
  });

function parseBackendEnvironment() {
  const result = backendEnvironmentSchema.safeParse(process.env);

  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => `- ${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid backend environment:\n${details}`);
}

const environment = parseBackendEnvironment();

export const backendConfig = {
  appEnvironment: environment.APP_ENVIRONMENT,
  nodeEnvironment: environment.NODE_ENV,
  port: environment.PORT,
  logLevel: environment.LOG_LEVEL,
  runMigrations: environment.RUN_MIGRATIONS,
  database: {
    environment: environment.DATABASE_ENVIRONMENT,
    url: environment.DATABASE_URL,
  },
  clerk: {
    publishableKey: environment.CLERK_PUBLISHABLE_KEY,
    secretKey: environment.CLERK_SECRET_KEY,
  },
  b2: {
    endpoint: environment.B2_ENDPOINT,
    region: environment.B2_REGION,
    keyId: environment.B2_KEY_ID,
    applicationKey: environment.B2_APPLICATION_KEY,
    bucketName: environment.BUCKET_NAME,
  },
  runPod:
    environment.RUNPOD_ENDPOINT && environment.RUNPOD_API_KEY
      ? {
          endpoint: environment.RUNPOD_ENDPOINT,
          apiKey: environment.RUNPOD_API_KEY,
        }
      : null,
} as const;
