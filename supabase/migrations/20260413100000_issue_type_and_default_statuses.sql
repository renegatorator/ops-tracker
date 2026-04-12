-- Add issue_type enum + column; upsert default workflow statuses.
-- Safe to run multiple times (idempotent).

-- ---------------------------------------------------------------------------
-- issue_type enum
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'issue_type' and typnamespace = 'public'::regnamespace
  ) then
    create type public.issue_type as enum ('bug', 'ticket');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- issue_type column on issues (default 'ticket' for existing rows)
-- ---------------------------------------------------------------------------
alter table public.issues
  add column if not exists issue_type public.issue_type not null default 'ticket';

-- ---------------------------------------------------------------------------
-- Default workflow statuses (upsert by slug so re-running is safe)
-- Desired set: Open → In Progress → Ready for Deployment → Testing → Done
-- ---------------------------------------------------------------------------
insert into public.issue_statuses (name, slug, sort_order, is_terminal)
values
  ('Open',                   'open',                  0,  false),
  ('In Progress',            'in_progress',           10, false),
  ('Ready for Deployment',   'ready_for_deployment',  20, false),
  ('Testing',                'testing',               30, false),
  ('Done',                   'done',                  40, true)
on conflict (slug) do update
  set
    name       = excluded.name,
    sort_order = excluded.sort_order,
    is_terminal = excluded.is_terminal;
