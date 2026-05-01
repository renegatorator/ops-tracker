# Backend architecture — Ops Tracker

A code-anchored map of the **backend** of Ops Tracker: the Supabase database, the row-level security (RLS) layer, the Server Actions that act as the API surface, the per-feature service layer, and the supporting cross-cuts (audit, email, recaptcha, env). Every claim points at a file, symbol, table, function or migration that exists on disk today.

This document complements:
- `docs/ai/architecture/repository-overview.md` (system-wide map),
- `docs/ai/architecture/frontend.md` (UI tree, providers, hooks),
- `docs/ARCHITECTURE.md` and `docs/SUPABASE_MIGRATIONS.md` (top-level docs).

Where any of these disagree with the code, the code wins.

---

## 1. Shape of the backend

There is **one** Next.js process; there is no separate API service. The "backend" is therefore the union of:

1. **Server-only TypeScript** running inside Next.js — Server Actions (`features/*/actions.ts`), Server Components, the proxy/middleware (`src/proxy.ts`), and `src/lib/*`.
2. **Supabase Postgres** — schema, RLS policies, triggers, and `SECURITY DEFINER` helper functions in `supabase/migrations/`.
3. **External services** invoked from server-only code — Resend (email) and Google reCAPTCHA v3 (login). Both are optional.

Everything that mutates state is funnelled through Server Actions. There is exactly one Route Handler in the app tree (`src/app/api/test-supabase/route.ts`, a diagnostic), and it is excluded from the proxy matcher (`src/proxy.ts` line 58: `/((?!api|_next|_vercel|.*\\..*).*)`).

There is **no** service-role Supabase key in code (verified by grep across `src/`). Every query runs as the authenticated user against PostgREST, with RLS in force.

---

## 2. Supabase architecture

### 2.1 Clients

Three clients exist, one per execution context:

| File | Purpose | Cookie source |
|---|---|---|
| `src/lib/supabase/server.ts` | RSC / Server Action / Server Component | `cookies()` from `next/headers` |
| `src/lib/supabase/proxy.ts` | Middleware (`src/proxy.ts`) refresh | `request.cookies` → `response.cookies` |
| `src/lib/supabase/client.ts` | Browser | built-in `@supabase/ssr` browser cookies |

All three are constructed via `@supabase/ssr` with `env("NEXT_PUBLIC_SUPABASE_URL")` and `env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")` from `src/lib/env.ts`. The publishable key is shipped to the client but the browser client is **not invoked at runtime today** — every data path goes through Server Actions (`SemanticSearch`/`Grep` for `createClient` from `@/lib/supabase/client` outside the file itself returns no matches).

`server.ts` swallows cookie write errors (`try {} catch {}`, lines 16–20) so RSC reads do not fail when Next forbids cookie mutation in a render pass; cookie rotation happens in the proxy instead.

### 2.2 Tables and migrations

Migrations live in `supabase/migrations/` and are applied in filename (timestamp) order. There is no app-side migration runner; `npm run db:push` calls the Supabase CLI.

| Migration | Adds |
|---|---|
| `20260403140000_phase1_issues_audit_statuses.sql` | `issue_statuses`, `issues`, `audit_log`, `set_updated_at()` trigger fn, partial indexes, initial RLS policies. |
| `20260405120000_user_profiles_admin_rls.sql` | First version of `user_profiles` SELECT/UPDATE policies (recursive — superseded). |
| `20260411120000_phase12_list_sort_audit_indexes.sql` | List/sort indexes (`updated_at desc, id desc`, `title asc, id asc`, `(status_id, created_at desc, id desc)`, `(assignee_id, created_at desc, id desc)`) and audit indexes. |
| `20260412140000_fix_user_profiles_rls_recursion.sql` | `SECURITY DEFINER` helpers `ops_auth_is_admin()`, `ops_auth_is_super_admin()`, `ops_auth_is_staff()`; recursion-free `user_profiles` policies. |
| `20260412200000_projects_members_issues_scope.sql` | `projects`, `project_members`, project-scoped columns on `issues`, `ops_auth_can_access_project(uuid)`, triggers `issues_before_insert_set_number`, `issues_before_write_check_members`, `issues_before_update_sync_key`; replaces issues RLS. |
| `20260413100000_issue_type_and_default_statuses.sql` | `issue_type` enum (`bug \| ticket`), `issues.issue_type` column; upserts default statuses (`open`, `in_progress`, `ready_for_deployment`, `testing`, `done`). |
| `20260413110000_remove_resolved_closed_statuses.sql` | Reassigns issues to `done` and deletes legacy `resolved`/`closed` statuses. |

The `user_profiles` table is treated as an **external prerequisite** in `docs/SUPABASE_MIGRATIONS.md` §1: this repo's migrations assume `public.user_profiles(id, full_name, role app_role)` already exists, with `id` referencing `auth.users(id)`. There are no migrations in this repo that create `user_profiles` or insert rows into it; signup-side row creation is expected from a `handle_new_user` trigger (documented but not committed here).

Domain enums (Postgres → TS):

- `app_role` = `'user' | 'admin' | 'super_admin'` ↔ `src/lib/auth/types.ts` `AppRoles`.
- `issue_type` = `'bug' | 'ticket'` ↔ `src/features/issues/issueTypeUtils.ts` `IssueTypes` (UI labels: Bug / Task).
- `project_member_role` = `'lead' | 'member'` ↔ `src/features/projects/types.ts` `ProjectMemberRole`.

### 2.3 SECURITY DEFINER helpers

All defined in `20260412140000_fix_user_profiles_rls_recursion.sql` and `20260412200000_projects_members_issues_scope.sql`. They are the **only** mechanism in the database that bypasses RLS, and only for role/membership lookups.

| Function | Returns | Used by |
|---|---|---|
| `ops_auth_is_super_admin()` | `boolean` | `phase8_user_profiles_update_super_admin` policy. |
| `ops_auth_is_admin()` | `boolean` | `phase8_user_profiles_update_admin_user_rows` policy. |
| `ops_auth_is_staff()` | `boolean` | `issue_statuses_*`, `audit_log_*`, `projects_*`, `project_members_*`, issues policies, and `ops_auth_can_access_project`. |
| `ops_auth_can_access_project(uuid)` | `boolean` | `projects_select_access`, `project_members_select_access`, `issues_select_visible`, `issues_insert_reporter_self`, `issues_update_member`. |

All four are `language sql stable security definer set search_path = public`, with `revoke all from public` and `grant execute to authenticated`.

