-- Fix 42P17 infinite recursion on user_profiles RLS when policies use
-- EXISTS (SELECT ... FROM user_profiles ...): each inner scan re-evaluates
-- the same policies. Use SECURITY DEFINER helpers so the role lookup runs
-- with definer rights and bypasses RLS on that read.

create or replace function public.ops_auth_is_super_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select
      1
    from
      public.user_profiles
    where
      id = auth.uid ()
      and (role)::text = 'super_admin'
  );
$$;

create or replace function public.ops_auth_is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select
      1
    from
      public.user_profiles
    where
      id = auth.uid ()
      and (role)::text = 'admin'
  );
$$;

create or replace function public.ops_auth_is_staff ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select
      1
    from
      public.user_profiles
    where
      id = auth.uid ()
      and (role)::text in ('admin', 'super_admin')
  );
$$;

revoke all on function public.ops_auth_is_super_admin () from public;

revoke all on function public.ops_auth_is_admin () from public;

revoke all on function public.ops_auth_is_staff () from public;

grant execute on function public.ops_auth_is_super_admin () to authenticated;

grant execute on function public.ops_auth_is_admin () to authenticated;

grant execute on function public.ops_auth_is_staff () to authenticated;

drop policy if exists "phase8_user_profiles_select_self_or_admin" on public.user_profiles;

drop policy if exists "phase8_user_profiles_update_super_admin" on public.user_profiles;

drop policy if exists "phase8_user_profiles_update_admin_user_rows" on public.user_profiles;

-- SELECT: own row or staff may list all profiles (no self-referential EXISTS)
create policy "phase8_user_profiles_select_self_or_admin" on public.user_profiles for
select
  to authenticated using (
    id = auth.uid ()
    or public.ops_auth_is_staff ()
  );

-- UPDATE: super_admin may change any profile
create policy "phase8_user_profiles_update_super_admin" on public.user_profiles for
update to authenticated using (public.ops_auth_is_super_admin ())
with
  check (true);

-- UPDATE: admin may change only rows whose current role is user
create policy "phase8_user_profiles_update_admin_user_rows" on public.user_profiles for
update to authenticated using (
  public.ops_auth_is_admin ()
  and (user_profiles.role)::text = 'user'
)
with
  check ((role)::text in ('user', 'admin'));

comment on function public.ops_auth_is_super_admin () is 'RLS helper: current auth user is super_admin (bypasses RLS on read).';
comment on function public.ops_auth_is_admin () is 'RLS helper: current auth user is admin (bypasses RLS on read).';
comment on function public.ops_auth_is_staff () is 'RLS helper: current auth user is admin or super_admin (bypasses RLS on read).';
