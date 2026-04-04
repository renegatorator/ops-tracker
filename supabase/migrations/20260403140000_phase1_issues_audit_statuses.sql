-- Phase 1: issue workflow + audit foundation
-- Prerequisites:
--   - public.user_profiles exists with id -> auth.users.id
--   - public.app_role enum includes at least: user, admin, super_admin
-- If your enum labels differ, replace string literals and casts below before running.

-- ---------------------------------------------------------------------------
-- issue_statuses (admin-managed workflow steps)
-- ---------------------------------------------------------------------------
create table public.issue_statuses (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.issue_statuses is 'Ordered workflow states for issues; CRUD restricted to admins.';

-- ---------------------------------------------------------------------------
-- issues
-- ---------------------------------------------------------------------------
create table public.issues (
  id uuid primary key default gen_random_uuid (),
  title text not null,
  description text,
  status_id uuid not null references public.issue_statuses (id) on delete restrict,
  reporter_id uuid not null references public.user_profiles (id) on delete restrict,
  assignee_id uuid references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.issues is 'Operations / incident records; RLS enforces role-based access.';

create index issues_status_id_idx on public.issues (status_id)
where
  deleted_at is null;

create index issues_assignee_id_idx on public.issues (assignee_id)
where
  deleted_at is null;

create index issues_reporter_id_idx on public.issues (reporter_id)
where
  deleted_at is null;

create index issues_created_at_idx on public.issues (created_at desc)
where
  deleted_at is null;

-- ---------------------------------------------------------------------------
-- audit_log (append-only; read for admins)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.user_profiles (id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is 'Security and workflow events; insert as actor; select for admins.';

create index audit_log_created_at_idx on public.audit_log (created_at desc);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at () returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger issues_set_updated_at
before update on public.issues for each row
execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- Seed default statuses (idempotent on slug)
-- ---------------------------------------------------------------------------
insert into public.issue_statuses (name, slug, sort_order, is_terminal)
values
  ('Open', 'open', 0, false),
  ('In progress', 'in_progress', 10, false),
  ('Resolved', 'resolved', 20, true),
  ('Closed', 'closed', 30, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.issue_statuses enable row level security;

alter table public.issues enable row level security;

alter table public.audit_log enable row level security;

-- Helper: current user is admin or super_admin (reads own user_profiles row)
-- app_role compared via text so migration survives minor enum renames if you adjust literals above.

-- issue_statuses: read for any signed-in user
create policy "issue_statuses_select_authenticated" on public.issue_statuses for
select
  to authenticated using (true);

-- issue_statuses: write for admin / super_admin
create policy "issue_statuses_write_admin" on public.issue_statuses for insert to authenticated
with
  check (
    exists (
      select
        1
      from
        public.user_profiles up
      where
        up.id = auth.uid ()
        and (up.role)::text in ('admin', 'super_admin')
    )
  );

create policy "issue_statuses_update_admin" on public.issue_statuses for
update to authenticated using (
  exists (
    select
      1
    from
      public.user_profiles up
    where
      up.id = auth.uid ()
      and (up.role)::text in ('admin', 'super_admin')
  )
)
with
  check (
    exists (
      select
        1
      from
        public.user_profiles up
      where
        up.id = auth.uid ()
        and (up.role)::text in ('admin', 'super_admin')
    )
  );

create policy "issue_statuses_delete_admin" on public.issue_statuses for delete to authenticated using (
  exists (
    select
      1
    from
      public.user_profiles up
    where
      up.id = auth.uid ()
      and (up.role)::text in ('admin', 'super_admin')
  )
);

-- issues: select — non-deleted for everyone; soft-deleted visible to admins only
create policy "issues_select_visible" on public.issues for
select
  to authenticated using (
    deleted_at is null
    or exists (
      select
        1
      from
        public.user_profiles up
      where
        up.id = auth.uid ()
        and (up.role)::text in ('admin', 'super_admin')
    )
  );

-- issues: insert — reporter must be self
create policy "issues_insert_reporter_self" on public.issues for insert to authenticated
with
  check (
    reporter_id = auth.uid ()
  );

-- issues: update — admins any row; users only if involved and not deleted
create policy "issues_update_admin" on public.issues for
update to authenticated using (
  exists (
    select
      1
    from
      public.user_profiles up
    where
      up.id = auth.uid ()
      and (up.role)::text in ('admin', 'super_admin')
  )
)
with
  check (
    exists (
      select
        1
      from
        public.user_profiles up
      where
        up.id = auth.uid ()
        and (up.role)::text in ('admin', 'super_admin')
    )
  );

create policy "issues_update_member" on public.issues for
update to authenticated using (
  deleted_at is null
  and (
    reporter_id = auth.uid ()
    or assignee_id = auth.uid ()
  )
  and exists (
    select
      1
    from
      public.user_profiles up
    where
      up.id = auth.uid ()
      and (up.role)::text = 'user'
  )
)
with
  check (
    deleted_at is null
    and (
      reporter_id = auth.uid ()
      or assignee_id = auth.uid ()
    )
    and exists (
      select
        1
      from
        public.user_profiles up
      where
        up.id = auth.uid ()
        and (up.role)::text = 'user'
    )
  );

-- issues: delete — admins only (hard delete)
create policy "issues_delete_admin" on public.issues for delete to authenticated using (
  exists (
    select
      1
    from
      public.user_profiles up
    where
      up.id = auth.uid ()
      and (up.role)::text in ('admin', 'super_admin')
  )
);

-- audit_log: insert as self
create policy "audit_log_insert_self" on public.audit_log for insert to authenticated
with
  check (actor_id = auth.uid ());

-- audit_log: read for admins
create policy "audit_log_select_admin" on public.audit_log for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.user_profiles up
      where
        up.id = auth.uid ()
        and (up.role)::text in ('admin', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- API access (Supabase PostgREST uses the authenticated role under RLS)
-- ---------------------------------------------------------------------------
grant
select
,
insert,
update,
delete on table public.issue_statuses to authenticated;

grant
select,
insert,
update,
delete on table public.issues to authenticated;

grant
select,
insert on table public.audit_log to authenticated;
