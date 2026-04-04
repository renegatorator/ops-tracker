-- Phase 8: user_profiles policies for admin user management (defense in depth with app checks).
-- Apply after public.user_profiles and app_role exist.
-- Enable RLS on user_profiles when your signup/profile path is compatible, e.g.:
--   alter table public.user_profiles enable row level security;
-- If policies already exist, drop or rename duplicates before running.

-- SELECT: own row or admin / super_admin may list all profiles
create policy "phase8_user_profiles_select_self_or_admin" on public.user_profiles for
select
  to authenticated using (
    id = auth.uid ()
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

-- UPDATE: super_admin may change any profile (including role)
create policy "phase8_user_profiles_update_super_admin" on public.user_profiles for
update to authenticated using (
  exists (
    select
      1
    from
      public.user_profiles up
    where
      up.id = auth.uid ()
      and (up.role)::text = 'super_admin'
  )
)
with
  check (true);

-- UPDATE: admin may change only rows whose current role is user; new role must stay user or admin
create policy "phase8_user_profiles_update_admin_user_rows" on public.user_profiles for
update to authenticated using (
  exists (
    select
      1
    from
      public.user_profiles up
    where
      up.id = auth.uid ()
      and (up.role)::text = 'admin'
  )
  and (user_profiles.role)::text = 'user'
)
with
  check ((role)::text in ('user', 'admin'));