### 2.4 RLS policies (current state)

Confirmed by reading every `create policy` statement in `supabase/migrations/`.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `issue_statuses` | any authenticated (`true`) | staff | staff | staff |
| `issues` | `(deleted_at is null and ops_auth_can_access_project(project_id)) or (deleted_at is not null and ops_auth_is_staff())` | `reporter_id = auth.uid() and ops_auth_can_access_project(project_id)` | staff (any) **or** `user`-role with `deleted_at is null and ops_auth_can_access_project(project_id) and (reporter_id = auth.uid() or assignee_id = auth.uid())` | staff |
| `audit_log` | staff | `actor_id = auth.uid()` | — (no policy) | — (no policy) |
| `projects` | `ops_auth_can_access_project(id)` | staff | staff | staff |
| `project_members` | `ops_auth_can_access_project(project_id)` | staff | staff | staff |
| `user_profiles` | `id = auth.uid() or ops_auth_is_staff()` | — (no policy in repo) | super_admin: any; admin: only rows whose current role is `'user'`, with new role constrained to `'user'` or `'admin'` | — (no policy in repo) |

Grants (`grant select, insert, update, delete ... to authenticated`) are issued for `issue_statuses`, `issues`, `projects`, `project_members`. `audit_log` is `select, insert` only (`20260403140000_*.sql` line 304).

### 2.5 Triggers

All defined in `20260412200000_projects_members_issues_scope.sql` and `20260403140000_phase1_*.sql`:

- **`set_updated_at()`** (generic) → triggers `issues_set_updated_at`, `projects_set_updated_at`. Sets `new.updated_at = now()` before update.
- **`issues_before_insert_set_number()`** (`SECURITY DEFINER`, lines 219–264 of the projects migration). On insert: increments `projects.last_issue_number` and assigns `new.issue_number`/`new.issue_key` as `'<projects.key>-<issue_number>'`. Allocates the project sequence atomically per row via `update projects set last_issue_number = last_issue_number + 1 returning last_issue_number`.
- **`issues_before_write_check_members()`** (`SECURITY DEFINER`, lines 266–308). On insert and update: raises `'reporter must be a project member'` or `'assignee must be a project member (or null)'` if the corresponding `project_members` row is missing. Triggers: `issues_before_insert_check_members`, `issues_before_update_check_members`.
- **`issues_before_update_sync_key()`** (`SECURITY DEFINER`, lines 311–334). Recomputes `issue_key` if `project_id` or `issue_number` ever changes (rare path).

### 2.6 Indexes worth knowing

- Phase 1 partial indexes on `issues` `WHERE deleted_at IS NULL`: `(status_id)`, `(assignee_id)`, `(reporter_id)`, `(created_at desc)`.
- Phase 12 list/sort indexes: `(updated_at desc, id desc)`, `(title asc, id asc)`, `(status_id, created_at desc, id desc)`, partial `(assignee_id, created_at desc, id desc) where assignee_id is not null`.
- Project-scoped: `issues_project_id_idx`, `issues_project_status_idx`, unique `issues_project_issue_number_uidx (project_id, issue_number)`, `project_members_user_id_idx`.
- Audit: `audit_log_created_at_idx`, `audit_log_entity_idx (entity_type, entity_id)`, `audit_log_entity_created_idx (entity_type, created_at desc)`, `audit_log_entity_type_id_created_idx (entity_type, entity_id, created_at desc)`.

### 2.7 Constraints

- `projects.key` check: `key ~ '^[A-Z][A-Z0-9]{1,9}$'` (`20260412200000_*.sql` line 19).
- `issues.status_id` → `issue_statuses(id) on delete restrict` (deleting an in-use status fails with `23503`; surfaced as `"statuses.deleteInUse"` in `src/features/issues/service.ts` line 505).
- `issues.reporter_id` → `user_profiles(id) on delete restrict`.
- `issues.assignee_id` → `user_profiles(id) on delete set null`.
- `project_members` cascade-deletes from `projects` and `user_profiles`.
- `issue_statuses.slug` unique (violation `23505` → `"statuses.slugTaken"`).
- `projects.key` unique (violation `23505` → `"projects.errors.keyTaken"`).
- `project_members` PK `(project_id, user_id)` (violation `23505` → `"projects.errors.alreadyMember"`).

---

## 3. API surface — Server Actions

There is **no REST/GraphQL API**. The single Route Handler is `src/app/api/test-supabase/route.ts`:

```5:15:src/app/api/test-supabase/route.ts
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("pg_tables").select("*").limit(1);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
```

It is reachable from any caller (the proxy explicitly excludes `/api`), running under whichever cookies the request carries — RLS is the only access gate.

Every other server entry point is a Server Action (`"use server"` at the top of the file). Confirmed by grep — files containing `"use server"`:

- `src/features/issues/actions.ts`
- `src/features/projects/actions.ts`
- `src/features/audit/actions.ts`
- `src/features/users/actions.ts`
- `src/features/settings/actions.ts`
- `src/lib/auth/actions.ts` (`signOutAction`)
- `src/components/Pages/LoginPage/LoginPage.tsx` (inline `signInAction`, line 21)

### 3.1 Server Action skeleton

Every mutation Server Action follows the same shape (verified by reading every `actions.ts`):

```ts
export const actionName = async (locale: string, raw: unknown) => {
  const ctx = await getUserAuthContext();          // 1. authentication
  if (!ctx) return unauthorized();
  // 2. authorization (only for admin/super_admin actions)
  try { assertRole(ctx, AdminAccessRoles); }
  catch (e) { if (e instanceof ForbiddenError) return { ok: false, errorKey: "errors.forbidden" }; throw e; }
  const parsed = someSchema.safeParse(raw);        // 3. zod validation
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await someService.fn(parsed.data); // 4. service call
  if (result.ok) {
    await logAudit({ ... });                        // 5. audit
    revalidatePath(localizedPath(locale, ...));     // 6. revalidate
  }
  return result;                                    // 7. typed result
};
```

The locale is always the first argument so the action can produce locale-aware revalidation paths and email URLs.

### 3.2 Read actions

Same skeleton minus role check (unless admin-only) and minus audit/revalidate. Confirmed callers:

