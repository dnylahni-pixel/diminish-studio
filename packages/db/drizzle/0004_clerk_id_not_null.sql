-- Before making clerk_id NOT NULL, check for any null clerk_id rows.
-- If any exist, they must be resolved manually (these would be legacy users without Clerk accounts).
-- In a production deploy, run: SELECT id FROM users WHERE clerk_id IS NULL;
-- If rows exist, either backfill clerk_id or delete those rows before running this migration.
ALTER TABLE "users" ALTER COLUMN "clerk_id" SET NOT NULL;