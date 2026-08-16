# Prompt 13 — Admin & Settings

Implement safe read-only `/admin` and `/settings` pages without pretending that RBAC or audit logging already exists.

## Project Capsule

- Next.js 16, TypeScript, Drizzle + Neon.
- Existing app dependencies include Clerk while the database also contains Neon Auth tables. Do not merge identities, query auth tables or choose a new provider in this task.
- Public `users` are platform customers, not necessarily admin identities.
- Reuse existing UI and do not install packages.

## Schema Addition

The live database already contains `public.admin_config`:

- `id` integer primary key
- `key` text
- `value` jsonb
- `user_id` integer nullable
- `description` text nullable
- `updated_by` integer nullable
- `updated_at` timestamp
- `created_at` timestamp

Add a Drizzle schema definition matching the existing table exactly. This is mapping only: do not generate or run a migration. Export it from the app schema index.

## `/admin` Page

Build a security readiness page, not a fake admin-user manager.

Sections:

1. Identity Boundary
   - Explain visually that customer identities and admin identities are separate concerns.
   - Show configuration status only from safe booleans; never expose environment values.
2. Governance Readiness
   - Audit log availability.
   - RBAC availability.
   - Approval workflow availability.
   - Admin session protection availability.
3. Required Foundations
   - Use `Alert` cards for genuinely missing foundations.
   - Do not show invented admins, roles or activity.

If the project has no implemented RBAC/audit/session controls, state `Not configured` honestly.

## `/settings` Page

Display `admin_config` entries using:

- Search by key/description.
- Scope filter: global (`user_id` null) or user-specific.
- Table columns: key, description, scope, value summary, updated by, updated time.

Security rules:

- Never dump arbitrary JSON.
- Values for keys containing `secret`, `token`, `password`, `key`, `credential` or `webhook` must display `Sensitive value`.
- Safe primitive values may display compactly.
- Objects/arrays display type and item/key count, not raw contents.
- No edit controls in this stage.

## Files Allowed

- `src/db/schema/app/admin-config.ts`
- `src/db/schema/app/index.ts`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/loading.tsx`
- `src/app/(admin)/settings/page.tsx`
- `src/app/(admin)/settings/loading.tsx`
- `src/features/admin/*`
- `src/features/settings/*`

## Acceptance

- No auth provider is guessed or integrated.
- No secret/config JSON leaks.
- Existing database is not migrated.
- Missing enterprise foundations are explicit, not hidden behind fake UI.
- Build and lint succeed.

If web-only, provide complete files.