| Action | Auth | Role gate | File |
|---|---|---|---|
| `listIssues` | required | none | `src/features/issues/actions.ts:87` |
| `getIssue` | required | none | `…/issues/actions.ts:128` |
| `listIssueStatuses` | required | none | `…/issues/actions.ts:98` |
| `listUserProfilesForIssueFilters` | required | `AdminAccessRoles` | `…/issues/actions.ts:106` |
| `listProjects` | required | none | `…/projects/actions.ts:62` |
| `getProjectByKey` | required | none | `…/projects/actions.ts:70` |
| `listProjectMembers` | required | none | `…/projects/actions.ts:177` |
| `listProjectMemberProfilesBrief` | required | none | `…/projects/actions.ts:188` |
| `listAuditLogsForAdmin` | required | `AdminAccessRoles` | `…/audit/actions.ts:45` |
| `listUserProfilesForAdmin` | required | `AdminAccessRoles` | `…/users/actions.ts:32` |

### 3.3 Write actions and their role gates

| Action | Role gate (TS) | Schema | File |
|---|---|---|---|
| `createIssue` | none (any signed-in user; reporter must be project member by SQL trigger) | `createIssueSchema` | `…/issues/actions.ts:146` |
| `updateIssue` | none (RLS gates by reporter/assignee) | `updateIssueSchema` | `…/issues/actions.ts:187` |
| `transitionIssueStatus` | none (RLS) | `transitionIssueStatusSchema` | `…/issues/actions.ts:216` |
| `assignIssue` | `AdminAccessRoles` | `assignIssueSchema` | `…/issues/actions.ts:238` |
| `softDeleteIssue` | `AdminAccessRoles` | `softDeleteIssueSchema` | `…/issues/actions.ts:367` |
| `createIssueStatus` / `updateIssueStatus` / `deleteIssueStatus` | `AdminAccessRoles` (`requireAdminOrSuperCtx`) | corresponding schemas | `…/issues/actions.ts:293/315/345` |
| `createProject` | `AdminAccessRoles` | `createProjectSchema` | `…/projects/actions.ts:81` |
| `updateProject` | `AdminAccessRoles` | `updateProjectSchema` | `…/projects/actions.ts:111` |
| `renameProject` | `SuperAdminRoles` | `renameProjectSchema` | `…/projects/actions.ts:144` |
| `addProjectMember` / `removeProjectMember` | `AdminAccessRoles` | `addProjectMemberSchema` / `removeProjectMemberSchema` | `…/projects/actions.ts:197/228` |
| `updateUserRole` | `AdminAccessRoles` | `updateUserRoleSchema` (+ extra logic in service) | `…/users/actions.ts:49` |
| `resetDemoData` | `SuperAdminRoles` | none (no input) | `…/settings/actions.ts:25` |
| `signInAction` | none (recaptcha + signInWithPassword) | inline form parse | `LoginPage.tsx:20` |
| `signOutAction` | n/a | n/a | `src/lib/auth/actions.ts:7` |

---

## 4. Service layer

Each feature has a `service.ts` whose exports are pure-ish data-access functions returning `{ ok, data } | { ok: false, errorKey }`. They are imported only by `actions.ts` (and by `getDashboardData.ts`); they all call `await createClient()` from `@/lib/supabase/server`.

**None of the service files include `import "server-only"` today.** They are server-only by transitive dependency on `cookies()` (a client import would fail at build), but the explicit marker is missing — see §15.

### 4.1 Files

| Feature | service.ts | What it owns |
|---|---|---|
| issues | `src/features/issues/service.ts` (518 lines) | List/get/create/update/transition/assign/softDelete/listStatuses/listProfiles/CRUD statuses; cursor encode/decode; search sanitisation. |
| projects | `src/features/projects/service.ts` (294 lines) | List/get/create/update/listMembers/addMember/removeMember; embed handling; lookup helpers. |
| audit | `src/features/audit/service.ts` (108 lines) | Filtered list with `count: "exact"` total. |
| users | `src/features/users/service.ts` (102 lines) | List for admin, role update with admin/super_admin guard logic. |
| settings | (no `service.ts`) — actions write directly. | `resetDemoData` only. |
| dashboard | `src/features/dashboard/getDashboardData.ts` | Aggregation: 2 list calls + 3 count head queries + 2 sample lists in `Promise.all`. |

### 4.2 Composition between services

Services do call other services (cross-feature, server-side):

- `src/features/issues/actions.ts` line 6 imports `* as projectService from "@/features/projects/service"` to handle the assignee-options branch (project members vs. all profiles).
- `src/features/dashboard/getDashboardData.ts` imports both `issueService` and `projectService`.

This is the only cross-feature service composition.

### 4.3 Result-type sharing

`src/features/issues/types.ts` defines `IssuesActionResult<T>`, `IssuesActionFailure`, `IssuesActionSuccess<T>`. The audit, users, and settings features re-import these directly:

- `src/features/audit/actions.ts` line 6 — imports `IssuesActionFailure`, `IssuesActionResult`.
- `src/features/audit/service.ts` line 2 — imports `IssuesActionResult`.
- `src/features/users/actions.ts` line 6 — same pair.
- `src/features/users/service.ts` line 2 — same pair.
- `src/features/settings/actions.ts` line 5 — same pair.

`map-errors.ts` (`zodToFieldErrors`, `supabaseErrorKey`) is similarly imported by `audit/actions.ts`, `projects/actions.ts`, `projects/service.ts`, `audit/service.ts`, `users/actions.ts`, `users/service.ts`, `settings/actions.ts`. See §15.

---

## 5. Database access patterns

All access goes through PostgREST via the `@supabase/ssr` server client.

### 5.1 Reads — single row

`maybeSingle()` is used when zero or one row is acceptable; `single()` only after an insert with `RETURNING`. Examples:

```70:75:src/features/issues/service.ts
const supabase = await createClient();
const { data, error } = await supabase
  .from("issue_statuses")
  .select("id")
  .eq("id", statusId)
  .maybeSingle();
```

Service functions consistently treat:
- Postgres error → `supabaseErrorKey(error, fallback)`.
- `null` data → a `errors.notFound`-shaped failure.
- success → `{ ok: true, data }`.

### 5.2 Reads — embeds

PostgREST relationship embeds replace explicit joins:

- `issueSelect` (`src/features/issues/service.ts` lines 25–45): embeds `issue_statuses (...)`, `projects!inner (id, key, name)`, `assignee:user_profiles!issues_assignee_id_fkey (...)`. The `!inner` forces the project join even when filtering by `projects.key`.
- `auditSelect` (`src/features/audit/service.ts` lines 12–24): embeds `actor:user_profiles!audit_log_actor_id_fkey (email, full_name)`.
- `listProjectMembers` (`src/features/projects/service.ts` lines 152–164): embeds `user_profiles (id, email, full_name)` and normalises array-vs-object responses (lines 175–191) because PostgREST sometimes returns the embed as an array.

