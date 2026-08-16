You are the principal engineer responsible for delivering a complete, production-grade, standalone Next.js project that will later be merged as one service-integration module into an existing enterprise Super Admin application.

This is not a UI mockup, a proof of concept, a collection of snippets, or an API playground. Deliver a complete downloadable repository. It must run independently for review, but its production payload must be deliberately structured to drop into the host application described below with very little manual rewriting.

Do not ask questions. Make conservative, documented assumptions. If the official documentation is inaccessible, explicitly stop and report that the task cannot be completed faithfully; never invent endpoints, fields, permissions, SDK behavior, or capabilities.

### The one authoritative external input

```text
TARGET_SERVICE_NAME = "Clerk"
TARGET_SERVICE_SLUG = "clerk"
OFFICIAL_DOCUMENTATION_URL = "https://clerk.com/docs/reference/api/overview"
```

The target service identity, slug, and official documentation URL are fixed. Do not rename them. Do not request any private repository path or assume access to the host source tree.

Before designing or coding, browse this URL and read all official material relevant to programmatic administration of the service. Follow relevant links within the official documentation, including API references, authentication, resource schemas, pagination, filtering, rate limits, errors, retries, idempotency, webhooks/events, SDK guidance, billing/usage, account/organization/project scopes, regional constraints, quotas, security, and deprecation/versioning notices.

Only official vendor documentation and official vendor-maintained API specifications or SDK repositories are authoritative. Blog posts, memory, guessed endpoints, community packages, and the visual design of the vendor's own dashboard are not authoritative.

### Non-negotiable research gate

Before implementation, create `docs/service-capability-matrix.md`. It must contain one row for every administratively relevant capability discovered in the official material, with these columns:

| Domain | Capability | Read | Create | Update | Delete/action | Report/export | API surface and version | Required scope/role | Official source URL | Implementation status | Reason if unavailable |
|---|---|---:|---:|---:|---:|---:|---|---|---|---|---|

The matrix must at minimum investigate, when applicable:

- account identity, profile, balance, limits, and account-level settings;
- organizations, teams, members, roles, invitations, projects, and environments;
- API keys, tokens, credentials, service accounts, and permission scopes;
- every core resource and its complete documented lifecycle;
- resource configuration, scaling, networking, domains, storage, regions, templates, deployments, and runtime actions;
- logs, metrics, health, events, audit activity, job history, status, incidents, and operational diagnostics;
- usage, spend, invoices, credits, billing, forecasts, quotas, and report/export APIs;
- webhooks and event subscriptions, including signature verification and replay/idempotency rules;
- pagination, sorting, search, filtering, bulk operations, asynchronous operations, and polling;
- official SDK capabilities that are not exposed in the primary REST/GraphQL reference;
- API limitations, unavailable dashboard-only operations, beta/deprecated endpoints, and plan/role restrictions.

An operation counts as implemented only if a real official API supports it and the repository contains the validated end-to-end implementation and UI. If an operation is not publicly available, mark it `Not exposed by official API` and explain it. Never fabricate completeness. “Use the generic API playground” does not count as implementing a capability.

Also create:

- `docs/official-sources.md`: all official pages/specifications read, their purpose, API version/date, and any contradictions or ambiguities resolved;
- `docs/coverage-summary.md`: implemented, partially implemented, unavailable, and intentionally excluded capability counts, with links back to matrix rows;
- `docs/assumptions-and-limitations.md`: only evidence-backed constraints and conservative assumptions;
- `docs/security-model.md`: credentials, scopes, authorization, encryption, redaction, webhooks, destructive actions, audit, and threat boundaries.

Do not begin the feature implementation until this research gate is complete.

## Mental model of the host project

The host is **Diminish Super Admin**, an English, LTR enterprise commercial control plane. It manages users, plans, subscriptions, a feature catalog, credits, usage, payments, reports, alerts, and administrative settings. It is not a music-content admin panel and it is not a separate dashboard per external vendor.

