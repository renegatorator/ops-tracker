-- Projects, project membership, scoped issues (Jira-like), RLS refresh.
-- Requires: phase1 issues, ops_auth_is_staff() from fix_user_profiles migration.

-- ---------------------------------------------------------------------------
-- Enums + tables
-- ---------------------------------------------------------------------------
create type public.project_member_role as enum ('lead', 'member');

create table public.projects (
  id uuid primary key default gen_random_uuid (),
  key text not null unique,
  name text not null,
  description text,
  created_by uuid not null references public.user_profiles (id) on delete restrict,
  archived_at timestamptz,
  last_issue_number integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_key_format check (key ~ '^[A-Z][A-Z0-9]{1,9}$'::text)
);

comment on table public.projects is 'Work containers; keys used in human-readable issue refs (e.g. OPS-12).';

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  role public.project_member_role not null default 'member'::public.project_member_role,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

comment on table public.project_members is 'Project access; RLS gates issues visibility.';

create index project_members_user_id_idx on public.project_members (user_id);

-- ---------------------------------------------------------------------------
-- issues: new columns (nullable until backfill)
-- ---------------------------------------------------------------------------
alter table public.issues
  add column if not exists project_id uuid references public.projects (id) on delete restrict;

alter table public.issues
  add column if not exists issue_number integer;

alter table public.issues
  add column if not exists issue_key text;

create index if not exists issues_project_id_idx on public.issues (project_id)
where
  deleted_at is null;

create index if not exists issues_project_status_idx on public.issues (project_id, status_id)
where
  deleted_at is null;

-- ---------------------------------------------------------------------------
-- updated_at on projects
-- ---------------------------------------------------------------------------
create trigger projects_set_updated_at
before update on public.projects for each row
execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- Default project + membership for all existing profiles (safe backfill)
-- ---------------------------------------------------------------------------
insert into public.projects (key, name, description, created_by)
select
  'OPS',
  'Default',
  'Migrated workspace for existing issues.',
  (
    select
      id
    from
      public.user_profiles
    order by
      created_at asc
    limit
      1
  )
where
  not exists (
    select
      1
    from
      public.projects p
    where
      p.key = 'OPS'
  );

insert into
  public.project_members (project_id, user_id, role)
select
  p.id,
  up.id,
  'member'::public.project_member_role
from
  public.projects p
  cross join public.user_profiles up
where
  p.key = 'OPS'
on conflict do nothing;

-- Promote project creator to lead on OPS
update public.project_members pm
set
  role = 'lead'::public.project_member_role
from
  public.projects p
where
  pm.project_id = p.id
  and p.key = 'OPS'
  and pm.user_id = p.created_by;

update public.issues i
set
  project_id = p.id
from
  public.projects p
where
  p.key = 'OPS'
  and i.project_id is null;

-- issue_number per project by created_at
-- NOTE: the UPDATE target alias (i) must not appear inside the FROM/JOIN; join projects via numbered.project_id.
with
  numbered as (
    select
      id,
      project_id,
      row_number() over (
        partition by
          project_id
        order by
          created_at asc,
          id asc
      ) as n
    from
      public.issues
    where
      project_id is not null
  )
update public.issues i
set
  issue_number = numbered.n,
  issue_key = p.key || '-' || numbered.n::text
from
  numbered
  join public.projects p on p.id = numbered.project_id
where
  i.id = numbered.id;

update public.projects p
set
  last_issue_number = coalesce(
    (
      select
        max(i.issue_number)
      from
        public.issues i
      where
        i.project_id = p.id
    ),
    0
  )
where
  p.key = 'OPS';

alter table public.issues
  alter column project_id set not null;

alter table public.issues
  alter column issue_number set not null;

alter table public.issues
  alter column issue_key set not null;

create unique index if not exists issues_project_issue_number_uidx on public.issues (project_id, issue_number);