### 5.3 Search and filter

`listIssues` (`src/features/issues/service.ts` lines 88–183):

- Filters: `statusId`, `assigneeId`, `projectId`, `includeClosed` (toggles `is("deleted_at", null)`).
- Sort: `created_at | title | updated_at | status` × `asc | desc`. Status sort uses `referencedTable: "issue_statuses"` ordering by `sort_order`. A stable tie-breaker `order("id", { ascending })` is appended (`line 122`).
- Search: `sanitizeSearch` strips `%`, `_`, `,`, `(`, `)`, `/` (line 47) and produces `or("title.ilike.%x%,issue_key.ilike.%x%")`.

`listAuditLogs` (`src/features/audit/service.ts`) supports `actionContains` (ilike), `entityType`, `entityId`, `fromDate`, `toDate` (parsed as full UTC days). It runs the count and data query in `Promise.all` (lines 66–72).

### 5.4 Pagination

- **Issues list:** `mode: "offset"` (`offset` 0..1_000_000) or `mode: "cursor"`. Both call `q.range(from, offset + limit)` with `to = offset + limit` (note: this is `limit + 1` rows, so `hasMore = rows.length > limit`, line 153). The cursor format is `base64url(JSON({ o: offset }))` (`encodeListCursor`, lines 50–51) — i.e. **offset disguised as a cursor** — see §13.
- **Audit list:** offset/limit pagination with explicit `count: "exact"` total (`src/features/audit/service.ts` line 36). `range(offset, offset + limit - 1)` returns exactly `limit` rows.
- **Dashboard counts:** `select("id", { count: "exact", head: true })` for total/open/myIssues; only counts are returned, no rows.

### 5.5 Writes

- **Insert with returning:** `.insert(...).select("...").single()` for `issues`, `projects`, `issue_statuses`. Uses `single()` because the row is expected to exist.
- **Update with returning:** `.update(patch).eq("id", id).select("...").maybeSingle()` (then null→`errors.notFound`).
- **Patch building:** services build a `patch` object only with provided fields (e.g. `src/features/issues/service.ts` lines 282–286 for `updateIssue`, lines 465–470 for `updateIssueStatus`). Undefined fields are omitted, so RLS sees only the columns that are actually changing.
- **Soft delete:** `softDeleteIssue` writes `deleted_at = new Date().toISOString()` (lines 374–396).
- **Hard delete:** `deleteIssueStatus` and `removeProjectMember`. There is no hard delete of issues from any action.

### 5.6 Counts and existence checks

- `statusExists` (`src/features/issues/service.ts` lines 67–86): used before `createIssue` and `transitionIssueStatus` to surface a translation-key error rather than a raw FK violation.
- Assignee existence check before `assignIssue` (lines 338–353).
- `dashboard` uses `select("id", { count: "exact", head: true })` thrice for top-level counters.

---

## 6. Transaction patterns

**There are no SQL transactions in the application code.** The Supabase JS client does not support `BEGIN/COMMIT`; multi-step writes are sequential PostgREST calls, each committed independently.

The places where this matters today:

### 6.1 `createProject` — manual compensation

`src/features/projects/service.ts` `createProject` (lines 65–106):

1. `insert` into `projects` (returns `id`).
2. `insert` into `project_members` with `role: "lead"` for the creator.
3. If step 2 fails, runs `supabase.from("projects").delete().eq("id", created.id)` as **best-effort rollback** (line 98).

If step 3's delete itself fails (network, RLS), the project row remains without its lead member. There is no retry, no audit, and the action returns `errorKey: "projects.errors.createFailed"`.

### 6.2 `resetDemoData` — three sequential deletes

`src/features/settings/actions.ts` lines 48–73:

1. `delete from issues` (filtered by `neq("id", NIL_UUID)`).
2. `delete from project_members` (filtered by `gte("created_at", "1970-01-01T00:00:00Z")`).
3. `delete from projects` (same date predicate).

PostgREST refuses unconditional deletes, hence the trick predicates. If step 1 succeeds and step 2 fails, the database is left with project_members and projects but no issues. The action returns `"settings.errors.resetFailed"` and **does not attempt to undo step 1**.

### 6.3 Issue creation — atomic at the DB level

A single insert into `issues` triggers (in this order, all in the same statement):

- `issues_before_insert_set_number` — increments `projects.last_issue_number` and stamps `issue_number` / `issue_key`.
- `issues_before_write_check_members` — raises if reporter/assignee not in `project_members`.

Because both run in the implicit transaction of one INSERT statement, sequence allocation and member checks are atomic with the row creation.

### 6.4 Audit + mutation — not atomic

Every Server Action calls the service mutation first, then `logAudit` separately, then `revalidate*`. If `logAudit` fails (returns `false`):

- For all actions **except** `resetDemoData`: the mutation already committed, the audit row is missing, the action still returns `{ ok: true }`. The error is logged via `console.error("[audit] insert failed", ...)` (`src/lib/audit/log-audit.ts` line 27).
- For `resetDemoData` only: a failed audit returns `errorKey: "settings.errors.auditFailed"` to the client (`src/features/settings/actions.ts` lines 91–93). The deletes have already happened.

There is no compensation, no retry, no outbox.

### 6.5 Email — not atomic, by design

Emails are dispatched after the mutation commits (`createIssue`, `assignIssue`). They never throw and never affect the action result. See §10.

---

## 7. Authorization enforcement

Authorization is enforced in **two independent layers** that must agree. A third layer in the UI hides controls but is not a security boundary.

### 7.1 Layer 1 — application code

`src/lib/auth/session.ts`:

- `getSession()` → `{ user }` (only `auth.getUser()`; no profile read).
- `getUserAuthContext()` → `{ user, role, fullName }` after a `user_profiles.role` lookup. Returns `null` if user missing **or** profile row missing **or** role unparseable.
- `requireUser(locale)` → `redirect({ href: routes.login, locale })` if no user.
- `requireRole(locale, allowed)` → redirects to login if no user/profile, to dashboard if role not in `allowed`.

`src/lib/auth/rbac.ts`:

- `assertRole(ctx, allowed)` throws `ForbiddenError` if `ctx.role` is not in `allowed`.
- `hasRole(ctx, allowed)` boolean variant.

