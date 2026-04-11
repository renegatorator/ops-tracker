# Ops Tracker — implementation plan

**Purpose:** Step-by-step plan for implementing the full product described in [README](../README.md), aligned with [ARCHITECTURE.md](./ARCHITECTURE.md).

**How to use:** Execute phases **in order** unless a note says otherwise. Each phase lists deliverables and acceptance criteria. Mark progress in project tracking or commits per phase.

**Line-count note:** This file is kept under 1000 lines; if future edits grow it past that, split by phase into `docs/plan/NN-phase-name.md` and keep this file as an index only.

---

## Phase 0 — Repository alignment

**Goal:** Match README’s intended structure and baseline tooling.

**Deliverables:**

- [ ] Add `src/features/` with placeholder `README.md` explaining feature module conventions (exports, colocation).
- [ ] Add `src/hooks/` (empty or with `README.md`) for cross-feature hooks.
- [ ] Ensure ESLint/TypeScript paths resolve `@/` to `src/` (verify `tsconfig`).
- [ ] Document in `docs/` or README: “features vs components” rule (already in ARCHITECTURE).

**Acceptance:** `npm run build` and `npm run tsc` pass; folder layout matches README tree.

---

## Phase 1 — Database schema & RLS

**Goal:** Extend PostgreSQL beyond existing auth profile data; add Supabase RLS for issues and audit foundation.

**Already in Supabase (do not rename without migration):**

- Table **`user_profiles`**: `id` (PK, FK → `auth.users.id`), `email` (unique), `role` (`app_role`), `full_name`, `created_at`, `updated_at`.
- Enum **`app_role`** — use for all role checks in RLS and app types.

**Deliverables:**

- [x] Design **new** tables: `issue_statuses`, `issues` (FK → `user_profiles`, soft delete), `audit_log`; indexes — see `supabase/migrations/20260403140000_phase1_issues_audit_statuses.sql`.
- [x] Migration SQL in repo + **how to apply**: [SUPABASE_PHASE1.md](./SUPABASE_PHASE1.md).
- [x] **You apply** the migration in your Supabase project (SQL Editor or CLI), then verify RLS with the checks in that doc.
- [x] Optional: trigger on `auth.users` for `user_profiles` — copy/paste block in [SUPABASE_PHASE1.md](./SUPABASE_PHASE1.md) only if you do not already create profiles on signup.

**Acceptance:** Unprivileged user cannot read others’ issues where policy forbids; admin can manage per spec; no policy relies only on client input.

---

## Phase 2 — Auth hardening & session

**Goal:** Reliable session refresh, logout, and consistent protection.

**Deliverables:**

- [x] Add Supabase session refresh in middleware (or Next.js 16–compatible pattern per current `@supabase/ssr` docs) — align with existing `src/proxy.ts` / intl middleware without breaking locale routing.
- [x] Server Actions: `signOut` clearing session; wire logout control in `PagesLayout` or header (visible when authenticated).
- [x] Central helper `getSession()` / `requireUser()` / `requireRole()` in `src/lib/auth/` (or `src/lib/supabase/`) using server Supabase client.
- [x] Replace ad-hoc dashboard checks with shared helper.

**Acceptance:** Logged-out user cannot load protected routes; session persists across navigations; logout clears session.

---

## Phase 3 — RBAC API surface

**Goal:** Typed, reusable authorization for Server Actions and pages.

**Deliverables:**

- [x] TypeScript types for `AppRole` and user context object.
- [x] `assertRole(user, ['admin', 'super_admin'])` style helpers; use in every admin/super_admin Server Action entry point.
- [x] Map `user_profiles.role` (`app_role`) from Supabase session + DB read where needed; document if using custom JWT claims later.

**Acceptance:** No admin-only action callable without server-side role check; unit tests optional but recommended for helpers.

---

## Phase 4 — Issues domain (server)

**Goal:** Server Actions + types for issue CRUD and lifecycle.

**Deliverables:**

- [x] `src/features/issues/` — types (`Issue`, filters), Zod or similar validation for inputs.
- [x] Server Actions: create, update, transition status, assign (admin), list with cursor/offset pagination parameters.
- [x] Use `revalidatePath` / `revalidateTag` where RSC pages show issue lists.
- [x] Error mapping to user-safe messages (i18n keys).

**Acceptance:** Actions respect RLS; failing validation returns field errors; success paths invalidate or refetch consistently.

---

## Phase 5 — TanStack Query setup

**Goal:** Client cache layer for lists and detail as per README.

**Deliverables:**

- [x] Install `@tanstack/react-query`; add `QueryClientProvider` in app providers (client boundary near root layout).
- [x] Define query key factories under `src/features/issues/keys.ts`.
- [x] Hooks: `useIssuesList`, `useIssueDetail` calling Server Actions or route handlers (prefer Server Actions + `useQuery` with serialized data).