### Exact host stack

- Next.js `16.2.11`, App Router
- React `19.2.4`
- TypeScript in strict mode
- Tailwind CSS 4, configured through CSS rather than a Tailwind config file
- Drizzle ORM `0.45.x`
- Neon serverless PostgreSQL (`@neondatabase/serverless`)
- Zod 4
- Clerk for host identity/authentication
- Lucide React icons
- Zustand is available but must not replace URL/server state without a real need
- Existing Radix and Base UI packages back the host UI primitives
- Path alias: `@/*` maps to `./src/*`
- The host is npm-based and uses `npm run lint` and `npm run build`

This is a changed Next.js version. Do not rely on remembered Next.js behavior. Before writing Next.js code, read the relevant local guides shipped in `node_modules/next/dist/docs/`, especially:

- `01-app/01-getting-started/05-server-and-client-components.md`
- `01-app/01-getting-started/06-fetching-data.md`
- `01-app/02-guides/authentication.md`
- `01-app/02-guides/backend-for-frontend.md`
- `01-app/03-api-reference/03-file-conventions/route.md`
- `01-app/03-api-reference/03-file-conventions/layout.md`
- `01-app/03-api-reference/03-file-conventions/loading.md`
- `01-app/03-api-reference/03-file-conventions/error.md`

Heed every deprecation notice. In this host version, `params` and `searchParams` are Promises. Pages and layouts are Server Components by default. Fetch data directly from its source in Server Components instead of making a server-to-own-Route-Handler HTTP round trip.

### Existing host shell — do not recreate it

The host already owns a reusable route-group layout at:

```text
src/app/(admin)/layout.tsx
  -> renders src/components/admin/admin-shell.tsx
  -> wraps every admin page with the approved sidebar and header
```

The shell is a full-height flex layout:

- desktop sidebar: left side, `17.5rem` wide, white surface, neutral border;
- small-screen sidebar: `4.75rem` icon-only rail;
- header: `4.5rem` high, white surface, neutral bottom border;
- main canvas: `neutral-50`, independently vertically scrollable;
- page content: fluid, normally `24px` padding and `24px` vertical rhythm;
- sidebar groups currently include Workspace, Monetization, Intelligence, and System;
- the host will later add one navigation entry for this module under an Integrations group;
- the shell owns global search, notifications, connection/system state, admin identity, and Help & Support.

Your module must **not** ship a production sidebar, topbar, mobile navigation, root product logo, global account menu, duplicate notification control, or alternate app shell. It renders only inside the host's `<main>` area.

The module's final public URL namespace is exactly:

```text
/integrations/clerk
/integrations/clerk/<resource>
/integrations/clerk/<resource>/<resource-id>
/integrations/clerk/settings
/integrations/clerk/activity
/integrations/clerk/reports
```

All service-specific API handlers, if genuinely required, live under:

```text
/api/integrations/clerk/...
```

Never claim top-level host routes such as `/`, `/users`, `/billing`, `/settings`, `/reports`, `/pods`, `/projects`, or `/deployments`. Route collisions are a release blocker.

### Host visual language

The host has a token-driven design system named Aurora UI. The UI is light, restrained, dense enough for operations, and enterprise-oriented.

Core visual rules:

- English UI copy, LTR direction, accessible semantic HTML;
- neutral white cards/surfaces on `neutral-50` canvas;
- purple primary accent used sparingly for active state and primary action;
- semantic success, warning, danger, and info tones for real status meaning;
- neutral text hierarchy, tabular numeric values, exact units and currencies;
- soft low-contrast borders and shadows;
- responsive layouts with purposeful information density;
- cards are few, purposeful, and equal-height when shown in a row;
- charts are analytical, labeled, and backed by real data; never decorative;
- destructive actions require an explicit confirmation dialog with resource identity and consequences.

Forbidden visual patterns:

- dark redesigns, vendor-themed redesigns, gradients, glassmorphism, backdrop-blur decoration, neon glows, excessive rounded pills, or rainbow dashboards;
- Persian/RTL production UI;
- a vendor-specific sidebar or shell nested inside the host shell;
- hand-built copies of generic buttons, cards, tables, dialogs, tabs, inputs, badges, or typography inside feature components;
- decorative KPIs, fake trends, random data, or silently substituted demo data.

### Existing host design tokens

Use host token utilities, never hardcoded vendor palettes. Available families include:

```text
neutral-0..950
primary-50..950
success-50..900
warning-50..900
danger-50..900
info-50..900
```

The host defines typography, spacing, radii, shadows, focus rings, motion durations, z-index layers, scrollbar treatment, and layout gutters in `src/app/globals.css`. Typical radii are `var(--radius-xs)` through `var(--radius-2xl)`; typical shadows are `var(--shadow-xs)` through `var(--shadow-xl)`. Consume these tokens rather than redefining them.

### Existing host UI primitives

Production feature code must compose the host primitives below. Do not replace them with a monolithic `primitives.tsx` or a new design system.

```text
@/components/ui/actions
  Button, IconButton, ButtonGroup, SplitButton, LinkButton, buttonVariants

@/components/ui/data-display
  Card, CardHeader, CardTitle, CardDescription, CardFooter,
  Badge, StatusIndicator, Avatar, AvatarGroup,
  DataTable, Table primitives, List, DescriptionList,
  Accordion, Timeline, Divider, CodeBlock

@/components/ui/feedback
  Alert, Banner, Toast, Snackbar, Tooltip, Popover,
  Progress, Spinner, Skeleton, EmptyState, ErrorState, LoadingState

@/components/ui/inputs
  TextInput, NumberInput, PasswordInput, SearchInput, Textarea, Field

@/components/ui/form-controls
  Checkbox, RadioGroup, RadioItem, Switch, Toggle, Slider

@/components/ui/select-combobox
  Select, MultiSelect, Combobox

@/components/ui/date-time
  DateInput, TimeInput, Calendar, DatePicker, DateRangePicker

@/components/ui/selection
  Tabs, TabsList, TabsTrigger, TabsContent,
  SegmentedControl, Chip, Tag, Pill, ChoiceCard, CheckboxCard, RadioCard

@/components/ui/navigation
  NavItem, Breadcrumb, Pagination, Stepper,
  DropdownMenu and ContextMenu primitives, CommandMenu

@/components/ui/overlay
  Dialog/Modal, AlertDialog, Drawer, BottomSheet, HoverCard

@/components/ui/layout
  Container, Stack, Inline, Grid, Spacer, LayoutSeparator,
  ScrollArea, AspectRatio, ResponsiveWrapper

@/components/ui/typography
  Display, Heading, Text, Label, Caption, HelperText, Link, Code, NumericText

@/components/ui/charts
  ChartContainer, ChartHeader, ChartLegend, ChartTooltip,
  ChartLoadingState, ChartEmptyState, ChartErrorState, Sparkline
```

If a capability truly needs a missing specialized primitive (for example a production time-series chart), isolate it in the integration module, style it exclusively with host tokens, document why it is needed, and add the dependency to the manifest. Do not duplicate an existing primitive.

Preferred composition recipes:

- KPI: `Card` + `Text` + `NumericText` + `Badge` and, only when meaningful, `Sparkline`;
- toolbar: `SearchInput` + `Select`/`MultiSelect` + `DateRangePicker` + `Button`;
- operational list: `DataTable` + URL-backed filters + `Pagination` + `DropdownMenu`;
- resource header: `Breadcrumb` + `Heading` + `Text` + `StatusIndicator` + approved actions;
- resource detail: `Tabs` + `Card` + `DescriptionList`;
- event/audit history: `Timeline` or `DataTable`;
- advanced filters: `Drawer`;
- destructive confirmation: `AlertDialog`;
- asynchronous states: `Skeleton`, `LoadingState`, `EmptyState`, `ErrorState`;
- inline operational warning: `Alert` or `Banner`.