Server Actions check `getUserAuthContext()` and (for admin/super_admin actions) wrap `assertRole` in try/catch to map `ForbiddenError` → `{ ok: false, errorKey: "errors.forbidden" }`.

Server Components / route layouts use `requireUser` / `requireRole` to redirect:

- `src/app/[locale]/admin/layout.tsx` calls `requireRole(locale, AdminAccessRoles)` for the entire `/admin` segment (admins get through; users redirect to `/dashboard`).
- `src/app/[locale]/admin/settings/page.tsx` adds another `requireRole(locale, SuperAdminRoles)` so admins are redirected away from super-admin-only settings.

### 7.2 Layer 2 — RLS in Postgres

See §2.4. Every mutation in `service.ts` runs as the authenticated user, so RLS is the **actual** gatekeeper. If the TS check is removed by accident, RLS still rejects the request and `supabaseErrorKey` maps the resulting message (`"row-level security"` / `"policy"`) to `"errors.forbidden"` (`src/features/issues/map-errors.ts` lines 21–28).

For role updates, the Phase 8 RLS policy `phase8_user_profiles_update_admin_user_rows` constrains admins to only modify rows whose **current** role is `'user'`, with new role in `('user', 'admin')`. The same rule is independently re-implemented in TypeScript:

```66:76:src/features/users/service.ts
if (actorRole === AppRoles.ADMIN) {
  if (input.role === AppRoles.SUPER_ADMIN) {
    return { ok: false, errorKey: "errors.cannotAssignSuperAdmin" };
  }
  if (targetRole !== AppRoles.USER) {
    return forbidden();
  }
  if (input.role !== AppRoles.USER && input.role !== AppRoles.ADMIN) {
    return forbidden();
  }
}
```

Drift between this code and the SQL policy will produce either silent RLS rejections or UI/UX inconsistencies — see §15.

### 7.3 Layer 3 — UI permission helper (not security)

`src/features/issues/permissions.ts` mirrors the RLS user-branch for issue updates:

```8:21:src/features/issues/permissions.ts
export const canUserTransitionIssueStatus = (
  ctx: UserAuthContext,
  issue: IssueWithStatus,
): boolean => {
  if (isAdminAccessRole(ctx.role)) {
    return true;
  }
  if (ctx.role === AppRoles.USER) {
    return (
      issue.reporter_id === ctx.user.id || issue.assignee_id === ctx.user.id
    );
  }
  return false;
};
```

`canEditIssueDetails` aliases the same predicate. Used by Server Components to compute boolean props passed into `IssueDetailPanel`. **Removing this helper does not lower security** — the action is still gated by app and RLS — but it is a known duplication source; see §15.

### 7.4 reCAPTCHA gate on login

`signInAction` (`LoginPage.tsx` lines 20–48) calls `verifyRecaptchaToken` (`src/lib/recaptcha.ts`) before `signInWithPassword`. The verifier:

- Returns `true` if `RECAPTCHA_SECRET_KEY` is unset (development bypass, line 16–18).
- Returns `false` on any network error, missing token, or score `< 0.5`.

There is no rate limiting beyond Supabase Auth's own limits.

---

## 8. Audit logging flow

### 8.1 Persistence

`audit_log` is append-only by RLS:

- `audit_log_insert_self` requires `actor_id = auth.uid()` (no admin bypass).
- `audit_log_select_admin` restricts reads to staff.
- No UPDATE or DELETE policies are defined → those operations are denied for all authenticated users.

Insertion is centralised in `src/lib/audit/log-audit.ts` (`import "server-only"`):

```17:31:src/lib/audit/log-audit.ts
export const logAudit = async (input: LogAuditInput): Promise<boolean> => {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_log").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) {
    console.error("[audit] insert failed", error.message);
    return false;
  }
  return true;
};
```

Returns `boolean`; **never throws**. Callers ignore the return value except `resetDemoData` (which fails the action).

### 8.2 Action keys emitted

Verified by reading every Server Action that calls `logAudit`:

| `action` | Emitter | `entity_type` | Metadata |
|---|---|---|---|
| `issue.create` | `createIssue` | `issue` | `{ title, project_id, issue_key }` |
| `issue.update` | `updateIssue` | `issue` | `{ fields, issue_key }` |
| `issue.status_transition` | `transitionIssueStatus` | `issue` | `{ status_id, issue_key }` |
| `issue.assign` | `assignIssue` | `issue` | `{ assignee_id, issue_key }` |
| `issue.archive` | `softDeleteIssue` | `issue` | `{}` |
| `issue_status.create` / `.update` / `.delete` | `createIssueStatus` / `updateIssueStatus` / `deleteIssueStatus` | `issue_status` | `{ slug, name }` / `{ fields }` / `{}` |
| `project.create` | `createProject` | `project` | `{ key, name }` |
| `project.update` | `updateProject` | `project` | `{ key, fields }` |
| `project.rename` | `renameProject` | `project` | `{ key, name }` |
| `project.member.add` | `addProjectMember` | `project` | `{ user_id, role }` |
| `project.member.remove` | `removeProjectMember` | `project` | `{ user_id }` |
| `user.role_change` | `updateUserRole` (in `users/service.ts`) | `user_profile` | `{ from, to }` |
| `demo.reset` | `resetDemoData` | `system` | `{ issues_deleted, project_members_deleted, projects_deleted }` |

Note: `user.role_change` is emitted from inside `users/service.ts` (line 94) rather than from `users/actions.ts`. It is the only audit emitter that lives in a service file.

### 8.3 Read surfaces

- **Global admin view:** `listAuditLogsForAdmin` in `src/features/audit/actions.ts` → `auditService.listAuditLogs`. Filters: `actionContains`, `entityType` (enum: `issue | issue_status | user_profile | system`), `entityId`, `fromDate`, `toDate`. Offset pagination with `count: "exact"` and `auditSelect` embed of actor profile. UI: `AdminAuditLogPanel` mounted at `/admin/audit`.
- **Per-issue activity:** same action with `entityType: "issue"`, `entityId: issueId`, `limit: 40`. Prefetched server-side via `prefetch-issue-queries.ts` when `options.prefetchIssueAudit` is true.

### 8.4 Application logging (stdout/stderr)

Confirmed by grep. There is **no centralised logger** (no Pino, Winston, Sentry, OpenTelemetry).

Direct `console.*` calls only:
- `src/lib/audit/log-audit.ts` — `console.error("[audit] insert failed", ...)`.
- `src/lib/auth/session.ts` — `console.warn("[auth] ...")` only when `NODE_ENV === "development"`.
- `src/lib/email/*.ts` — `console.error("[email] ...")` on Resend errors.
- `src/components/RouteSegmentError.tsx` — client-side `console.error(error)`.

