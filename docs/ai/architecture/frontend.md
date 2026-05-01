# Frontend architecture — Ops Tracker

A code-anchored map of the **frontend** of Ops Tracker: the Next.js App Router tree, the layouts that wrap it, the boundary between Server and Client Components, and every recurring UI pattern that has crystallised in `src/`. Every claim in this document points at a concrete file or symbol.

This document complements `docs/ai/architecture/repository-overview.md` (system-wide map) and `docs/ARCHITECTURE.md` (top-level docs). Where they overlap, all three must agree with the code; if they don't, the code wins and these docs are stale.

---

## 1. Stack and entry points

Confirmed in `package.json`:

- **Framework:** Next.js 16 (App Router, React Server Components, Server Actions). Engine pin: `node >= 20.19.0`.
- **UI library:** Mantine v8 — `@mantine/core`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/modals` (installed but not used, see §17).
- **Icons:** `@tabler/icons-react`.
- **Data:** TanStack Query v5 (`@tanstack/react-query`) + `@tanstack/react-query-devtools` (dev only).
- **Tables / virtualisation:** `@tanstack/react-table` v8, `@tanstack/react-virtual` v3.
- **Drag-and-drop:** `@dnd-kit/core` (used in the Kanban board only).
- **i18n:** `next-intl` with `localePrefix: "as-needed"` (`src/i18n/routing.ts`).
- **Validation:** `zod` (used by Server Actions; `@mantine/form` runs an additional client-side pass for some forms — see §9).
- **Auth (browser surface):** none today; sign-in posts to a Server Action and reCAPTCHA v3 client script is loaded by `LoginForm`.
- **Styling:** SCSS Modules + Mantine theme tokens. Sass alias `@/...` → `src/...` is registered in `next.config.ts` (see repository-overview §5).

Single root layout: `src/app/[locale]/layout.tsx`. There is no `src/app/layout.tsx` and there is no non-locale page tree besides `src/app/api/test-supabase/route.ts`.

---

## 2. App Router tree

Confirmed by listing `src/app/[locale]`. Every user-facing route is locale-prefixed (or unprefixed for `en`).

```
[locale]/
  layout.tsx                        Root provider stack + html lang
  page.tsx                          Landing — redirects authenticated users to /dashboard
  loading.tsx, error.tsx
  login/{page,loading}.tsx
  dashboard/{page,loading,error,layout}.tsx
  issues/
    {page,loading,error,layout}.tsx
    [id]/{page,loading,error}.tsx
  projects/
    {page,loading,layout}.tsx
    [projectKey]/
      layout.tsx                    Wraps children with ProjectSubnav
      board/{page,loading}.tsx
      issues/
        page.tsx
        ProjectIssuesHeaderActions.tsx   Co-located client component
        loading.tsx
        [issueNumber]/{page,loading}.tsx
      settings/{page,loading}.tsx
  admin/
    layout.tsx                      requireRole + AdminSubnav
    page.tsx                        Static overview text
    loading.tsx, error.tsx
    users/page.tsx
    statuses/page.tsx
    audit/page.tsx
    settings/page.tsx               Additional requireRole(SuperAdminRoles)
```

There is no `(group)/` parallel-route folder and no `(parallel)` slot. The tree is flat under `[locale]`.

The only Route Handler (REST endpoint) in the tree is `src/app/api/test-supabase/route.ts` (a diagnostic GET), which sits **outside** `[locale]/` and **bypasses** the proxy matcher (`src/proxy.ts` line 58). Treat it as out-of-scope for the frontend (see repository-overview §16.2 for caveats).

---

## 3. Layout cascade

Every workspace page (`/dashboard`, `/issues`, `/projects`, `/admin`) renders inside the same shell, but the shell is **not** wired in the root layout. Instead each top-level segment has its own `layout.tsx` that delegates to a shared component.

### 3.1 Root locale layout (`src/app/[locale]/layout.tsx`)

Server Component. Validates the locale (`hasLocale(routing.locales, locale)` then `notFound()`), calls `setRequestLocale(locale)`, loads messages via `getMessages()`, renders the `<html>`/`<body>`, and stacks the runtime providers in this exact order (lines 87–94):

```22:33:src/app/[locale]/layout.tsx
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = () => {
  return routing.locales.map((locale) => ({ locale }));
};
```

```81:97:src/app/[locale]/layout.tsx
return (
    <html lang={locale} {...mantineHtmlProps}>
      <body className={inter.className}>
        <Script id="mantine-color-scheme" strategy="beforeInteractive">
          {`(function(){try{var s=localStorage.getItem('mantine-color-scheme-value')||'auto';var r=s==='auto'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s;document.documentElement.setAttribute('data-mantine-color-scheme',r);}catch(e){}})();`}
        </Script>
        <MantineProvider defaultColorScheme="auto">
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              <AppNotifications />
              {children}
            </QueryProvider>
          </NextIntlClientProvider>
        </MantineProvider>
      </body>
    </html>
  );