**Acceptance:** No duplicate fetches on navigation without reason; loading/error states definable; devtools optional in dev.

---

## Phase 6 — Issues UI (table & filters)

**Goal:** Large-dataset UX with TanStack Table.

**Deliverables:**

- [x] Route segment `src/app/[locale]/issues/` (or under dashboard): list page using table component.
- [x] TanStack Table: sorting, column visibility, pagination; **virtualization** if row count threshold exceeded.
- [x] Filters: status, assignee, search debounced; sync state to URL search params for shareable links.
- [x] Responsive layout with Mantine.

**Acceptance:** Smooth scroll with test data volume; filters work with server pagination; accessible table headers and keyboard.

---

## Phase 7 — Issue detail & optimistic updates

**Goal:** Detail view and snappy status updates.

**Deliverables:**

- [x] `issues/[id]/page.tsx` (or modal pattern) with RSC prefetch + client detail.
- [x] Optimistic updates for status change via TanStack Query `onMutate` / rollback on error.
- [x] Conflict handling if server rejects transition.

**Acceptance:** UI rolls back on failure; toast or inline error; permissions hide illegal actions.

---

## Phase 8 — Admin workflows

**Goal:** Admin capabilities from README.

**Deliverables:**

- [x] Admin routes under `src/app/[locale]/admin/` (layout wraps role check).
- [x] User management: list users, change roles (admin/super_admin only as per spec).
- [x] Status management: CRUD issue statuses if stored in DB; else skip.
- [x] Assignment UI integrated with issues list/detail.

**Acceptance:** Non-admin cannot access admin URLs; RLS + server checks both enforce.

---

## Phase 9 — Super admin & demo reset

**Goal:** Super Admin features.

**Deliverables:**

- [x] Super-admin-only settings page (feature flags, env-backed toggles).
- [x] “Reset demo data” Server Action: truncate or repopulate seed tables; guard with `super_admin` only; confirm modal.
- [x] Audit log entry for reset.

**Acceptance:** Demo reset cannot be triggered by lower roles; destructive action logged.

---

## Phase 10 — Audit trail

**Goal:** Activity & audit visibility.

**Deliverables:**

- [x] `audit_log` table if not done in Phase 1; helper `logAudit({ ... })` called from Server Actions.
- [x] Admin UI: filterable audit list (TanStack Table or simple list with pagination).
- [x] Optional: issue-level activity tab sourcing audit entries for that entity.

**Acceptance:** Critical actions produce rows; immutability (no updates/deletes from app).

---

## Phase 11 — Email (Resend)

**Goal:** Notifications per README.

**Deliverables:**

- [x] Add Resend SDK; extend `src/lib/env.ts` with `RESEND_API_KEY` (server-only, not `NEXT_PUBLIC_`).
- [x] Email templates (React email or HTML strings) for 1–2 events (e.g. assignment).
- [x] Send from Server Action or queue pattern; handle failures gracefully (log, don’t fail main mutation if email fails — decide policy).

**Acceptance:** Staging can send test email; production keys not exposed to client.

---

## Phase 12 — Performance & DX polish

**Goal:** Scalable, optimized end state.

**Deliverables:**

- [ ] DB indexes reviewed for list/filter/sort queries.
- [ ] Next.js `loading.tsx` / `error.tsx` for major segments.
- [ ] Image/font already configured; verify Lighthouse basics.
- [ ] Bundle: dynamic import heavy admin routes if needed.

**Acceptance:** No obvious N+1 query patterns; LCP acceptable on list page with realistic data.

---

## Phase 13 — Quality gates

**Goal:** Sustainable maintenance.

**Deliverables:**

- [ ] Critical path E2E (Playwright) optional: login → list → open issue.
- [ ] Update README with env vars (Resend, Supabase) and role seeding instructions.
- [ ] CHANGELOG entries per release.

**Acceptance:** New contributor can run app and understand role model.

---

## Dependency graph (quick reference)

```text
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
              ↘ 8 → 9 → 10
                    ↘ 11
4–11 → 12 → 13
```

Phases 8–11 can overlap **after** Phase 3 is done, but **do not** skip 1–2 for anything touching data or auth.

---

## Files to create (summary)

| Area       | Examples                                                                   |
| ---------- | -------------------------------------------------------------------------- |
| Features   | `src/features/issues/**`, `src/features/admin/**`, `src/features/audit/**` |
| Auth       | `src/lib/auth/**` or extend `src/lib/supabase/**`                          |
| DB         | `supabase/migrations/**` (if using CLI)                                    |
| App routes | `src/app/[locale]/issues/**`, `admin/**`                                   |
| Providers  | client wrapper component for React Query near root layout                  |

---

_Last updated: Phases 1–11 delivered in app code (issues, audit, admin, Resend hooks); Phase 0 placeholder README/hooks optional; Phases 12–13 polish and quality gates remain._