No request ID or correlation ID is produced. Linking audit rows to platform logs requires correlating by `actor_id` + `created_at`.

---

## 9. Realtime event flow

**There is none.** Verified by grep across `src/` and `supabase/migrations/`:

- `rg "realtime|subscribe|channel\("` under `src/` — zero matches.
- `rg "supabase\.channel|supabase\.realtime"` — zero matches.
- No `supabase/realtime.json` or equivalent config.

The CSP in `next.config.ts` permits `wss://*.supabase.co` (line 78) and `docs/ARCHITECTURE.md` line 224 lists realtime as future work, but no subscriber exists today.

---

## 10. Notification flow

In-app notifications are Mantine toasts dispatched from client hooks (`@mantine/notifications`); they are not part of the backend. **Out-of-band notifications** are transactional emails via Resend.

### 10.1 Two emails are sent

| Trigger | Sender | Recipient | File |
|---|---|---|---|
| `createIssue` succeeded | `sendIssueCreatedReporterEmailIfConfigured` | `ctx.user.email` (the reporter) | `src/lib/email/send-issue-created-email.ts` |
| `assignIssue` succeeded with non-null assignee | `sendIssueAssignedEmailIfConfigured` | `user_profiles.email` of the new assignee | `src/lib/email/send-issue-assigned-email.ts` |

Both files start with `import "server-only"`, instantiate `Resend(apiKey)` only when `getResendApiKey()` returns a non-empty string, and **never throw** — errors are caught and logged via `console.error`. Subjects, bodies and CTA URLs are computed inline; HTML is built by `buildEmailHtml` (`src/lib/email/email-template.ts`).

### 10.2 Configuration

- `getResendApiKey()` reads `process.env.RESEND_API_KEY`; trims; returns `undefined` when empty.
- `getResendFrom()` reads `process.env.RESEND_FROM`; defaults to `"Ops Tracker <onboarding@resend.dev>"`.
- `NEXT_PUBLIC_SITE_URL` (default `"http://localhost:3000"`) is the base for links; `localizedPath(locale, issueDetailPath(id))` builds the final URL.

### 10.3 Best-effort semantics

If the API key is missing → return immediately, no log. If the key is present but the assignee profile / issue title cannot be loaded → return silently (`send-issue-assigned-email.ts` lines 42–44). If Resend returns an error → `console.error("[email] Resend API error", ...)` and return. The action result is unaffected in every case.

The assigned-email path performs **two extra reads** (`issues.title`, `user_profiles` of assignee) that are **redundant with data already known to the action** — the action holds neither the title nor the assignee email and chose to look them up here rather than thread them through. See §15.

---

## 11. Background processing

**There is none.** Confirmed by grep — no `setInterval`, `setTimeout`-as-job, no cron, no queue/worker libraries (`bullmq`, `agenda`, `pg-boss`, etc.) in `package.json`. All work happens synchronously inside the Server Action that triggered it (with email being the only "background-ish" call, which still completes within the request).

---

## 12. Error handling patterns

### 12.1 Result objects, not exceptions

Service functions and Server Actions return `{ ok: true; data: T } | { ok: false; errorKey: string; fieldErrors?: Record<string, string[]> }`. Every consumer is expected to check `result.ok` before using `.data`.

### 12.2 Translation-keys-as-error-codes

All Zod messages and most service-level `errorKey`s are translation keys (e.g. `"validation.titleRequired"`, `"errors.notFound"`). Mapping happens at three points:

- `zodToFieldErrors` (`src/features/issues/map-errors.ts`) collapses Zod issues into `{ [path]: string[] }`.
- `supabaseErrorKey` maps Postgres error codes / messages:
  - `"23503"` (FK violation) → `"errors.referenceInvalid"` (general) or `"statuses.deleteInUse"` (in `deleteIssueStatus`).
  - `"23505"` (unique) → feature-specific keys (`"projects.errors.keyTaken"`, `"projects.errors.alreadyMember"`, `"statuses.slugTaken"`).
  - `"PGRST116"` (no rows) → `"errors.notFound"`.
  - Substrings `"row-level security"`, `"violates row-level security"`, `"policy"` → `"errors.forbidden"`.
  - Otherwise → caller-supplied fallback key.
- `IssuesQueryError` (`src/features/issues/issues-query-error.ts`) wraps `errorKey + fieldErrors` into a thrown error so TanStack Query's `error` slot survives the round-trip.

### 12.3 Where `try/catch` actually appears

- Server Actions: only around `assertRole` to translate `ForbiddenError` → result object.
- `supabase/server.ts` line 16–20: swallows cookie write errors during RSC reads.
- `recaptcha.ts` line 36–38: swallows network errors → returns `false`.
- Email senders: outer `try/catch` to log and discard.
- `decodeListCursor` (`src/features/issues/service.ts` lines 53–64): JSON parse failure → `null` → `errors.invalidCursor`.

### 12.4 What happens on uncaught errors

A Server Action that throws unexpectedly (e.g. an `assertRole` re-throw of a non-ForbiddenError, a database adapter crash) bubbles up to Next.js. The framework returns an error response to the client; TanStack Query receives it as a generic error rather than an `IssuesQueryError`. The route segment error boundaries (`error.tsx` files under `src/app/[locale]/.../`) handle render-time errors but not Server Action errors — clients fall back to whichever notification path the calling hook implements.

---

## 13. Caching

### 13.1 Next.js cache invalidation

Server Actions invalidate cached RSC pages with `revalidatePath(localizedPath(locale, route), "page" | "layout")`:

- `src/features/issues/actions.ts` `revalidateIssuesSegment` (lines 47–67) — invalidates `routes.issues`, `routes.projects`, the project board/issues pages, and the issue detail page (when applicable). Always also calls `revalidateTag(ISSUES_CACHE_TAG, "max")`.
- `src/features/issues/actions.ts` `revalidateAfterIssueStatusMutation` (lines 69–74) — invalidates `routes.issues`, `routes.projects`, `routes.adminStatuses`.
- `src/features/projects/actions.ts` `revalidateProjectsSegment` (lines 37–49) — invalidates `routes.projects` layout and per-project board/issues/settings pages.
- `src/features/users/actions.ts` line 71 — invalidates `routes.adminUsers`.
- `src/features/settings/actions.ts` lines 95–97 — invalidates `routes.issues`, `routes.dashboard`, `routes.projects` layouts after demo reset.