-- ---------------------------------------------------------------------------
-- RLS helper: staff OR member of project (bypasses RLS on project_members read)
-- ---------------------------------------------------------------------------
create or replace function public.ops_auth_can_access_project (p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.ops_auth_is_staff ()
  or exists (
    select
      1
    from
      public.project_members pm
    where
      pm.project_id = p_project_id
      and pm.user_id = auth.uid ()
  );
$$;

revoke all on function public.ops_auth_can_access_project (uuid) from public;

grant execute on function public.ops_auth_can_access_project (uuid) to authenticated;

comment on function public.ops_auth_can_access_project (uuid) is 'RLS helper: staff or member of given project.';

-- ---------------------------------------------------------------------------
-- Triggers: issue_number / issue_key; membership consistency
-- ---------------------------------------------------------------------------
create or replace function public.issues_before_insert_set_number ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_num integer;
  k text;
begin
  if new.project_id is null then
    raise exception 'project_id required';
  end if;

  if new.issue_number is null then
    update public.projects
    set
      last_issue_number = last_issue_number + 1
    where
      id = new.project_id
    returning last_issue_number into new_num;

    new.issue_number := new_num;
  else
    update public.projects
    set
      last_issue_number = greatest(last_issue_number, new.issue_number)
    where
      id = new.project_id;
  end if;

  select
    p.key into k
  from
    public.projects p
  where
    p.id = new.project_id;

  new.issue_key := k || '-' || new.issue_number::text;
  return new;
end;
$$;

create trigger issues_before_insert_set_number
before insert on public.issues for each row
execute function public.issues_before_insert_set_number ();

create or replace function public.issues_before_write_check_members ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select
      1
    from
      public.project_members pm
    where
      pm.project_id = new.project_id
      and pm.user_id = new.reporter_id
  ) then
    raise exception 'reporter must be a project member';
  end if;

  if new.assignee_id is not null
  and not exists (
    select
      1
    from
      public.project_members pm
    where
      pm.project_id = new.project_id
      and pm.user_id = new.assignee_id
  ) then
    raise exception 'assignee must be a project member (or null)';
  end if;

  return new;
end;
$$;

create trigger issues_before_insert_check_members
before insert on public.issues for each row
execute function public.issues_before_write_check_members ();

create trigger issues_before_update_check_members
before update on public.issues for each row
execute function public.issues_before_write_check_members ();

-- Keep issue_key in sync if project key or number changes (rare)
create or replace function public.issues_before_update_sync_key ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
begin
  if new.project_id is distinct from old.project_id
  or new.issue_number is distinct from old.issue_number then
    select
      p.key into k
    from
      public.projects p
    where
      p.id = new.project_id;

    new.issue_key := k || '-' || new.issue_number::text;
  end if;

  return new;
end;
$$;

create trigger issues_before_update_sync_key
before update on public.issues for each row
execute function public.issues_before_update_sync_key ();

-- ---------------------------------------------------------------------------
-- RLS: projects
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;

create policy "projects_select_access" on public.projects for
select
  to authenticated using (public.ops_auth_can_access_project (id));

create policy "projects_insert_staff" on public.projects for insert to authenticated
with
  check (public.ops_auth_is_staff ());

create policy "projects_update_staff" on public.projects for
update to authenticated using (public.ops_auth_is_staff ())
with
  check (public.ops_auth_is_staff ());

create policy "projects_delete_staff" on public.projects for delete to authenticated using (public.ops_auth_is_staff ());

-- ---------------------------------------------------------------------------
-- RLS: project_members
-- ---------------------------------------------------------------------------
alter table public.project_members enable row level security;

create policy "project_members_select_access" on public.project_members for
select
  to authenticated using (public.ops_auth_can_access_project (project_id));

create policy "project_members_write_staff" on public.project_members for insert to authenticated
with
  check (public.ops_auth_is_staff ());

create policy "project_members_update_staff" on public.project_members for
update to authenticated using (public.ops_auth_is_staff ())
with
  check (public.ops_auth_is_staff ());

create policy "project_members_delete_staff" on public.project_members for delete to authenticated using (public.ops_auth_is_staff ());

-- ---------------------------------------------------------------------------
-- RLS: issues (replace Phase 1 policies)
-- ---------------------------------------------------------------------------
drop policy if exists "issues_select_visible" on public.issues;

drop policy if exists "issues_insert_reporter_self" on public.issues;

drop policy if exists "issues_update_admin" on public.issues;

drop policy if exists "issues_update_member" on public.issues;

drop policy if exists "issues_delete_admin" on public.issues;

create policy "issues_select_visible" on public.issues for
select
  to authenticated using (
    (
      deleted_at is null
      and public.ops_auth_can_access_project (project_id)
    )
    or (
      deleted_at is not null
      and public.ops_auth_is_staff ()
    )
  );

create policy "issues_insert_reporter_self" on public.issues for insert to authenticated
with
  check (
    reporter_id = auth.uid ()
    and public.ops_auth_can_access_project (project_id)
  );

create policy "issues_update_admin" on public.issues for
update to authenticated using (public.ops_auth_is_staff ())
with
  check (public.ops_auth_is_staff ());

create policy "issues_update_member" on public.issues for
update to authenticated using (
  deleted_at is null
  and public.ops_auth_can_access_project (project_id)
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
    and public.ops_auth_can_access_project (project_id)
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

create policy "issues_delete_admin" on public.issues for delete to authenticated using (public.ops_auth_is_staff ());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant
select,
insert,
update,
delete on table public.projects to authenticated;

grant
select,
insert,
update,
delete on table public.project_members to authenticated;
