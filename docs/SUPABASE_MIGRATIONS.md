# Supabase — apply migrations & manual setup (Phases 1–12)

This project ships SQL under `supabase/migrations/`. Your Supabase project must already have **`public.user_profiles`**, enum **`app_role`**, and Auth users aligned with that table (see [ARCHITECTURE.md](./ARCHITECTURE.md)). The repo migrations add issues, audit, RLS, admin policies on profiles, and performance indexes.

---

## 1. Prerequisites (do this first)

1. In the [Supabase Dashboard](https://supabase.com/dashboard), open your project (or create one).
2. Confirm **`public.user_profiles`** exists with columns matching [ARCHITECTURE.md](./ARCHITECTURE.md) (`id` → `auth.users.id`, `email`, `role` as `app_role`, `full_name`, timestamps).
3. Confirm enum **`app_role`** includes at least: `user`, `admin`, `super_admin` (labels must match app and RLS SQL).
4. Ensure at least **one** auth user has a matching **`user_profiles`** row so you can sign in and run admin steps later.

If you have **no** `user_profiles` table yet, create it (and the enum) in the SQL Editor **before** running Phase 1 migration, for example:

```sql
-- Only if you do not already have app_role / user_profiles.
create type public.app_role as enum ('user', 'admin', 'super_admin');

create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role public.app_role not null default 'user'::public.app_role,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Then insert a row for your user after they sign up (see **section 6**), or add a trigger (see **section 7**).

---

## 2. Migration files (run in this order)

| Order | File | Purpose |
|------:|------|---------|
| 1 | `20260403140000_phase1_issues_audit_statuses.sql` | `issue_statuses`, `issues`, `audit_log`, RLS, baseline indexes |
| 2 | `20260405120000_user_profiles_admin_rls.sql` | RLS policies on `user_profiles` for admin user management |
| 3 | `20260411120000_phase12_list_sort_audit_indexes.sql` | Extra indexes for list/filter/sort and audit |
| 4 | `20260412140000_fix_user_profiles_rls_recursion.sql` | Fixes `42P17` RLS recursion on `user_profiles` (replaces Phase 8 `EXISTS` subqueries with `SECURITY DEFINER` helpers) |
| 5 | `20260412200000_projects_members_issues_scope.sql` | `projects`, `project_members`, `issues.project_id` / `issue_number` / `issue_key`, triggers, RLS refresh for project-scoped issues |

---

## 3. Apply migrations — Supabase SQL Editor (manual)

1. Dashboard → **SQL** → **New query**.
2. Open each migration file from this repo in order, **copy the entire file**, paste into the SQL Editor, **Run**.
3. Repeat for every file in the table above (order matters for fresh databases).
4. If a statement fails (e.g. “already exists”), read the error: you may have partially applied before. Fix duplicates or skip idempotent parts only if you know the current DB state.

---

## 4. Apply migrations — Supabase CLI (optional)

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) available via `npx`):

1. `npx supabase@latest login` (once on your machine).
2. `npm run db:link` and follow prompts to link this folder to your remote project (you may need `supabase init` first if you do not have a local `supabase/config.toml`; see Supabase docs for linking an existing project).
3. `npm run db:push` to apply pending migrations from `supabase/migrations/` to the linked database.

Use **`db:reset` only on local** dev databases; it can wipe data.

---

## 5. `user_profiles` RLS (after Phase 8 policies migration)

The Phase 8 migration **creates policies** but does **not** enable RLS by itself (your signup flow must allow inserts/reads as needed).

When your app already creates a profile row on signup and you are ready to lock down reads/updates:

1. In SQL Editor, run:

```sql
alter table public.user_profiles enable row level security;
```

2. Test immediately: sign up / sign in, confirm the app can still read the current user’s profile and that admins can list users. If something breaks, temporarily disable RLS in the Dashboard (**Table Editor** → `user_profiles` → RLS) only while debugging, then fix policies.

---

## 6. Roles & first Super Admin (manual)

RLS and Server Actions expect `user_profiles.role` to reflect reality.

1. Sign up or create a user in **Authentication** → **Users**.
2. Ensure a row exists in **`user_profiles`** with `id` = that user’s UUID (insert manually if you do not use a trigger).
3. Promote your account to **super_admin** (run in SQL Editor as a privileged session):

```sql
update public.user_profiles
set role = 'super_admin'::public.app_role
where email = 'your-admin@example.com';
```

4. Sign out and sign in again so the app reloads role from the database.

Admins can change roles for others from the app **after** the Phase 8 policies are applied and RLS is configured correctly.

---

## 7. Optional: auto-create `user_profiles` on signup

If you **do not** already create a profile in app code or an Edge Function, you can add a trigger on `auth.users` in SQL Editor (adjust schema if needed). Example pattern:

```sql
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, role)
  values (new.id, new.email, 'user'::public.app_role)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user ();