### 13.2 The `ISSUES_CACHE_TAG` is wired but unused

`src/features/issues/cache.ts`:

```1:2:src/features/issues/cache.ts
/** Use with `fetch(..., { next: { tags: [ISSUES_CACHE_TAG] } })` when caching issue lists. */
export const ISSUES_CACHE_TAG = "issues";
```

Every issue mutation calls `revalidateTag(ISSUES_CACHE_TAG, "max")`. Verified by grep: no `fetch(..., { next: { tags: [...] } })` callsite anywhere in `src/`. The tag is therefore a **no-op** today; it is set up for a future cache layer.

### 13.3 No `unstable_cache` / no `cache()` data layer

Confirmed by grep across `src/`. Every read of Supabase data goes through a fresh `await createClient()` and a fresh PostgREST round-trip. There is no Memcached/Redis adapter, no `unstable_cache` wrapper, no Next.js Data Cache use.

### 13.4 TanStack Query cache (client side)

Out of scope for the backend, but worth knowing: `QueryClient` is configured with `staleTime: 60_000` ms (`src/components/Providers/QueryProvider.tsx` line 17 and the per-page hydration clients). After a Server Action returns success, hooks call `queryClient.invalidateQueries(...)` against the relevant key namespace (`issueQueryKeys`, `projectQueryKeys`, `auditQueryKeys`, `userAdminQueryKeys`).

---

## 14. Edge functions

**There are none.**

- No directory `supabase/functions/`. The only thing under `supabase/` is `migrations/`, `.gitignore`, and `.temp/`.
- Confirmed by grep: no `runtime = "edge"` or `export const runtime = "edge"` anywhere in `src/app`.
- The single Route Handler (`src/app/api/test-supabase/route.ts`) does not declare a runtime → defaults to Node.

All server-side execution runs in Node 20.x on the Next.js server.

---

## 15. Critical business logic, coupling, duplication, and risks

These observations are concrete and grounded in the files cited.

### 15.1 Critical business logic locations

| Concern | File / function |
|---|---|
| Authentication | `src/lib/auth/session.ts` (`getSession`, `getUserAuthContext`, `requireUser`, `requireRole`); `src/components/Pages/LoginPage/LoginPage.tsx` (`signInAction`); `src/lib/auth/actions.ts` (`signOutAction`). |
| Role assertion | `src/lib/auth/rbac.ts` (`assertRole`, `ForbiddenError`). |
| RLS helpers (DB) | `supabase/migrations/20260412140000_*.sql` (`ops_auth_is_*`); `20260412200000_*.sql` (`ops_auth_can_access_project`). |
| Issue identity (key allocation) | `issues_before_insert_set_number` trigger (`20260412200000_*.sql` lines 219–264). Single source of truth; `issue_key` and `issue_number` must not be set by the app. |
| Project membership enforcement | `issues_before_write_check_members` trigger (`20260412200000_*.sql` lines 266–308). Hard-fails the write if reporter or assignee is not a project member. |
| Issue type mapping | `src/features/issues/issueTypeUtils.ts` — DB enum `bug | ticket`, UI labels Bug / Task. Comparing the raw string anywhere else is a bug. |
| Soft delete invariant | `issues.deleted_at` filter (`is("deleted_at", null)`) appears in `listIssues`, `getIssue`, dashboard counts. Removing any one of these would expose archived issues. |
| Role-update guard rails | `src/features/users/service.ts` `updateUserRole` lines 66–76 (TS) **and** `phase8_user_profiles_update_admin_user_rows` (RLS). Both must agree. |
| Demo reset | `src/features/settings/actions.ts` `resetDemoData`. Three sequential deletes; only place where audit failure aborts the action. |
| Audit insertion | `src/lib/audit/log-audit.ts`. Failure swallowed for all callers except `resetDemoData`. |
| Email dispatch | `src/lib/email/send-issue-*.ts`. Best-effort; failures never propagate. |

### 15.2 Dangerous coupling

1. **Cross-feature import of issues primitives.** `audit/actions.ts`, `audit/service.ts`, `users/actions.ts`, `users/service.ts`, `projects/actions.ts`, `projects/service.ts`, `settings/actions.ts` all import `IssuesActionResult` / `IssuesActionFailure` (from `@/features/issues/types`) and/or `zodToFieldErrors`, `supabaseErrorKey` (from `@/features/issues/map-errors`). Renaming or relocating either file silently breaks five features. The shared concerns belong in `src/lib/` or a `_shared` feature.
2. **`src/app/api/test-supabase/route.ts` is a live diagnostic.** It selects from `pg_tables` using the cookie-bound Supabase client. Reachable from any caller — the proxy excludes `/api`, so it is not even refreshed by the auth middleware. Should be deleted, gated behind `NODE_ENV === "development"`, or moved.
3. **Dashboard depends on every other feature.** `getDashboardData.ts` imports both `issueService` and `projectService`. Schema changes to either can break the dashboard silently because errors are coalesced into `hasError: boolean` (lines 75–82) without surfacing the underlying `errorKey`.
4. **`src/proxy.ts` matcher excludes any path containing a dot** (`/((?!api|_next|_vercel|.*\\..*).*)`). Custom routes with literal dots in segments would silently bypass auth refresh and locale handling.

### 15.3 Duplicated logic

1. **Role-update rule.** TypeScript in `users/service.ts` lines 66–76 (admin can only flip `user`↔`admin`, never assign super_admin, never edit non-`user` rows) is a manual restatement of the SQL policy `phase8_user_profiles_update_admin_user_rows` (USING `ops_auth_is_admin() AND user_profiles.role = 'user'` / WITH CHECK `role IN ('user','admin')`). Drift will cause silent RLS rejections or a UI that allows what RLS denies.
2. **Issue update permissions.** `src/features/issues/permissions.ts` `canUserTransitionIssueStatus` mirrors the `issues_update_member` RLS branch. The duplication is intentional (the UI hides controls early), but the helper does not check project membership — only `reporter_id`/`assignee_id`. RLS additionally requires `ops_auth_can_access_project(project_id)`. Today this is fine because reporters and assignees are always members (enforced by the `issues_before_write_check_members` trigger), but the helper drifts from RLS in spirit.
3. **`requireAdminOrSuperCtx` patterns.** `src/features/issues/actions.ts` defines a local helper `requireAdminOrSuperCtx` (lines 279–291); the same pattern is open-coded in every other admin-gated action (audit, users, projects, settings). Each action repeats the `getUserAuthContext` → `assertRole` → `try/catch ForbiddenError` block.
4. **Patch-building for partial updates.** `updateIssue`, `updateIssueStatus`, and `updateProject` all build a `patch` object with the same idiom (`if (input.x !== undefined) patch.x = input.x`). Diverging field treatment (e.g. `updateProject` collapses empty string description to `null`; `updateIssue` keeps it) is an easy place for inconsistency.
5. **`revalidate*` helpers.** Each feature defines its own `revalidateXxxSegment(locale, projectKey?)`. They overlap in which paths they invalidate (issues + projects layout). A status change in `issues/actions.ts` revalidates issues but not project boards unless `projectKey` is passed; the action is currently called without `projectKey`, meaning Kanban boards may keep stale columns until `staleTime` elapses on the client.

