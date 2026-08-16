import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/integrations/runpod.ts",
  out: "./src/db/local-migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/runpod.db",
  },
  verbose: true,
  strict: true,
});