## Host architecture contract

The host uses domain-first vertical slices. Match this shape:

```text
src/integrations/clerk/
  index.ts                         # safe public exports only
  contract.ts                      # module metadata and navigation descriptor
  types.ts                         # serializable domain/view types
  schemas.ts                       # Zod validation at trust boundaries
  config.ts                        # strict server-only .env.local parsing
  capabilities.ts                  # typed link to the researched capability matrix
  formatters.ts                    # pure service-specific display formatting
  server/
    client.ts                      # official API transport only
    errors.ts                      # normalized typed errors
    auth.ts                        # server-only credential retrieval from environment
    pagination.ts                  # vendor cursor/page normalization
    rate-limit.ts                  # bounded retry/backoff rules
    queries.ts                     # read operations and view-model composition
    mutations.ts                   # write/action operations
    webhooks.ts                    # verification, parsing, idempotency when supported
    audit.ts                       # redacted audit records for dashboard actions
  components/
    <focused components>.tsx
  tests/
    <transport, schema, policy, webhook, and critical workflow tests>

src/app/(admin)/integrations/clerk/
  page.tsx
  loading.tsx
  error.tsx                        # when appropriate under current Next rules
  <resource>/page.tsx
  <resource>/loading.tsx
  <resource>/[resourceId]/page.tsx
  settings/page.tsx
  activity/page.tsx
  reports/page.tsx

src/app/api/integrations/clerk/
  <only handlers justified by browser callbacks, webhooks, streaming, or client interaction>

src/db/schema/integrations/
  clerk.ts                # only local audit/webhook/sync state actually needed

src/db/migrations/
  <additive migration files>
```

Adapt the resource routes to the actual official capability matrix. Do not create empty routes just to match this example.

Architecture rules:

- Pages and layouts remain Server Components unless browser interaction is genuinely required.
- Add `"use client"` only to the smallest interactive leaf components.
- Client Components never import the database, credentials, server configuration, server SDK, or Drizzle schema.
- Server-only files use `server-only` protection where applicable.
- Reads from Server Components call the server integration layer directly, not this app's own Route Handlers.
- Route Handlers exist only for a real boundary: vendor webhooks/callbacks, browser-originated interactive requests, file/stream responses, or endpoints deliberately exposed to another system.
- Mutations use Server Actions or justified Route Handlers, Zod validation, authorization, normalized errors, audit logging, cache invalidation, and idempotency where supported.
- Search, filter, sort, time range, view, and pagination state belong in URL search parameters.
- Every resource list is server-filtered and paginated. Do not fetch an unbounded account and filter it only in the browser.
- Prevent N+1 upstream calls. Use official bulk endpoints or bounded concurrency with explicit justification.
- All vendor payloads are untrusted. Parse at the boundary and map them to stable internal types. Do not leak raw SDK types throughout UI code.
- Preserve upstream request IDs and useful rate-limit metadata in normalized server errors and audit records.
- Respect official timeouts, retries, idempotency keys, pagination, and rate limits. Retry only safe/idempotent operations and retryable statuses with bounded exponential backoff and jitter.
- Never log secrets, authorization headers, complete tokens, webhook secrets, sensitive inputs, or unnecessarily large response bodies.
- Timestamps remain timezone-aware and are rendered in the admin's timezone; relative time includes an exact timestamp tooltip.
- Money retains currency, uses safe units/precision, and is never summed across currencies.
- Large integers and decimals cross Server/Client boundaries as safe strings when precision could be lost.
- No mock, random, or fake trend may appear when real data is unavailable. Show a professional unconfigured, unavailable, permission-denied, or empty state.

## Authentication, authorization, and credential safety

The host uses Clerk for the human admin identity, but do not assume that merely being signed in grants every integration action.

Build an explicit server-side policy layer with at least these operation classes:

```text
integration.read
integration.configure
integration.mutate
integration.delete
integration.billing.read
integration.audit.read
```

