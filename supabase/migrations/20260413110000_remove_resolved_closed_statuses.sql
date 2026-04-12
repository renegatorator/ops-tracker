-- Remove legacy "resolved" and "closed" statuses.
-- Any issues still on those statuses are reassigned to "done" before deletion.

do $$
declare
  v_done_id uuid;
begin
  select id into v_done_id
  from public.issue_statuses
  where slug = 'done'
  limit 1;

  if v_done_id is null then
    raise exception 'Cannot remove statuses: "done" status not found.';
  end if;

  update public.issues
  set status_id = v_done_id
  where status_id in (
    select id from public.issue_statuses where slug in ('resolved', 'closed')
  );

  delete from public.issue_statuses
  where slug in ('resolved', 'closed');
end;
$$;