```

Grant and `security definer` details depend on your Supabase version; if the dashboard offers a “User signup” template, prefer that and align column names.

---

## 8. Environment variables (app + email)

1. Copy `.env.example` to `.env.local`.
2. Set **`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** from **Project Settings** → **API**.
3. Set **`NEXT_PUBLIC_SITE_URL`** to your deployed URL (or `http://localhost:3000` for local).
4. **Email (Phase 11):** optional — set **`RESEND_API_KEY`** and **`RESEND_FROM`** (verified sender in production). If unset, mutations still succeed; email is skipped.

`SUPABASE_DB_PASSWORD` in `.env.example` is only needed if you use tooling that connects to Postgres directly (not required for the Next.js app alone).

---

## 9. Quick verification checklist

- [ ] Tables **`issue_statuses`**, **`issues`**, **`audit_log`** exist; seed statuses present (Phase 1 inserts default slugs).
- [ ] Authenticated user can read **`issue_statuses`** and non-deleted **`issues`** per RLS.
- [ ] Admin can open **`/admin`** and list users (after Phase 8 + RLS as above).
- [ ] Optional: send a test email after Resend is configured.

---

## 10. Troubleshooting: `/issues` or `/admin` sends you to login

The **dashboard** only checks Supabase Auth. **Issues** and **admin** also load `user_profiles.role` through the **Supabase client** (PostgREST), which enforces **RLS** as the `authenticated` role.

The **SQL Editor** and **Table Editor** in the dashboard usually run with privileges that **bypass RLS**, so `select * from user_profiles` can show your row even when the app cannot read it.

**Fix:**

1. Confirm your app user id matches the profile row: in **Authentication → Users**, copy the user UUID and compare to `user_profiles.id`.
2. List policies: `select policyname, cmd, roles::text from pg_policies where schemaname = 'public' and tablename = 'user_profiles';`
3. Apply **`20260405120000_user_profiles_admin_rls.sql`** if you have not, so at least **select own row** (and admin rules) exist.
4. If RLS is enabled on `user_profiles` but policies are wrong, either fix policies or temporarily turn RLS off on that table only while debugging (not for production).

With **`npm run dev`**, the server logs a **`[auth] user_profiles:`** hint when no row is visible to the client (see `src/lib/auth/session.ts`).

If Postgres returns **`42P17` infinite recursion detected in policy for relation `user_profiles`**, the Phase 8 policies used `EXISTS (SELECT … FROM user_profiles …)`, which re-triggers RLS on the same table. Apply migration **`20260412140000_fix_user_profiles_rls_recursion.sql`** (adds `SECURITY DEFINER` helpers `ops_auth_is_*` and recreates the three Phase 8 policies without self-referential subqueries).

### Inspect policies from the CLI (linked project)

With the [Supabase CLI](https://supabase.com/docs/guides/cli) logged in and the repo linked (`npm run db:link` once), you can run read-only SQL against the **remote** database:

```bash
npx supabase db query --linked "select policyname, cmd, roles::text from pg_policies where schemaname = 'public' and tablename = 'user_profiles' order by policyname;"
```

Use the same command pattern for other checks (for example `relrowsecurity` on `pg_class`, or `information_schema.role_table_grants`).

---

## 11. Replacing the old doc name

Earlier plan text referenced `SUPABASE_PHASE1.md`. Use **this file** as the single place for apply order and manual steps for Phases **1–12** migrations in this repo.

---

## 12. `20260413100000_issue_type_and_default_statuses.sql`

**What it does:**

1. Creates a new Postgres enum `public.issue_type` with values `'bug'` and `'ticket'` (idempotent — skips if already exists).
2. Adds column `issue_type public.issue_type NOT NULL DEFAULT 'ticket'` to `public.issues`. Existing rows get `'ticket'`.
3. Upserts the canonical workflow statuses into `issue_statuses` by slug (safe to run multiple times):

| Name | Slug | Sort order | Terminal |
|---|---|---|---|
| Open | `open` | 0 | No |
| In Progress | `in_progress` | 10 | No |
| Ready for Deployment | `ready_for_deployment` | 20 | No |
| Testing | `testing` | 30 | No |
| Done | `done` | 40 | Yes |

**Apply in the Supabase SQL Editor or via CLI:**

```bash
npx supabase db push --linked
```