Keep policy checks centralized and testable. Apply them at the mutation/data boundary, not only by hiding buttons.

The user will **not provide any API key, token, credential, account secret, webhook secret, or private identifier to you while you build this repository**. Do not ask for one. Develop and test the integration with transport mocks and sanitized official example payloads.

The real connection must be established only after the user downloads the repository and manually places their own values in a local environment file:

```text
cp .env.example .env.local
# The user privately fills .env.local, then starts/restarts the application.
```

Credential configuration is environment-only. This project must:

- commit a complete `.env.example` containing every required and optional variable name, safe placeholder values, comments, scope requirements, and links to the relevant official setup documentation;
- include `.env*` in `.gitignore` while explicitly allowing `!.env.example`;
- never create, populate, print, bundle, upload, or request the user's real `.env.local`;
- use clear service-prefixed names such as `CLERK_API_KEY`, adapted to the vendor's official terminology;
- keep every credential server-only; credential variables must never use a `NEXT_PUBLIC_` prefix;
- parse and validate environment variables with Zod in a server-only module; a completely absent credential set is a valid `not configured` state so lint, tests, and build pass without real secrets, while a partially supplied or malformed set produces a safe actionable configuration error;
- connect to the real vendor account automatically after valid values are placed in `.env.local` and the application is started or restarted;
- show an actionable `Not configured` state when values are absent, including the required environment variable names but never a form asking for secret values;
- show a redacted connection status and verified account/organization/project identity after configuration;
- validate credentials through a cheap official identity/account endpoint before other live operations;
- never store the bootstrap connection credentials in Neon/PostgreSQL or any other database;
- never provide a dashboard form, API route, Server Action, settings mutation, or browser workflow for entering, editing, returning, rotating, or deleting the bootstrap connection credentials;
- never store bootstrap connection credentials in localStorage, cookies, client state, source files, fixtures, query strings, logs, audit payloads, screenshots, generated documentation, or test snapshots;
- never expose full bootstrap credentials or secret environment values through errors, health endpoints, debug pages, React props, serialized Server Component payloads, or build output.

If the service requires several related secrets or scope identifiers, declare all of them in `.env.example` and explain how the user obtains each one. If the official platform supports several authentication methods, choose the safest officially supported server-to-server method that covers the required capabilities and document the choice.

If the official API itself supports administering subordinate API keys, tokens, or service accounts as account resources, that capability may still be implemented when it appears in the capability matrix. It must remain separate from the immutable bootstrap credential loaded from `.env.local`, and any newly issued one-time secret must receive appropriate confirmation, redaction, and non-persistence handling.

Request the least privilege scopes required. Document optional versus mandatory scopes. Permission-denied UI must say which capability/scope is missing without exposing sensitive details.

For organization/project/environment-scoped services, model the configured scope explicitly using non-secret environment variables where required. Never silently mix data between organizations, projects, or environments. Supporting multiple simultaneous credential sets is not required unless the official API inherently requires it; the default deliverable connects to the single account/credential set privately configured by the user in `.env.local`.

Destructive or costly operations require:

- server-side authorization;
- current resource identity and scope revalidation;
- an `AlertDialog` naming the exact resource and consequence;
- protection against duplicate submission;
- vendor idempotency/preconditions when available;
- a redacted audit result with actor, action, scope, target, status, duration, request ID, and timestamp.

Webhook handlers, when supported, must verify the signature over the raw body exactly as official documentation requires, reject stale/replayed messages, store a vendor event ID for idempotency, return promptly, and separate receipt from retryable processing if needed.

## Product and UI completeness

Translate the capability matrix into a coherent operational information architecture. The landing page should summarize live account/service health and direct the admin to resources requiring attention. Resource sections must support every officially available administrative read/write/action/report workflow that is safe and relevant.

For each implemented resource, provide as supported by the API:

- a useful list with search/filter/sort/pagination;
- detail view with identifiers, status, relationships, configuration, timestamps, and recent activity;
- complete create/edit forms generated from documented fields and constraints, not a generic JSON textarea;
- lifecycle actions with correct confirmations and optimistic/pending/error behavior;
- actionable empty, unconfigured, forbidden, rate-limited, degraded, partial-data, and upstream-error states;
- audit/activity visibility for actions initiated through this dashboard;
- usage/health/metric/report views with explicit time range, timezone, unit, source, and data freshness;
- CSV/JSON export only when data access and scale make it safe, streamed or paginated rather than loading everything into the browser.

Do not make every page a wall of KPI cards. Prioritize operational tables, details, filters, alerts, and actions. Do not claim “real-time” unless the implementation uses an official real-time or correctly polled source and communicates freshness.

Accessibility is an acceptance criterion: keyboard access, focus visibility, correct labels, table semantics, dialog focus behavior, adequate contrast, non-color status cues, `aria-live` for async results, and reduced-motion respect.

## Standalone repository and merge boundary

The downloaded result must be a complete repository that can be installed, configured, linted, typechecked, tested, built, and run independently. Because the real host repository is not available to you, keep review-only compatibility code separate from the production payload.

The repository must have exactly two clearly documented zones:

1. **Production payload** — files intended to be copied into the host at the exact paths described above.
2. **Standalone preview host** — the minimum shell, primitive compatibility layer, seed/fixture harness, or development adapters needed only to run the downloaded project. These files must never be mixed into the production payload.

Preview data is allowed only inside the explicitly labeled standalone preview adapter. The visible preview must carry an unmistakable `Preview fixtures — not live service data` banner. Production payload code must never automatically fall back to fixtures, and mutations in preview mode must never pretend to have changed the vendor account.

The standalone project must be fully reviewable without a real key, but real account access is activated only by the user's private post-download `.env.local`. The absence of a real key during your implementation is expected and is not permission to omit the live transport or replace it with demo behavior.

Create `integration-manifest.json` at repository root with this minimum structure and fill it accurately:

```json
{
  "schemaVersion": 1,
  "service": "Clerk",
  "serviceSlug": "clerk",
  "moduleVersion": "1.0.0",
  "officialDocumentation": ["exact official URLs used"],
  "hostCompatibility": {
    "next": "16.2.11",
    "react": "19.2.4",
    "tailwind": "4.x",
    "drizzleOrm": "0.45.x",
    "database": "Neon PostgreSQL"
  },
  "routePrefix": "/integrations/clerk",
  "apiRoutePrefix": "/api/integrations/clerk",
  "payloadRoots": ["exact production payload directories"],
  "copyFiles": ["every file that should enter the host"],
  "discardFiles": ["every preview-only file or directory"],
  "hostEdits": [
    {
      "file": "src/components/admin/admin-shell.tsx",
      "purpose": "add one Integrations navigation entry",
      "instructions": "exact minimal edit; do not replace the shell"
    },
    {
      "file": "src/db/schema/index.ts",
      "purpose": "export additive integration schema if needed",
      "instructions": "exact export"
    }
  ],
  "environmentVariables": [
    {
      "name": "EXACT_NAME",
      "required": true,
      "secret": true,
      "serverOnly": true,
      "userSuppliedAfterDownload": true,
      "targetFile": ".env.local",
      "purpose": "description",
      "validation": "format without revealing a value"
    }
  ],
  "runtimeDependencies": [{ "name": "package", "version": "exact compatible range", "reason": "why required" }],
  "devDependencies": [],
  "databaseMigrations": ["ordered additive migration files"],
  "requiredPermissions": ["host policy and vendor scopes"],
  "webhookEndpoints": ["exact public callback paths"],
  "scheduledJobs": ["job, cadence, idempotency and purpose"],
  "validationCommands": ["npm commands in required order"],
  "knownLimitationsDocument": "docs/assumptions-and-limitations.md",
  "capabilityMatrix": "docs/service-capability-matrix.md"
}
```

