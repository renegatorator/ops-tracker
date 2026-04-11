-- Phase 12: indexes aligned with list/filter/sort queries in app services
-- Complements partial indexes from phase1 (status_id, assignee_id, created_at).

-- Issues list: default / updated sorts and tie-breaker id
create index if not exists issues_updated_at_idx on public.issues (updated_at desc, id desc)
where
  deleted_at is null;

create index if not exists issues_title_sort_idx on public.issues (title asc, id asc)
where
  deleted_at is null;

-- Filtered lists ordered by recency (common dashboard paths)
create index if not exists issues_status_created_id_idx on public.issues (
  status_id,
  created_at desc,
  id desc
)
where
  deleted_at is null;

create index if not exists issues_assignee_created_id_idx on public.issues (
  assignee_id,
  created_at desc,
  id desc
)
where
  deleted_at is null
  and assignee_id is not null;

-- Audit admin list: entity filter + newest first
create index if not exists audit_log_entity_created_idx on public.audit_log (entity_type, created_at desc);

-- Issue activity and similar: entity_type + entity_id + created_at (matches listAuditLogsForEntity-style filters)
create index if not exists audit_log_entity_type_id_created_idx on public.audit_log (
  entity_type,
  entity_id,
  created_at desc
);

comment on index public.issues_updated_at_idx is 'Phase 12: issues list sort by updated_at.';
comment on index public.issues_title_sort_idx is 'Phase 12: issues list sort by title.';
comment on index public.issues_status_created_id_idx is 'Phase 12: issues list filter by status_id + created_at order.';
comment on index public.issues_assignee_created_id_idx is 'Phase 12: issues list filter by assignee_id + created_at order.';
comment on index public.audit_log_entity_created_idx is 'Phase 12: audit list filter by entity_type + created_at order.';
comment on index public.audit_log_entity_type_id_created_idx is 'Phase 12: audit rows for entity_type + entity_id, newest first.';
