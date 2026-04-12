import type { User } from "@supabase/supabase-js";

/** Literals must match Postgres enum `app_role` in Supabase (`user_profiles.role`). */
export const APP_ROLE = {
  user: "user",
  admin: "admin",
  super_admin: "super_admin",
} as const;

export type AppRole = (typeof APP_ROLE)[keyof typeof APP_ROLE];

export const APP_ROLES: readonly AppRole[] = [
  APP_ROLE.user,
  APP_ROLE.admin,
  APP_ROLE.super_admin,
] as const;

/** `/admin` layout and shared admin server actions (admin or super_admin). */
export const ADMIN_ACCESS_ROLES = [
  APP_ROLE.admin,
  APP_ROLE.super_admin,
] as const;

/** Super-admin-only routes and mutations. */
export const SUPER_ADMIN_ROLES = [APP_ROLE.super_admin] as const;

export const isAdminAccessRole = (role: AppRole): boolean =>
  (ADMIN_ACCESS_ROLES as readonly AppRole[]).includes(role);

export const isSuperAdminRole = (role: AppRole): boolean =>
  role === APP_ROLE.super_admin;

/** Signed-in user plus `user_profiles.role` and `full_name` from the database (see `getUserAuthContext`). */
export type UserAuthContext = {
  user: User;
  role: AppRole;
  fullName: string | null;
};

export const parseAppRole = (value: unknown): AppRole | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return APP_ROLES.includes(normalized as AppRole)
    ? (normalized as AppRole)
    : null;
};