`copyFiles` and `discardFiles` must be exhaustive and non-overlapping. A later engineer must be able to merge the module without guessing which files are safe.

Also create `MERGE.md` containing:

1. exact ordered copy operations by path;
2. exact minimal host edits;
3. dependency delta and version-conflict notes;
4. exact `.env.example` to `.env.local` setup instructions, variable descriptions, official credential-creation links, and placeholders only;
5. migration order, rollback strategy, and data-loss risk;
6. webhook/callback configuration steps;
7. Clerk authorization assumptions and required policy wiring;
8. navigation descriptor (label, route, Lucide icon name, active matching rule);
9. post-merge commands and smoke-test checklist;
10. a removal plan listing exactly what can be deleted to uninstall this one integration.

No merge step may overwrite the host root layout, global CSS, admin shell, existing UI primitives, existing database connection, existing domain schemas, or existing routes. Any required host modification must be small, explicit, additive, and listed in both `integration-manifest.json` and `MERGE.md`.

## Database and synchronization rules

The vendor remains source of truth for vendor resources. Do not mirror entire upstream resources into Neon without a demonstrated reporting, webhook-idempotency, performance, or audit reason.

Local tables, if needed, must be service-prefixed and additive. Bootstrap connection credentials and secret environment configuration are never valid database concerns. Appropriate local concerns include:

- non-secret host-to-vendor account/organization/project references only when required for audit or synchronization;
- dashboard action audit records;
- webhook delivery/event idempotency;
- sync cursor/checkpoint and last-success/last-error state;
- explicitly justified reporting snapshots or aggregates.

Do not create a second database client. Use the host's `@/db` and add schema under `src/db/schema/integrations`. Migrations must be deterministic, reviewed SQL/Drizzle output, safe on an existing populated database, and reversible where practical. Never delete, rename, or reinterpret an existing host table.

If background synchronization is needed, make the job resumable, bounded, idempotent, observable, and safe under concurrent execution. Document its scheduler-neutral entry point; do not couple core logic exclusively to one deployment vendor.

## Transport and error contract

Create a single service transport boundary rather than scattering `fetch` throughout pages and components. It must provide:

- official base URLs and version headers from configuration/constants backed by citations;
- authentication exactly as officially documented;
- request timeout and cancellation;
- response parsing and Zod validation;
- typed pagination support;
- normalized error categories such as `unauthenticated`, `forbidden`, `not_found`, `conflict`, `validation`, `rate_limited`, `upstream_unavailable`, and `unexpected`;
- redacted diagnostic metadata including vendor request ID and retry-after when available;
- bounded retry only for safe requests;
- test injection/mocking at the transport boundary, never production demo fallback.

Do not place secrets in URL query parameters unless the current official API offers no safer mechanism; if unavoidable, document the risk and ensure URLs are never logged.

## Tests and evidence

Use a minimal compatible test setup and include:

- transport tests for auth headers, URL/version construction, pagination, timeout, rate-limit mapping, malformed payloads, and secret redaction;
- schema/normalization tests using sanitized official example payloads with source citations;
- policy tests proving unauthorized reads and mutations are blocked server-side;
- mutation tests for validation, idempotency/preconditions, audit success/failure, and destructive confirmation contract;
- webhook signature, replay, malformed event, and idempotency tests when webhooks exist;
- component/workflow tests for loading, empty, error, permission, and destructive states;
- at least one integration-style happy path and one upstream-failure path per critical resource domain;
- route collision and production-payload import-boundary checks;
- a test proving production code cannot import preview fixtures or preview adapters.

Do not make tests depend on a real paid vendor account. Optionally provide a separately invoked live smoke test that requires explicit environment variables and cannot run accidentally.

Required commands must include and pass:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

If the official SDK or framework adds other validation/generation commands, include them. Do not report success without actually running commands. Record command results in `VALIDATION.md`, including environment limitations and any intentionally skipped live test.

## Explicit rejection criteria derived from a bad prior Runpod example