### 15.4 Authorization risks

1. **`createIssue` has no TS role check.** Anyone authenticated can call it. Authorization is delegated entirely to:
   - the `issues_insert_reporter_self` policy (`reporter_id = auth.uid()` and `ops_auth_can_access_project`),
   - the `issues_before_write_check_members` trigger.
   If RLS were ever disabled on `issues` (e.g. by a future migration that forgets `enable row level security`), any authenticated user could insert into any project. There is no defence in TS.
2. **`updateIssue` and `transitionIssueStatus` have no TS role check.** Same as above. RLS gates by reporter/assignee for `user`-role and by staff status for admins. No app-side fallback.
3. **Service files lack `import "server-only"`.** None of `features/*/service.ts` carry the marker, so a stray client import would not be detected at build time by the `server-only` package — it would fail later at runtime when `cookies()` is called from a client component. The build would still ship.
4. **`api/test-supabase` runs as the caller.** RLS is the only access control. `pg_tables` is in the `pg_catalog` schema; PostgREST may or may not expose it depending on the Supabase project's exposed schemas. If exposed, it leaks the table inventory of the database to any signed-in user.
5. **`logAudit` failure is silently ignored.** With audit-log writes governed by RLS (`actor_id = auth.uid()`), an attacker who manages to bypass app-level role checks might also be unable to insert audit rows — but the mutation already succeeded. Any attacker-driven mutation that passes RLS but trips audit RLS would leave no audit trace.
6. **Layered defence drift.** `src/features/users/service.ts` and `phase8_user_profiles_update_admin_user_rows` independently enforce the admin-edits-only-`user`-rows rule. If the SQL policy is relaxed (e.g. to allow admins to demote other admins) but the TS check is not updated, the UI will return `errors.cannotEditRole` even though RLS would accept the write.
7. **No CSRF tokens on Server Actions.** Next.js Server Actions rely on the framework's built-in same-origin protection; there is no additional CSRF token in the codebase. If the Next.js protections were ever weakened, mutations could be triggerable by cross-origin POSTs because every action uses cookie-bound auth.
8. **reCAPTCHA bypassed when secret unset.** `verifyRecaptchaToken` returns `true` if `RECAPTCHA_SECRET_KEY` is missing (`src/lib/recaptcha.ts` lines 14–18). In any environment that lacks the env var, the login form's bot protection is disabled silently.

### 15.5 Transaction risks

1. **`createProject` is two writes with a best-effort rollback.** If the `project_members` insert fails, the compensating `delete from projects` may also fail — leaving a project row without its lead. There is no retry, audit, or alert path. (`src/features/projects/service.ts` lines 91–103.)
2. **`resetDemoData` is three separate deletes.** A mid-sequence failure (after `issues` are gone, before `projects` are gone) leaves a partially-empty database and returns `"settings.errors.resetFailed"`. Re-running succeeds because the predicates remain valid.
3. **Audit + mutation not atomic.** A successful mutation followed by a failed audit insert produces an unaudited state change for every action except `resetDemoData`. Concretely: an attacker who can suppress audit RLS (or the audit_log insert path) can mutate state without trace. There is no compensating delete or queued retry.
4. **Email is dispatched after commit.** A `sendIssueAssignedEmailIfConfigured` failure is silent. There is no outbox, no retry, no DLQ. This is by design (email is best-effort) but the user is never told the email did not go out.
5. **`renameProject` calls `updateProject`.** Both `renameProject` and `updateProject` route through `projectService.updateProject(parsed.data)`. If `renameProjectSchema` ever diverges from `updateProjectSchema` in surprising ways (e.g. allowing additional fields), the service will accept them because it iterates `input.name`, `input.description`, `input.archived` and ignores the rest — still safe, but coupling the two paths means any future change to `updateProject`'s field handling implicitly changes `renameProject`.
6. **`issues_before_insert_set_number` writes to `projects.last_issue_number` under `SECURITY DEFINER`.** This is the only place the sequence advances. If the trigger is disabled or replaced, issue keys can collide, and the `issues_project_issue_number_uidx` unique index will surface that as a confusing PostgREST error.
7. **`updateIssue` accepts only `title`, `description`, `issue_type`.** Status, assignee, project_id, reporter_id are not updatable through this path; they each have a dedicated action. If RLS were ever loosened, an attacker constructing a raw mutation against PostgREST could update fields the action does not surface — RLS is the only gate on column-level write authorisation today.

### 15.6 Operational gaps worth knowing

- **CI does not run tests or apply migrations.** `.github/workflows/ci.yml` runs `npm run lint` and `npx tsc --noEmit`. Playwright is explicitly skipped (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1"`).
- **No service-role key path.** Any future feature that requires bypassing RLS (e.g. cross-tenant admin reports) will need to introduce a separate server-only client; today there is no such path.
- **`OPS_DEMO_RESET_ENABLED`** defaults to **enabled outside production**. In production the env var must be present and truthy. Easy to miss.
- **`OPS_EXPERIMENTAL_UI`** is read by `isExperimentalUiFlagSet()` and surfaced in the super-admin settings page (`src/app/[locale]/admin/settings/page.tsx` line 45) but is not branched on anywhere in runtime code.

---

## 16. Cross-references

- System map: `docs/ai/architecture/repository-overview.md`
- Frontend map: `docs/ai/architecture/frontend.md`
- Top-level architecture: `docs/ARCHITECTURE.md`
- Migrations onboarding: `docs/SUPABASE_MIGRATIONS.md`
- Workspace rules (authoritative for AI agents): `.cursor/rules/architecture.mdc`, `.cursor/rules/git-and-changelog.mdc`