```

Notable details, all observable in the file:

- `generateStaticParams()` emits one entry per locale.
- `generateMetadata()` reads SEO copy from translations (`seo.root.title` / `seo.root.description`) and sets `metadataBase: new URL(env("NEXT_PUBLIC_SITE_URL"))`.
- An inline `<Script strategy="beforeInteractive">` syncs the Mantine colour scheme **before hydration** to prevent a flash of incorrect theme.
- `<AppNotifications />` (`src/components/Providers/AppNotifications.tsx`) is the singleton `Notifications` host with `position="bottom-right"`, `zIndex={10_000}`. Every `notifications.show(...)` call in the app surfaces here.
- `Inter` is loaded via `next/font/google` and applied via `body className`. No other custom font.

There is no opt-in to `experimental_dynamicIO` or static rendering at this level — the locale layout is server-rendered per request because `setRequestLocale` and `getMessages` read from request context.

### 3.2 `WorkspaceRouteLayout` and `WorkspaceShellClient`

Used by `dashboard/layout.tsx`, `issues/layout.tsx`, `projects/layout.tsx`, and `admin/layout.tsx`. Each of those four files is a thin wrapper:

```10:16:src/app/[locale]/dashboard/layout.tsx
const DashboardLayout = ({ children, params }: DashboardLayoutProps) => (
  <WorkspaceRouteLayout
    params={params as Promise<{ locale: string }>}
  >
    {children}
  </WorkspaceRouteLayout>
);
```

`WorkspaceRouteLayout` (`src/components/Layout/WorkspaceRouteLayout.tsx`) is a Server Component. It:

1. Awaits `params`, calls `getUserAuthContext()` from `@/lib/auth/session`.
2. If unauthenticated, returns `<>{children}</>` — meaning the shell silently disappears and the inner Server Component (the page) is responsible for the redirect to `/login`. This is why every workspace `page.tsx` re-checks `getUserAuthContext()` and redirects on null.
3. Otherwise renders `<WorkspaceShellClient>` and forwards `locale`, `isStaff = isAdminAccessRole(ctx.role)`, plus a fixed `headerRight` slot containing `<LogoutSection /> <LanguageSwitcher /> <ThemeToggle />`.

`WorkspaceShellClient` (`src/components/Layout/WorkspaceShellClient.tsx`, `"use client"`) is the actual shell — Mantine's `AppShell` with:

- A 56px `AppShell.Header` containing logo, admin badge (when `pathname.startsWith("/admin")`), four primary nav links (Dashboard / Projects / Issues / Admin — Admin is only rendered if `isStaff`), and a project switcher `<Select>` populated from `useProjectsList(locale)` (lines 71–123). Selecting a project navigates to `projectBoardPath(key)`.
- A mobile-only `AppShell.Navbar` with the same links plus the `headerRight` controls, gated on `breakpoint: "md"`.
- A `useDisclosure()` hook drives the burger toggle.
- `useState`/`useEffect` (`mounted`) guard hydration — the project switcher only renders post-mount, to avoid SSR/CSR mismatch on `pathname.match(...)`.

Inline styles dominate: nav link active/inactive states are computed via `pathname.startsWith(href)` and applied through `Text fw={...}` and inline `style={{ borderRadius: 4 }}`. There are no SCSS modules backing the workspace shell.

### 3.3 Page-level layouts

- **`PagesLayout`** (`src/components/Layout/PagesLayout.tsx`) — used by `/` (landing) and `/login`. Server Component. Has `variant: "centered" | "top"`. Renders `<PagesHeader>` (a thin client component that toggles a `headerScrolled` class once `window.scrollY > 100`) plus footer copy from `t("layout.footer")`. The header slots in `<AdminNavLink>`, `<SignInNavLink>`, `<LogoutSection>`, `<LanguageSwitcher>`, `<ThemeToggle>` — each of which renders or hides itself based on session/role. SCSS module: `PagesLayout.module.scss`.
- **`projects/[projectKey]/layout.tsx`** — Server Component that decodes `projectKey` and renders `<ProjectSubnav projectKey={key} />` above its children.
- **`admin/layout.tsx`** — Server Component that calls `requireRole(locale, AdminAccessRoles)` (redirects on failure), wraps in `WorkspaceRouteLayout`, then renders an admin-page chrome (`<Container><Paper><Stack><Title><AdminSubnav>...children...`).

### 3.4 Inconsistency in the layout cascade

`admin/layout.tsx` itself wraps in `<WorkspaceRouteLayout>` and adds the page-level `Container/Paper/Stack/Title/Subnav` chrome. The other three workspace layouts (`dashboard`, `issues`, `projects`) only set up the workspace shell and let each page render its own `Container/Paper`. This means **admin pages must not render their own `Container/Paper`**, while issues/projects/dashboard pages **must**. The convention is encoded by the layouts but not by types — easy to violate when adding a new admin page.

---

## 4. Server vs Client component boundary

### 4.1 Server-by-default

Every file under `src/app/[locale]/` is a Server Component **except** `error.tsx` files (`"use client"` is required by Next), and one specific co-located component: `src/app/[locale]/projects/[projectKey]/issues/ProjectIssuesHeaderActions.tsx` (`"use client"`).

The `"use client"` directive is the canonical marker. Verified locations (non-exhaustive):

- All files under `src/components/Layout/` that interact with state/DOM: `WorkspaceShellClient`, `LogoutForm`, `PagesHeader`, `SignInNavLinkButton`.
- All files under `src/components/Pages/LoginPage/`: `LoginPage` itself is a Server Component but mounts a client `LoginForm`.
- All `*` skeletons under `src/components/skeletons/` are marked `"use client"` even though they don't strictly need to be (Mantine's `Skeleton` has no client-only behaviour). This is consistent across all five skeleton files.
- All hooks under `src/features/*/hooks/`.
- All feature components under `src/features/*/components/` **except** `src/features/dashboard/components/DashboardOverview.tsx`, which is a Server Component.

### 4.2 Page → Client wiring patterns

Three patterns are used, all confirmable:

1. **Server Component fetches server data and passes it as props to a Client Component.** Example: `src/app/[locale]/dashboard/page.tsx` calls `getDashboardData(ctx.user.id)` and passes the result into `<DashboardOverview data={...} />` (which is itself a Server Component, not a Client one, in this case — see below).
2. **Server Component prefetches into a TanStack Query cache and hydrates a Client Component.** The `prefetch + HydrationBoundary` pattern, used by `src/app/[locale]/issues/[id]/page.tsx` and `src/app/[locale]/projects/[projectKey]/issues/[issueNumber]/page.tsx`. Both build a `new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } })`, call `prefetchIssueDetailPageQueries(...)` (`src/features/issues/prefetch-issue-queries.ts`), read the prefetched result via `queryClient.getQueryData<IssueWithStatus>(issueQueryKeys.detail(...))` to compute permissions, then dehydrate into `<HydrationBoundary state={dehydrate(queryClient)}>`. The Client Component (`IssueDetailPanel`) immediately re-runs the same `useQuery` and gets a synchronous cache hit.
3. **Server Component renders a Client Component which fetches its own data via TanStack Query.** The default for list pages: `src/app/[locale]/issues/page.tsx` → `<IssuesListPageClient ... />`, which calls `useIssuesList(locale, listParams)`. There is no prefetch on these pages — the client paints a `<IssuesTableSkeleton />` while the query is pending.

### 4.3 Notable boundary details

- **`DashboardOverview` is a Server Component** but is mounted under a Client provider tree (`QueryProvider`). It accepts a fully-resolved `DashboardData` object and a `locale: string`. It uses `getTranslations({ locale })` from `next-intl/server` rather than `useTranslations()` — consistent with its server-rendered nature. It internally calls a sub-component `<IssueRow>` which is also a Server Component.
- **The browser never instantiates a Supabase client today.** Every read and every write goes through Server Actions in `src/features/*/actions.ts`. This is structurally enforced because all hooks under `src/features/*/hooks/` import the action functions directly, not the Supabase browser client.
- **`src/features/*/service.ts` is conventionally server-only** but is *not* marked with `import "server-only"` (see repository-overview §16.10). Importing one of these modules from a client component would fail at build time because they transitively call `cookies()` from `next/headers`, but the marker is missing.
- **The login Server Action is inline** inside `src/components/Pages/LoginPage/LoginPage.tsx` (top of file, lines 20–49) using a function-scoped `"use server"` directive. Every other action in the codebase lives in a feature `actions.ts` with a top-of-file `"use server"`. This is the only file that mixes Server Component code and a Server Action in the same module.

---

## 5. Data fetching patterns

### 5.1 Default `QueryClient` configuration

Two near-identical clients exist; both set `staleTime: 60_000`:

- **Browser-side:** `src/components/Providers/QueryProvider.tsx` line 17. `ReactQueryDevtools` is mounted only when `process.env.NODE_ENV === "development"` (`buttonPosition="bottom-left"`).
- **Per-page (server) hydration clients:** instantiated in `src/app/[locale]/issues/[id]/page.tsx` (lines 40–46) and `src/app/[locale]/projects/[projectKey]/issues/[issueNumber]/page.tsx` (lines 65–71). Same `staleTime: 60_000`.

Per-hook overrides (all observed values):

- `useIssueStatuses`, `useAssigneeFilterOptions`, `useProjectByKey` → `staleTime: 60_000` (explicit).
- `useProjectsList`, `useProjectMembers` → `staleTime: 30_000`.
- All others rely on the default.

There is **no global `gcTime`, `retry`, or `refetchOnWindowFocus` override** — TanStack defaults apply (5 minutes gc, 3 retries, refetch on focus).

### 5.2 The Server Action call pattern

Every read-side hook follows the same skeleton (file: `src/features/issues/hooks/useIssuesList.ts`):

```1:22:src/features/issues/hooks/useIssuesList.ts
"use client";

import { useQuery } from "@tanstack/react-query";

import { listIssues } from "@/features/issues/actions";

import { IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";
import type { ListIssuesSchemaInput } from "../schemas";

export const useIssuesList = (locale: string, params: ListIssuesSchemaInput) =>
  useQuery({
    queryKey: issueQueryKeys.list(locale, params),
    queryFn: async () => {
      const result = await listIssues(locale, params);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
  });
```

The same skeleton appears in `useIssueDetail`, `useIssueStatuses`, `useAssigneeFilterOptions`, `useProjectsList`, `useProjectMembers`, `useProjectByKey`, `useAdminUsersList`, `useAdminAuditLogList`, `useIssueAuditActivity`. Every one of them throws `IssuesQueryError` on `{ ok: false }`. The class is defined in `src/features/issues/issues-query-error.ts` and re-used cross-feature (consumed by users, audit, projects, settings hooks — see §15.1).

### 5.3 Query keys

Each feature exports a `keys.ts` with a single object:

- `src/features/issues/keys.ts` → `issueQueryKeys` with `all | lists | list(locale, params) | details | detail(locale, id) | statuses(locale) | assigneeOptions(locale)`.
- `src/features/projects/keys.ts` → `projectQueryKeys` with `all | lists | list(locale) | detailByKey(locale, key) | members(locale, projectId) | memberProfiles(locale, projectId)`.
- `src/features/users/keys.ts` (referenced as `userAdminQueryKeys`).
- `src/features/audit/keys.ts` (`auditQueryKeys`, including `auditQueryKeys.issueActivity(locale, issueId)`).

Keys are nested arrays; invalidations use the parent prefix to wipe a sub-tree (`issueQueryKeys.lists()` invalidates every list variant). One **anti-pattern** appears: `useUpdateUserRole` invalidates the raw key `["issues"]` (`src/features/users/hooks/useUpdateUserRole.ts` line 25) instead of `issueQueryKeys.all`. Functionally identical, but bypasses the factory — easy to drift if the factory base changes.

### 5.4 Prefetch + hydrate (detail pages only)

`src/features/issues/prefetch-issue-queries.ts` is the only prefetch module. It:

1. Prefetches `issueQueryKeys.detail(locale, issueId)` via `getIssue(locale, { issueId })`.
2. Prefetches `issueQueryKeys.statuses(locale)` via `listIssueStatuses(locale)`.
3. Awaits both with `Promise.allSettled` (so a status-list failure does not abort the detail prefetch).
4. If `options.prefetchIssueAudit`, also prefetches `auditQueryKeys.issueActivity(locale, issueId)` with `entityType: "issue"`, `limit: 40`.

The file carries `import "server-only"` at the top — it cannot be imported from the client. The two issue-detail pages duplicate the call site (see repository-overview §16.6).

### 5.5 Cache invalidation surface

Inside mutation hooks: `queryClient.invalidateQueries({ queryKey: ... })` against the relevant feature key tree (`issueQueryKeys.lists()`, `issueQueryKeys.detail(...)`, `projectQueryKeys.all`, `userAdminQueryKeys.list(locale)`, etc.). Every issue-mutation hook (`useCreateIssue`, `useUpdateIssue`, `useTransitionIssueStatus`, `useAssignIssue`, `useSoftDeleteIssue`) **also** invalidates `projectQueryKeys.all` so the project switcher and dashboard counts refresh.

Inside Server Actions: `revalidatePath(localizedPath(locale, route), "page" | "layout")` and `revalidateTag(ISSUES_CACHE_TAG, "max")`. The tag is currently inert (no producer; see repository-overview §16.9).

---

## 6. State management

There is **no Redux/Zustand/Jotai/Context store**. Application state is partitioned between four sources, in this order of preference:

1. **Server state** — every domain entity (issues, statuses, projects, users, audit) lives in TanStack Query caches keyed by feature query keys.
2. **URL state** — only the issues list. `src/features/issues/list-url-params.ts` exports `parseIssuesListParams(URLSearchParams)`, `issuesListParamsToSearchParams(params)`, and `patchIssuesListParams(base, patch)`. Recognised search params: `page`, `perPage`, `status`, `assignee`, `project`, `q`, `closed`, `sort`. Sort encodes as `field.direction` (e.g. `title.asc`); only known fields and dirs are accepted, otherwise it falls back to `created_at.desc`. The helper **throws** if asked to serialize cursor-mode params (see repository-overview §16.7).
3. **localStorage** — used in exactly two places, both client-only:
   - **Issue table column visibility:** `COLUMN_STORAGE_KEY = "ops-issues-table-columns-v1"` in `src/features/issues/components/IssuesListPageClient.tsx` (lines 38, 56–65, 152–162). Wraps reads/writes in try/catch to tolerate quota/private-mode errors.
   - **Mantine colour scheme:** `localStorage.getItem('mantine-color-scheme-value')` consumed by the inline pre-hydration script in `src/app/[locale]/layout.tsx` line 85.
4. **Component-local `useState`** — everything else: form drafts, modal opened flags, dropdown selections, debounced text, etc.

Mantine `useDisclosure` is the conventional helper for boolean toggles (used in `WorkspaceShellClient`, `IssueDetailPanel`, `ProjectBoardPageClient`, `CreateIssueModal`). `useDebouncedValue` from `@mantine/hooks` wraps two text inputs: the issues table search (`IssuesListPageClient` line 132, 300ms) and the audit action filter (`AdminAuditLogPanel` line 36, 350ms).

---

## 7. Table systems

Two distinct table implementations coexist:

### 7.1 `IssuesVirtualizedTable` (TanStack Table v8 + Virtual)

File: `src/features/issues/components/IssuesVirtualizedTable.tsx`. The only virtualized table.

- Constants: `VIRTUAL_ROW_HEIGHT = 48`, `VIRTUAL_THRESHOLD = 40`, `VIRTUAL_VIEWPORT_HEIGHT = 480`.
- Uses `useReactTable({ data, columns, state: { sorting, columnVisibility }, manualSorting: true, getCoreRowModel: getCoreRowModel() })`. Sorting is *manual* — `onSortingChange` decodes the next sort and calls back into the parent (`onSortChange`), which patches URL params via `patchIssuesListParams`.
- Virtualisation is conditional: `useVirtual = rows.length >= VIRTUAL_THRESHOLD`. Below 40 rows the table renders all rows directly; at or above 40 it uses `useVirtualizer` with `overscan: 12` and absolutely-positioned `Table.Tr` elements.
- Five columns, four sortable: `title`, `status`, `created_at`, `updated_at`, `assignee`. The `assignee` column has `enableSorting: false` and renders either a Mantine `<Select>` (when `canAssignIssues && onAssignIssue`) or a plain `<Text>` fallback. Soft-deleted rows render at `opacity: 0.5`.
- The column-toggle UI lives in the parent (`IssuesListPageClient`), not inside the table itself.
- The headers are made sortable via a `sortableHeader(...)` helper that returns a `<UnstyledButton aria-sort={...}>` cycling through asc/desc/asc on click. New sort defaults: `title` asc, every other column desc.

Rendering shell: a `<Table.ScrollContainer minWidth={720} type="native">` wrapping the Mantine `<Table>`. When virtualised, an inner `<Box ref={scrollRef} mah={VIRTUAL_VIEWPORT_HEIGHT} style={{ overflow: "auto" }}>` provides the scrolling viewport with a sticky `<Table.Thead>`.

There is one explicit ESLint suppression: `// eslint-disable-next-line react-hooks/incompatible-library -- useReactTable API` (line 264). This is the only `useReactTable` call in the codebase.

### 7.2 Plain Mantine `<Table>` everywhere else

Used by:

- `src/features/users/components/AdminUsersPanel.tsx` — three columns, no sort, role select inline.
- `src/features/projects/components/ProjectsListPageClient.tsx` — three columns, link to board / settings.
- `src/features/projects/components/ProjectSettingsPageClient.tsx` — members table.
- `src/features/issues/components/AdminIssueStatusesPanel.tsx` — statuses with edit/delete actions.
- `src/features/audit/components/AdminAuditLogPanel.tsx` — six columns, offset pagination.
- `src/features/audit/components/IssueAuditActivitySection.tsx` — four columns, embedded in issue detail.
- `src/features/settings/components/SuperAdminSettingsPanel.tsx` — flag KV table.

All of these wrap with `<Table.ScrollContainer minWidth={...}>` and use `striped highlightOnHover`. Pagination, when present, is page-based with `useState<number>` (`AdminAuditLogPanel`).

### 7.3 Pagination

- **Issues list** (`IssuesListPageClient`): URL-driven offset pagination via `?page=` and `?perPage=` (allowed values: 20, 50, 100). Prev/Next buttons call `replaceListUrl(patchIssuesListParams(...))`. The component reads `data.pagination.hasMore` to disable the Next button. Mode is hard-coded to `"offset"`; the cursor branch in `listIssuesSchema` is unreachable from the URL-sync path.
- **Audit log** (`AdminAuditLogPanel`): local `useState` with a hard-coded `LIMIT = 25`. Effects reset `page` whenever a filter changes (line 42–44).
- All other tables show every row returned (no client-side pagination, no virtualisation).

---

## 8. Forms architecture

Two patterns are used, sometimes within the same feature:

### 8.1 `@mantine/form` (`useForm`)

Used in:

- `src/features/issues/components/CreateIssueModal.tsx` — full schema-equivalent validation defined inline (`title`, `status_id`, `description` with cross-field rule for tasks).
- `src/features/issues/components/AdminIssueStatusesPanel.tsx` — two separate `useForm` hooks (one for create, one for edit), both with `name`/`slug` validators that cross-reference translation keys.
- `src/features/projects/components/ProjectsListPageClient.tsx` — three-field create-project form (`key`, `name`, `description`).

These forms wire fields with `{...getInputProps("name")}` and submit via `handleFormSubmit(onSubmit)`. Submit handlers call the relevant Server Action through a TanStack mutation hook (when one exists) or directly (`createProject` is invoked directly by `ProjectsListPageClient.onCreate`, line 71–97 — this is the single mutation that does **not** go through `useMutation`).

### 8.2 Plain `useState` drafts

Used in:

- `src/features/issues/components/IssueDetailPanel.tsx` — `titleDraft` / `descDraft` `useState` strings, manually synchronized on `data` change via `useEffect` (lines 88–98). A `dirty` flag computes manually whether to enable the save button. Submit calls `updateIssue(patch, { onSuccess: () => setIsEditing(false) })`.
- `src/features/projects/components/ProjectSettingsPageClient.tsx` — `addUserId`, `newName`, `busy`, `renaming` flags with bare event handlers; no form library. `onAdd` / `onRemove` / `onRename` directly `await` the action and surface results via `notifications.show(...)`.
- `src/features/audit/components/AdminAuditLogPanel.tsx` — five filter fields, all `useState`.
- `src/components/Pages/LoginPage/LoginForm.tsx` — uses an uncontrolled `<form ref>` and `new FormData(formRef.current!)` (i.e. native form submission posted to a Server Action via JS to inject the reCAPTCHA token first).

### 8.3 Validation strategy

There are **two** validation layers and they don't share schemas:

1. **Server (authoritative):** Zod schemas in `src/features/<feature>/schemas.ts`. Messages are translation keys (e.g. `"validation.titleRequired"`). On `safeParse` failure, the action returns `{ ok: false, errorKey: "errors.validation", fieldErrors: zodToFieldErrors(parsed.error) }` (see `src/features/issues/actions.ts` lines 81–85 and `src/features/issues/map-errors.ts`).
2. **Client (UX):** `useForm.validate` with **inline functions** that re-derive similar rules and pull the **translated message** out of `useTranslations()`. Example in `CreateIssueModal`:

```75:84:src/features/issues/components/CreateIssueModal.tsx
validate: {
      title: (v) => (!v.trim() ? t("issues.create.titleRequired") : null),
      status_id: (v) => (!v ? t("issues.create.statusRequired") : null),
      description: (v, allValues) => {
        if (isIssueTask(allValues.issue_type) && !v.trim()) {
          return t("issues.create.descriptionRequired");
        }
        return null;
      },
    },
```

This is an **architectural inconsistency**: the client validators duplicate a *subset* of the server's Zod rules, expressed as different translation keys (`issues.create.titleRequired` vs `validation.titleRequired`). Drift is possible — no shared source of truth for validation rules between client and server.

The server's `errorKey` returned in `fieldErrors` is **not** displayed inline next to fields anywhere today. Instead, all form errors that come back from the Server Action are surfaced as Mantine notifications via the mutation's `onError` (e.g. `useCreateIssue` line 37–46) or as a `<Text c="red">` block that translates the top-level `errorKey` (e.g. `AdminIssueStatusesPanel` lines 276–280). `fieldErrors` is preserved on `IssuesQueryError` (`src/features/issues/issues-query-error.ts` line 4) but no consumer surfaces them per-field.

---

## 9. Modal / dialog patterns

`@mantine/modals` is installed but not imported anywhere — every modal is a direct `<Modal>` from `@mantine/core`. Confirmed by grep: no `modals.openConfirmModal` / `ModalsProvider` anywhere.

The recurring pattern is:

```tsx
const [opened, { open, close }] = useDisclosure(false);
// or
const [opened, setOpened] = useState(false);
// or, for "confirm and act on a specific row":
const [target, setTarget] = useState<Row | null>(null);
const opened = target !== null;
```

Examples:

- `useDisclosure` — `IssueDetailPanel` (close-issue confirmation), `ProjectBoardPageClient` (create-issue modal).
- Plain `useState` boolean — `ProjectIssuesHeaderActions`, `SuperAdminSettingsPanel.confirmOpen`.
- Selection-based — `AdminIssueStatusesPanel.editing` and `.deleting` (the modal is open iff a row is selected).
- Closing-an-issue from the board — `ProjectBoardPageClient.issueToClose: string | null` (the kanban menu sets the issue id, the modal opens, on confirm the soft-delete mutation fires).

Common conventions:

- Confirm dialogs render `<Stack gap="md"><Text>...body...</Text><Group justify="flex-end"><Button variant="subtle">cancel</Button><Button color="red" loading={pending}>confirm</Button></Group></Stack>`.
- Forms inside a modal wrap in a native `<form onSubmit={handleSubmit(...)}>`.
- A `<LoadingOverlay visible={pending} blur={1} />` is sometimes layered inside a modal `<Box pos="relative">` (e.g. `CreateIssueModal` line 147–154). This is the only modal that does that.
- `closeOnClickOutside={!pending}` and `closeOnEscape={!pending}` are set by `CreateIssueModal` to prevent accidental dismissal during a server roundtrip; no other modal uses this guard.
- `comboboxProps={{ withinPortal: true }}` is required for any `<Select>` rendered inside a `<Modal>` so the dropdown isn't clipped by the modal's stacking context. Used in `CreateIssueModal`, `ProjectSettingsPageClient`.

---

## 10. Permissions rendering strategy

Authorization happens in three places and the **frontend mirrors a subset** of what the backend enforces.

### 10.1 Server-side gates (page-level)

- `getUserAuthContext()` in every workspace page; redirect to `/login` on null.
- `requireRole(locale, AdminAccessRoles)` in `admin/layout.tsx`; redirects to `/dashboard` on wrong role.
- `requireRole(locale, SuperAdminRoles)` in `admin/settings/page.tsx`.

These gates short-circuit the page render before any client code loads.

### 10.2 Server-computed flags passed as props

The two issue-detail pages compute permission booleans once (server-side, after the prefetch) and forward them to `IssueDetailPanel`:

```56:75:src/app/[locale]/issues/[id]/page.tsx
const issue = queryClient.getQueryData<IssueWithStatus>(
    issueQueryKeys.detail(locale, id),
  );
  const canTransitionStatus =
    issue != null ? canUserTransitionIssueStatus(ctx, issue) : false;
  const canAssignIssue = isAdminAccessRole(ctx.role);
  const canEditDetails =
    issue != null ? canEditIssueDetails(ctx, issue) : false;

  return (
    <Container size="md" py="xl">
      <Paper withBorder p="lg" radius="md">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <IssueDetailPanel
            locale={locale}
            issueId={id}
            canTransitionStatus={canTransitionStatus}
            canAssignIssue={canAssignIssue}
            canEditDetails={canEditDetails}
            canViewIssueAudit={canViewIssueAudit}
            isAdmin={isAdminAccessRole(ctx.role)}
          />
```

The helpers (`canUserTransitionIssueStatus`, `canEditIssueDetails`) live in `src/features/issues/permissions.ts` and explicitly mirror the issues RLS rule (admin/super_admin can do anything; `user` can only act if they are reporter or assignee). The detail page does not re-verify on every keystroke — the permission booleans are baked in at SSR time, which means a client-side issue mutation will still be authoritatively rejected by the server if RLS disagrees.

### 10.3 Client-side conditional rendering

`IssueDetailPanel` and `ProjectBoardPageClient` consume the booleans as props (`canTransitionStatus`, `canAssignIssue`, `canEditDetails`, `canViewIssueAudit`, `isAdmin`) and choose between **edit** and **read-only** rendering branches:

- A `<Select>` for status / assignee when allowed; a `<Text c="dimmed">` with the current value plus a "read-only hint" otherwise.
- The pencil-icon "edit details" button is only rendered if `canEditDetails`.
- The "Close issue" button is only rendered if `isAdmin`.
- The audit activity section is only mounted if `canViewIssueAudit` (admin/super-admin).

`ProjectsListPageClient` uses a simpler client-derived flag: `canManage = isAdminAccessRole(userRole)` is computed once from the role prop forwarded by the page (line 49), and gates the "New project" button and "Settings" icon.

`AdminUsersPanel` has its own row-level rule mirroring RLS: an admin (non-super) can only edit rows whose current role is `user`. See `canEditUserRow` (lines 19–25). Super-admin sees an extra `super_admin` option in the role select.

The board uses `useIssueMenu(...)` to compute a per-card kebab menu: "Move to next status", "Move to previous status", and (admin only) "Close issue". The hook refuses to add any item when the conditions aren't met (`src/features/issues/hooks/useIssueMenu.ts`).

### 10.4 Inconsistency

Permission props are computed *only* in the issue-detail pages; for the projects board, `isAdmin` is forwarded but the underlying transition mutation is invoked unconditionally on drag-end (line 264–271 of `ProjectBoardPageClient`). A non-admin user attempting to drag would have the action rejected by the server (RLS / `assertRole` in the relevant action). The UI does not visually disable dragging.

---

## 11. Navigation architecture

### 11.1 next-intl re-exports are mandatory

`src/i18n/navigation.ts`:

```1:7:src/i18n/navigation.ts
import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

Imports of `Link`, `redirect`, `usePathname`, `useRouter` from `next/link` or `next/navigation` are forbidden. Verified: no such imports exist outside `src/components/Pages/LandingPage.tsx` (which uses `next/link`'s default — actually it uses the next-intl `Link` via re-export; the only `next/link` reference is the import in `LandingPage.tsx`'s rendered `<Image>`, which uses `next/image` not `next/link`).

Two Next-only navigation symbols are used directly because next-intl doesn't re-export them:

- `notFound` from `next/navigation` — used by `[locale]/layout.tsx` and the four pages that resolve a project key (`projects/[projectKey]/...`) to short-circuit on missing data.
- `useSearchParams` from `next/navigation` — used by `IssuesListPageClient.tsx` to read URL filters.

These are acceptable variances; they don't manipulate the locale prefix.

### 11.2 Path helpers

`src/lib/routes.ts` exports:

- A frozen `routes` object with all top-level paths (`home`, `login`, `dashboard`, `issues`, `projects`, `admin`, `adminUsers`, `adminStatuses`, `adminSettings`, `adminAudit`).
- `issueDetailPath(issueId)` → `/issues/<id>`.
- `projectBoardPath(projectKey)` → `/projects/<encoded>/board`.
- `projectIssuesPath(projectKey)` → `/projects/<encoded>/issues`.
- `projectIssueDetailPath(projectKey, issueNumber)` → `/projects/<encoded>/issues/<n>`.
- `projectSettingsPath(projectKey)` → `/projects/<encoded>/settings`.

All `projectKey` arguments are passed through `encodeURIComponent`. The reverse — `decodeURIComponent(projectKey)` — appears in every page and layout that consumes the dynamic segment.

`src/i18n/localized-path.ts` exports `localizedPath(locale, pathname)`. Used **only on the server side** for `revalidatePath` calls and email URL construction; client-side navigation uses next-intl's `Link`/`redirect` which handle the prefix automatically.

### 11.3 Subnav components

Two co-existing subnavs:

- **`AdminSubnav`** (`src/features/admin/components/AdminSubnav.tsx`) — horizontal text tabs with an underline border; uses `pathname.startsWith(...)` for active state. Hides the Settings tab unless `showSuperSettings` (resolved server-side in `admin/layout.tsx` from `isSuperAdminRole(role)`).
- **`ProjectSubnav`** (`src/features/projects/components/ProjectSubnav.tsx`) — three icon buttons (board / issues / settings) with hand-rolled `box-shadow: 0 0 6px 1px color-mix(in srgb, var(--mantine-color-blue-5) 60%, transparent)` on the active icon. The `isBoard` flag is computed by elimination (`!isSettings && !isIssues`), so the board button stays "active" for any path under `/projects/[key]/` that isn't issues or settings.

Both use `usePathname()` from `@/i18n/navigation` and `Link` for navigation.

### 11.4 Language switcher

`src/components/LanguageSwitcher/LanguageSwitcher.tsx` (`"use client"`). Uses Mantine `Menu` with `<ReactCountryFlag>` from `react-country-flag` (the only third-party UI dep besides Mantine, Tabler, dnd-kit, and TanStack). Calls `router.replace(pathname, { locale: value })` inside `useTransition` so the navigation runs as a non-blocking transition.

`LOCALE_TO_COUNTRY` maps `en → GB`, `si → SI`, `de → DE`. There is no metadata-driven locale list — locales are read from `routing.locales`.

### 11.5 Theme toggle

`src/components/Theme/ThemeToggle.tsx` (`"use client"`). Uses Mantine's `useMantineColorScheme()` and `useComputedColorScheme("light")`. The `mounted` guard ensures the icon only switches post-hydration to avoid SSR mismatch (the pre-hydration script in `[locale]/layout.tsx` writes `data-mantine-color-scheme` synchronously, but the React tree doesn't know the resolved value until `useEffect` runs).

---

## 12. Reusable component patterns

### 12.1 Cross-feature UI under `src/components/`

| Path | Purpose |
|---|---|
| `src/components/Layout/PagesLayout.tsx` | Top-of-funnel layout for landing + login; centred or top-aligned variant. |
| `src/components/Layout/PagesHeader.tsx` | Sticky header for `PagesLayout` with scroll-based shadow. |
| `src/components/Layout/WorkspaceRouteLayout.tsx` | Server-side workspace shell wrapper; resolves auth context. |
| `src/components/Layout/WorkspaceShellClient.tsx` | Mantine `AppShell` + nav + project switcher. |
| `src/components/Layout/AdminNavLink.tsx` | Conditional admin link — server component, hides if not staff. |
| `src/components/Layout/SignInNavLink.tsx` / `SignInNavLinkButton.tsx` | "Sign in" button on landing — hidden when authenticated or already on `/login`. |
| `src/components/Layout/LogoutSection.tsx` / `LogoutForm.tsx` | Sign-out button. The form posts a bound Server Action (`signOutAction.bind(null, locale)`). |
| `src/components/Pages/LandingPage.tsx` (+ module SCSS) | Landing page with hero glow, six feature cards. Uses `Typography` component (only consumer). |
| `src/components/Pages/LoginPage/` | Server `LoginPage` + client `LoginForm`. |
| `src/components/Pages/DisabledCtaButton.tsx` | Demo-CTA stub — applies `data-disabled` and prevents default click. |
| `src/components/Providers/QueryProvider.tsx` | TanStack Query provider with devtools (dev only). |
| `src/components/Providers/AppNotifications.tsx` | Singleton Notifications host. |
| `src/components/Theme/ThemeToggle.tsx` | Light/dark icon button. |
| `src/components/LanguageSwitcher/LanguageSwitcher.tsx` | Country-flag locale picker. |
| `src/components/Navigation/IntlLinkAnchor.tsx` | `<Anchor component={Link} ...>` adapter. Used by `AdminNavLink` and `DashboardOverview`. |
| `src/components/Typography/Typography.tsx` | Design-system typography wrapper. **Used only by `LandingPage`.** |
| `src/components/RouteLoading.tsx` | Centred Mantine `Loader`; `compact` mode for inline use. |
| `src/components/RouteSegmentError.tsx` | `Alert` + retry button used by every route segment `error.tsx`. |
| `src/components/skeletons/*.tsx` | Five page skeletons: `DashboardSkeleton`, `IssueDetailSkeleton`, `IssuesTableSkeleton`, `ProjectBoardSkeleton`, `TableSkeleton`. |

### 12.2 Per-feature reusable building blocks

- `src/features/issues/components/IssueCardMenu.tsx` — generic kebab-menu renderer for `IssueMenuItem[]` (uses Mantine `Menu` with `withinPortal`). Stops pointer/click propagation so it doesn't trigger a drag on the kanban card.
- `src/features/issues/hooks/useIssueMenu.ts` — derives the kebab-menu items list from issue + statuses + admin flag.
- `src/features/audit/auditUtils.ts` — `auditActionKey`, `auditActionColor`, `auditMetadataPreview`. Three pure helpers consumed by `IssueAuditActivitySection` and `AdminAuditLogPanel`.
- `src/features/audit/hooks/useAuditTranslations.ts` — translates audit `action` and `entityType` strings, falling back to the raw value when `t(...)` throws (consistent with the architecture rule that the audit UI silently degrades on missing translations).
- `src/features/issues/issueTypeUtils.ts` — `IssueTypes`, `isIssueBug`, `isIssueTask`. Always used to compare type values; never compare the raw string.

### 12.3 Anti-patterns and inconsistencies in component reuse

1. **`Typography` is dead code outside `LandingPage`.** It accepts `TypographyType` keys (`heading-01`, `body-01`, `caption-02`, …) and casts string `size` props with `as any`. No other file imports it.
2. **Inline `<div style={{...}}>` is used heavily where Mantine alternatives exist.** Examples in `ProjectBoardPageClient` (board cards/columns), `AdminSubnav` (tab styling), `ProjectSubnav` (active glow). This is mixed inconsistently with Mantine layout primitives (`Group`, `Stack`, `Box`).
3. **Two ways to express conditional translation lookups for cross-feature errors.** `ProjectsListPageClient` uses `result.errorKey.startsWith("projects.errors.")` (line 80–82); `AdminAuditLogPanel` uses `key.startsWith("audit.")` (line 83–85); `SuperAdminSettingsPanel` uses `key.startsWith("settings.")` (line 49–51); `ProjectSettingsPageClient` uses `key.startsWith("projects.")` (line 45–47). Each panel has its own ad-hoc prefix sniffer because there is no central error-translation utility.
4. **Skeleton placement varies.** Some pages render the skeleton inside a `Container` (e.g. `dashboard/loading.tsx` uses `size="sm"` while the `dashboard/page.tsx` uses `size="lg"` — content shifts width during the load). Others wrap in a feature-specific skeleton (`IssuesTableSkeleton`) or directly in a `Paper` (`ProjectsLoading`). There is no enforced one-to-one match between a page's container size and its loading skeleton's container size.

---

## 13. Loading and error handling patterns

### 13.1 `loading.tsx` segments

Every workspace segment ships a `loading.tsx`:

- `src/app/[locale]/loading.tsx` → `<RouteLoading />` (centred Mantine `Loader`).
- `src/app/[locale]/login/loading.tsx` → same.
- `src/app/[locale]/admin/loading.tsx` → same.
- `src/app/[locale]/dashboard/loading.tsx` → `<Container size="sm"><DashboardSkeleton /></Container>`.
- `src/app/[locale]/issues/loading.tsx` → `<Container size="xl"><IssuesTableSkeleton /></Container>`.
- `src/app/[locale]/issues/[id]/loading.tsx` → `<Container size="md"><IssueDetailSkeleton /></Container>`.
- `src/app/[locale]/projects/loading.tsx` → bespoke inline `<Skeleton>` blocks (no `*Skeleton` component).
- `src/app/[locale]/projects/[projectKey]/board/loading.tsx` → `<ProjectBoardSkeleton />`.
- `src/app/[locale]/projects/[projectKey]/issues/loading.tsx` → `<IssuesTableSkeleton />`.
- `src/app/[locale]/projects/[projectKey]/issues/[issueNumber]/loading.tsx` → `<IssueDetailSkeleton />`.
- `src/app/[locale]/projects/[projectKey]/settings/loading.tsx` → bespoke inline `<Skeleton>`.

All five `*Skeleton.tsx` components carry `aria-busy="true"` and `aria-live="polite"`. `RouteLoading` does the same.

### 13.2 `error.tsx` segments

Three exist: `[locale]/error.tsx`, `[locale]/dashboard/error.tsx`, `[locale]/issues/error.tsx`, `[locale]/issues/[id]/error.tsx`, `[locale]/admin/error.tsx`. Each is a one-line `"use client"` wrapper around `RouteSegmentError`:

```1:14:src/app/[locale]/error.tsx
"use client";

import RouteSegmentError from "@/components/RouteSegmentError";

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const LocaleSegmentError = (props: LocaleErrorProps) => (
  <RouteSegmentError {...props} />
);

export default LocaleSegmentError;
```

`RouteSegmentError` (`src/components/RouteSegmentError.tsx`) renders a Mantine `<Alert color="red">` plus a Retry `<Button onClick={reset}>`, logs `error` to `console.error` in a `useEffect`, and uses `t("common.route.errorTitle")` / `t("common.route.errorDescription")` / `t("common.route.tryAgain")` for copy.

`/projects` does **not** have an `error.tsx` file — errors there bubble up to `[locale]/error.tsx`. There is no global-error boundary at `app/global-error.tsx`.

### 13.3 In-page error rendering

When a client-side query fails (e.g. `useIssuesList` rejects), the consumer component:

1. Reads `isError`/`error` from the `useQuery` result.
2. Checks `isIssuesQueryError(error)` to extract the `errorKey`.
3. Renders an inline `<Text c="red">` with the translated key.

There is no toast / global error display for query failures — only mutations surface notifications. The strings are translated through a feature-specific prefix (see §12.3 #3).

### 13.4 In-page loading rendering

`isPending` from `useQuery` triggers either a `<TableSkeleton>` (admin tables, audit, project members) or a feature-specific skeleton (issues list shows `<IssuesTableSkeleton />`). For inline mutations, `<LoadingOverlay visible={pending} blur={1} />` is layered over the relevant region (`IssueDetailPanel` line 256–263, `CreateIssueModal` line 147–154, `ProjectBoardPageClient` line 309–318). The `loaderProps={{ "aria-label": t("issues.loading") }}` is consistently set for accessibility.

For page-level navigations, `next/dynamic` with `{ loading: () => <RouteLoading compact /> }` is used in three admin pages: `admin/users/page.tsx`, `admin/statuses/page.tsx`, `admin/audit/page.tsx`, `admin/settings/page.tsx`. These lazy-load their feature panels. None of the issues / projects / dashboard pages use `next/dynamic`.

### 13.5 Notifications

`@mantine/notifications` is the only toast surface. Convention:

- `notifications.show({ title, message, color })`.
- `color: "green"` for success, `color: "red"` for failure.
- Title and message are translation keys (some title-only notifications pass `message: ""`).
- Failures inside mutation `onError` resolve the message via `isIssuesQueryError(err) ? err.errorKey : "errors.<feature>Failed"` then translate inside `t("issues.<key>" as Parameters<typeof t>[0])`.

---

## 14. Optimistic update patterns

Three issue-mutation hooks implement true optimistic updates with rollback:

| Hook | `onMutate` patches | `onError` rolls back |
|---|---|---|
| `useUpdateIssue` (`src/features/issues/hooks/useUpdateIssue.ts`) | `issueQueryKeys.detail(locale, issueId)` (title / description / type spread) | yes (restores `previous`) |
| `useTransitionIssueStatus` (`src/features/issues/hooks/useTransitionIssueStatus.ts`) | detail cache (`status_id` + embedded `issue_statuses` looked up from the cached statuses list via `resolveStatusRow`) | yes |
| `useAssignIssue` (`src/features/issues/hooks/useAssignIssue.ts`) | detail cache (`assignee_id` + embedded `assignee` looked up from `issueQueryKeys.assigneeOptions(locale)`) | yes |

Pattern (verbatim from `useUpdateIssue`):

```34:52:src/features/issues/hooks/useUpdateIssue.ts
onMutate: async (input) => {
      const detailKey = issueQueryKeys.detail(locale, issueId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<IssueWithStatus>(detailKey);
      queryClient.setQueryData<IssueWithStatus>(detailKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.issue_type !== undefined
            ? { issue_type: input.issue_type }
            : {}),
        };
      });
      return { previous } as { previous: IssueWithStatus | undefined };
    },
```

Notable consequences:

- **Only the detail cache is patched optimistically.** The list caches receive only invalidation (in `onSuccess`), so the corresponding row in the issues list briefly shows stale data until the refetch lands. This is documented in repository-overview §16.15.
- **`useSoftDeleteIssue` and `useCreateIssue` do not implement optimistic updates.** They invalidate after the server confirms.
- **The board's transition mutation** (`ProjectBoardPageClient` line 232–259) uses an inline `useMutation`, **not** the shared `useTransitionIssueStatus` hook, and therefore has **no** optimistic update — a status drag refreshes the entire board only after the server confirms. This is an architectural inconsistency; the same backing action is wrapped twice with different ergonomics.

---

## 15. Realtime UI updates

**There is no realtime UI update path in the application code today.** The single source of staleness invalidation is TanStack Query (`invalidateQueries`) plus `revalidatePath` / `revalidateTag` from Server Actions.

Confirmed:

- No `supabase.channel(...)` or `supabase.realtime` references anywhere in `src/`.
- No `EventSource` / `WebSocket` instantiations.
- No Server-Sent Events route handler.
- No SWR-style polling — every `useQuery` relies on TanStack defaults (refetch on focus / mount / reconnect, no interval).

The CSP in `next.config.ts` allows `wss://*.supabase.co`, and `docs/ARCHITECTURE.md` mentions realtime as a possible future addition, but the frontend has no consumers today (mirrors repository-overview §11). Treat any "realtime" claim about this app as forward-looking.

The closest substitute today is **manual refetch on user action**: when a user moves an issue on the kanban, the mutation invalidates `issueQueryKeys.lists()` and `projectQueryKeys.all`, so any other open tab will see the new state on its next focus event (which triggers `refetchOnWindowFocus` by default).

---

## 16. Styling system

### 16.1 Three styling layers

1. **Mantine v8 components and tokens.** The default. Components consume `<Container>`, `<Paper>`, `<Stack>`, `<Group>`, `<SimpleGrid>`, `<Title>`, `<Text>`, `<Button>`, `<TextInput>`, `<Select>`, `<Modal>`, `<Table>`, `<Tooltip>`, `<Badge>`, `<Loader>`, `<LoadingOverlay>`, `<Skeleton>`, `<ActionIcon>`, `<Switch>`, `<SegmentedControl>`, `<Divider>`, `<Anchor>`, `<NumberInput>`, `<Textarea>`, `<PasswordInput>`, `<Checkbox>`, `<Menu>`, `<UnstyledButton>`, `<Box>`, `<Alert>`, `<ThemeIcon>`. Theme tokens used directly: `var(--mantine-color-body)`, `var(--mantine-color-default-border)`, `var(--mantine-color-blue-filled)`, `var(--mantine-color-blue-6)`, `var(--mantine-color-red-6)`, `var(--mantine-color-text)`, `var(--mantine-color-dimmed)`, `var(--mantine-spacing-md)`, etc.
2. **SCSS Modules.** Three files only:
   - `src/components/Layout/PagesLayout.module.scss`
   - `src/components/Pages/LandingPage.module.scss`
   - `src/components/Pages/LoginPage/LoginPage.module.scss`
   Each is colocated with its component. They consume tokens/mixins from `src/styles/`.
3. **Inline styles.** Used pervasively for one-off layout details and CSS-variable reads (active border colours, glow shadows, board column backgrounds, virtualised row absolute positioning). Examples: `WorkspaceShellClient` line 99–106, `AdminSubnav` line 22–43, `ProjectSubnav` line 44–66, `ProjectBoardPageClient` line 87–177.

### 16.2 Tokens, mixins, and globals

- `src/styles/theme.scss` — Sass variables and a public `:root { --color-primary: ...; --background-01: ...; ... }` block. Defines a `$breakpoints` map (xs/sm/md/lg/xl/2xl) and the `--hero-glow-gradient` light variant.
- `src/styles/mixins.scss` — `mq($breakpoint)`, `gradient-text`, `fadeInScale`, `soft-glow`, `flex-center`, `truncate`. Used only in `LandingPage.module.scss` and `LoginPage.module.scss`.
- `src/app/globals.scss` — `@use "../styles/theme.scss"`, normalises body/html, a CSS rule that swaps logo SVG visibility based on `[data-mantine-color-scheme]`, defines `--ops-board-column-bg` per scheme, overrides `--hero-glow-gradient` for dark mode, and hides the reCAPTCHA badge globally with `.grecaptcha-badge { visibility: hidden !important; }`.

### 16.3 Inconsistencies

- **Sass alias works through `next.config.ts` `sassOptions.importers`** but only the three SCSS modules use the alias (`@use "@/styles/mixins" as *;`). All other styling in the repo lives in TS/TSX files via Mantine props or inline styles.
- **Duplicate breakpoint systems.** `src/styles/theme.scss` defines its own breakpoints (`xs: 480px, sm: 600px, md: 768px, lg: 960px, xl: 1200px`). Mantine v8 has its own (separately configured). Components using the Mantine responsive prop syntax (`p={{ base: "sm", sm: "lg" }}`) use Mantine's breakpoints; the three SCSS modules using `@include mq("sm")` use the theme's. They do **not** match.
- **Some custom CSS variables overlap with Mantine ones.** E.g. `--background-01` (custom) vs `--mantine-color-body` (Mantine). The codebase mixes both in `globals.scss` and component files.

---

## 17. Shared hooks

### 17.1 Cross-feature client hooks

There are **none** under `src/components/` or `src/utils/`. Per the architecture rule, hooks live in `src/features/<feature>/hooks/`. The only "shared" hooks are the ones every feature reaches into:

- `useTranslations()` from `next-intl` — used in nearly every client component.
- `useDisclosure`, `useDebouncedValue` from `@mantine/hooks`.
- `useMantineColorScheme`, `useComputedColorScheme` from `@mantine/core` (used only by `ThemeToggle`).
- `useQuery`, `useMutation`, `useQueryClient`, `useInfiniteQuery` (not used today) from `@tanstack/react-query`.
- `useDraggable`, `useDroppable`, `useSensor`, `useSensors` from `@dnd-kit/core` (only in `ProjectBoardPageClient`).
- `useReactTable` from `@tanstack/react-table` (only in `IssuesVirtualizedTable`).
- `useVirtualizer` from `@tanstack/react-virtual` (only in `IssuesVirtualizedTable`).

### 17.2 Per-feature hooks

| Feature | Hooks |
|---|---|
| issues | `useIssuesList`, `useIssueDetail`, `useIssueStatuses`, `useAssigneeFilterOptions`, `useCreateIssue`, `useUpdateIssue`, `useTransitionIssueStatus`, `useAssignIssue`, `useSoftDeleteIssue`, `useIssueMenu` |
| projects | `useProjectsList`, `useProjectByKey`, `useProjectMembers` |
| users | `useAdminUsersList`, `useUpdateUserRole` |
| audit | `useAdminAuditLogList`, `useIssueAuditActivity`, `useAuditTranslations` |
| settings | `useResetDemoData` |

Naming convention: every hook file exports exactly one hook with a matching name. Read hooks return the `useQuery` result directly; mutation hooks return the `useMutation` result with bound `onSuccess` invalidation logic and `onError` notification logic.

### 17.3 Anti-patterns

- `useAssigneeFilterOptions(locale, enabled, projectId?)` is the only hook that conditionally extends its query key (`projectId ? [...assigneeOptions(locale), projectId] : assigneeOptions(locale)`). The factory in `keys.ts` does not expose the project-scoped variant; the ad-hoc tail-append happens at the call site.
- `useIssueDetail` accepts `issueId: string | undefined` and falls back to a sentinel key `[..., "__none__"]` when undefined while disabling the query. Used only by `IssueDetailPanel`. This is the only place a "sentinel undefined" pattern appears.

---

## 18. Shared utilities

### 18.1 `src/utils/`

Contains exactly one file: `src/utils/seoUtils.ts`. Server-only (`import "server-only"`). Exports `getLocalizedSeoMetadata(locale, pathname)`. Strips the locale prefix, looks up `seo.routes.<key>` translations, and returns a Next.js `Metadata` object with canonical URL and `languages` alternates for every locale.

The architecture rule requires `src/utils/` to hold pure stateless helpers only; this file fits that contract.

### 18.2 `src/lib/` — server side

Frontend-relevant entries:

- `src/lib/routes.ts` — see §11.2.
- `src/lib/auth/types.ts` — `AppRoles`, `AdminAccessRoles`, `SuperAdminRoles`, `isAdminAccessRole`, `isSuperAdminRole`, `parseAppRole`. Used by both server and client.
- `src/lib/auth/session.ts` — `getSession`, `getUserAuthContext`, `requireUser`, `requireRole`. Server-only.
- `src/lib/auth/rbac.ts` — `assertRole`, `hasRole`, `ForbiddenError`. Server-only.
- `src/lib/auth/actions.ts` — `signOutAction`. Server Action.

### 18.3 Feature-level utilities (TypeScript files, not hooks)

| File | Exports | Consumed by |
|---|---|---|
| `src/features/issues/issueTypeUtils.ts` | `IssueTypes`, `IssueType`, `IssueTypeValues`, `isIssueBug`, `isIssueTask` | issues, schemas, board, detail panel, table |
| `src/features/issues/issues-query-error.ts` | `IssuesQueryError`, `isIssuesQueryError` | every mutation/query hook in every feature (cross-feature reuse) |
| `src/features/issues/permissions.ts` | `canUserTransitionIssueStatus`, `canEditIssueDetails` | issue detail pages and `IssueDetailPanel` |
| `src/features/issues/list-url-params.ts` | `parseIssuesListParams`, `issuesListParamsToSearchParams`, `patchIssuesListParams`, `IssuesListSortField`, `IssuesListOffsetParams` | `IssuesListPageClient` |
| `src/features/issues/map-errors.ts` | `zodToFieldErrors`, `supabaseErrorKey` | issues / users / audit / settings actions |
| `src/features/issues/cache.ts` | `ISSUES_CACHE_TAG` | actions only |
| `src/features/audit/auditUtils.ts` | `auditActionKey`, `auditActionColor`, `auditMetadataPreview` | audit panels |
| `src/features/dashboard/getDashboardData.ts` | `getDashboardData(userId)`, `DashboardData` | `dashboard/page.tsx` |

### 18.4 Cross-feature coupling

The issues feature is the de-facto "shared utils" location for failure types and helpers used by users/audit/settings/projects. `IssuesQueryError`, `IssuesActionResult<T>`, and `zodToFieldErrors` are imported from `@/features/issues/...` by other features. Renaming or relocating these files would break four other features (mirrors repository-overview §16.1). The shared concerns probably belong under `src/lib/` or `src/features/_shared/`.

---

## 19. Recurring patterns (summary)

1. **Server Component page → Client Component panel** with a thin Mantine `<Container>` / `<Paper>` chrome. Implemented identically in 8+ pages.
2. **Mantine notifications for mutation results, `<Text c="red">` for query failures.** No global error boundary / toast for queries.
3. **`isIssuesQueryError(error)` narrows error metadata for translation.** Used in every list/detail render path.
4. **`useDisclosure(false)` for boolean toggles, `useState<T | null>(null)` when the modal needs a target row.**
5. **`comboboxProps={{ withinPortal: true }}` on `<Select>` inside a `<Modal>`.**
6. **`<LoadingOverlay visible={pending} blur={1}>` over a `<Box pos="relative">`** for in-place mutation feedback.
7. **`patchIssuesListParams(listParams, { ..., resetPage: true })`** on every filter change in the issues list.
8. **`router.replace(pathname, { locale })`** inside `useTransition` for locale switches.
9. **`mounted` `useState` guard** for any client component whose first render depends on `window`/`localStorage` (used in `WorkspaceShellClient`, `ThemeToggle`).
10. **Server Action `signOutAction.bind(null, locale)` posted from a `<form action={...}>`.** No JS required for sign-out.
11. **Dynamic-import the heavy admin panels** with a `RouteLoading compact` fallback.
12. **`{...getInputProps("field")}`** for Mantine form-bound inputs.

---

## 20. Architectural inconsistencies (frontend-specific)

These are concrete rough edges visible in the code today.

1. **Login Server Action lives in a page module.** `src/components/Pages/LoginPage/LoginPage.tsx` declares an inline `signInAction` with `"use server"` (lines 20–49). Every other Server Action in the app lives in `features/<feature>/actions.ts`. Moving it would require creating an auth feature folder.
2. **Two issue-detail pages duplicate prefetch + permission resolution + render** (`src/app/[locale]/issues/[id]/page.tsx` and `src/app/[locale]/projects/[projectKey]/issues/[issueNumber]/page.tsx`). Already drifted: only the project route resolves the issue first to translate `(projectKey, issueNumber)` into a UUID.
3. **The board's status-transition mutation reimplements `useTransitionIssueStatus` inline** (`ProjectBoardPageClient` line 232–259), losing the optimistic update behaviour. Two code paths for the same Server Action.
4. **`useUpdateUserRole` invalidates `["issues"]` directly** instead of `issueQueryKeys.all`, bypassing the key factory.
5. **Client-side validators in `useForm` do not share a schema with the server's Zod** — they are inline functions returning translated strings. Drift is possible.
6. **Translation prefix sniffing repeats across panels.** `errorKey.startsWith("settings.")`, `.startsWith("projects.")`, `.startsWith("audit.")`, `.startsWith("projects.errors.")` are scattered across four panels with no shared helper.
7. **`Typography` (`src/components/Typography/Typography.tsx`) is consumed only by `LandingPage`.** It claims to be a design-system primitive but isn't used in the workspace UI. Several `as any` casts on size props.
8. **Admin layout double-wraps page chrome.** `admin/layout.tsx` renders `Container/Paper/Stack/Title/AdminSubnav` once for the whole `/admin/*` tree, while non-admin layouts let pages provide their own `Container/Paper`. New admin sub-pages must avoid duplicating the chrome — but the convention is not enforced by types.
9. **`dashboard/loading.tsx` uses `Container size="sm"` while the page uses `size="lg"`.** Content visibly shifts width when the data resolves.
10. **`localStorage` access for column visibility is wrapped in try/catch but never reported.** A failed read silently yields `{}`. This is fine for column visibility, but the same idiom isn't applied to the colour-scheme script (it `try { ... } catch(e) {}` without doing anything either, but at least the failure path matches the reduced-functionality guarantee Mantine documents).
11. **`AdminSubnav` and `ProjectSubnav` both reimplement active-tab styling** (one with text underlines, the other with icon glow). They share no abstraction.
12. **`useSearchParams` import from `next/navigation`** in `IssuesListPageClient.tsx` (line 17) is not exposed by `@/i18n/navigation`. There is no project-internal wrapper for search-param reading. Acceptable variance, but the asymmetry is real.
13. **Inline styles on the kanban board cards/columns** (`ProjectBoardPageClient` line 87–177) bypass the Mantine theme. Tokens like `--ops-board-column-bg` are defined in `globals.scss` only because of this branching style logic.
14. **Five route-segment `error.tsx` files have identical bodies** (delegating to `RouteSegmentError`). They are not deduplicated because Next requires the `"use client"` boundary at each segment.
15. **No global error boundary file** (`src/app/global-error.tsx`). A render error in the root layout will fall back to the Next.js default error page.

---

## 21. Cross-references

- System overview: `docs/ai/architecture/repository-overview.md` (§§ 6, 7, 8, 14, 15, 16).
- Top-level architecture: `docs/ARCHITECTURE.md`.
- Migration / RLS: `docs/SUPABASE_MIGRATIONS.md`.
- Authoritative AI rules: `.cursor/rules/architecture.mdc`, `.cursor/rules/git-and-changelog.mdc`.