The previous example looked polished in isolation but was not acceptable for integration. Your result is rejected if it repeats any of these patterns:

- builds a separate Persian RTL “control room” with its own sidebar, topbar, mobile nav, logo, vendor palette, gradients, glass effects, or global CSS;
- uses top-level routes such as `/pods`, `/billing`, `/settings`, or `/activity` that collide with the host;
- creates one large `src/lib/<service>/service.ts`, one large `primitives.tsx`, or page files that contain transport, normalization, state, UI, and mutation logic together;
- implements only a few headline resources while calling the result “enterprise” or “complete”;
- silently falls back to demo data when no credential exists or returns fake successful mutations in demo mode;
- uses random IDs, fake usage, fake spend trends, fake GPU/resource metrics, or decorative charts;
- uses a raw REST/GraphQL playground as a substitute for researched and validated workflows;
- guesses endpoint shapes from memory or mixes legacy, beta, and current API versions without a capability/source matrix;
- stores a credential using a hardcoded encryption key, exposes it to the browser, or logs sensitive request/response payloads;
- asks the user/model operator for a real bootstrap API key, creates a bootstrap credential-entry form, or stores the bootstrap credential in the database instead of reading it only from the user's post-download `.env.local`;
- fires one upstream health request per list row without bounded concurrency or a bulk strategy;
- exposes unrestricted arbitrary upstream requests through an authenticated dashboard proxy;
- omits authorization because authentication exists;
- writes a singleton settings row that cannot distinguish accounts, organizations, projects, or environments;
- duplicates the host database client, root layout, shell, design tokens, or generic UI components in the production payload;
- delivers TODOs, placeholders, pseudocode, commented-out functionality, dead routes, non-working buttons, or “implement later” sections;
- lists validation commands without executing them.

## Implementation sequence

Follow this order and preserve evidence:

1. Confirm the fixed Clerk identity and `clerk` slug from the official domain.
2. Research official documentation and complete the source list and capability matrix.
3. Define the vendor scope model, permission model, API versions, error model, and module route map.
4. Define production/preview boundaries and write an initial manifest.
5. Implement configuration, credentials, transport, schemas, normalization, policies, and tests.
6. Implement server queries/mutations/webhooks/audit with bounded upstream behavior.
7. Implement complete resource workflows using the host UI contract and route namespace.
8. Implement standalone preview adapters without contaminating the production payload.
9. Validate accessibility, responsive behavior, empty/error/permission states, and destructive flows.
10. Finalize the capability matrix truthfully against the actual code.
11. Run all validation commands and write `VALIDATION.md`.
12. Audit every file into exhaustive `copyFiles` or `discardFiles`, then finalize `MERGE.md`.

## Final deliverable contract

Return a complete downloadable repository, not a diff and not selected snippets. It must contain at least:

```text
README.md
MERGE.md
VALIDATION.md
integration-manifest.json
.env.example                         # complete names/comments/placeholders; user later copies to .env.local
docs/service-capability-matrix.md
docs/official-sources.md
docs/coverage-summary.md
docs/assumptions-and-limitations.md
docs/security-model.md
production payload files
standalone preview host files
tests
lockfile
```

The README must explain the service, supported account/scope model, standalone setup, explicit preview/live modes, and links to the research and merge documents.

Before handing off, perform a final self-audit and state:

- official documentation pages actually read;
- capability coverage counts and any official API gaps;
- production payload roots;
- number and nature of host files requiring additive edits;
- dependency and migration deltas;
- security-sensitive assumptions;
- exact validation results;
- confirmation that no production file imports preview code;
- confirmation that the module owns no route outside `/integrations/clerk` and `/api/integrations/clerk`;
- confirmation that no production sidebar, header, root layout, global CSS, or duplicate generic UI primitive will enter the host.

Completeness means every officially supported and relevant administrative capability is either implemented end to end or explicitly and accurately classified with evidence. Visual polish without architectural fit, security, API fidelity, and merge discipline is a failure.

