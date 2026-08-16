CREATE TABLE IF NOT EXISTS "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"value_type" text NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_value_type_check" CHECK ("value_type" IN ('boolean','number','string','string[]','number[]','object'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"version_number" integer NOT NULL,
	"change_reason" text,
	"changed_by" text NOT NULL,
	"changed_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "settings_versions_key_version_unique" UNIQUE("key","version_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_key" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"version_ref" text,
	"created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_log_entity_idx" ON "admin_audit_log" ("entity_type","entity_key");--> statement-breakpoint
ALTER TABLE "settings_versions" ADD CONSTRAINT "settings_versions_key_app_settings_key_fk" FOREIGN KEY ("key") REFERENCES "public"."app_settings"("key") ON DELETE cascade ON UPDATE no action;
