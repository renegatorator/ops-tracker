import type { User } from "@supabase/supabase-js";

/** Literals must match Postgres enum `app_role` in Supabase (`user_profiles.role`). */
export const AppRoles = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type AppRole = (typeof AppRoles)[keyof typeof AppRoles];

export const AppRoleValues: readonly AppRole[] = [
  AppRoles.USER,
  AppRoles.ADMIN,
  AppRoles.SUPER_ADMIN,
] as const;

/** `/admin` layout and shared admin server actions (admin or super_admin). */
export const AdminAccessRoles = [
  AppRoles.ADMIN,
  AppRoles.SUPER_ADMIN,
] as const;

/** Super-admin-only routes and mutations. */
export const SuperAdminRoles = [AppRoles.SUPER_ADMIN] as const;

export const isAdminAccessRole = (role: AppRole): boolean =>
  (AdminAccessRoles as readonly AppRole[]).includes(role);

export const isSuperAdminRole = (role: AppRole): boolean =>
  role === AppRoles.SUPER_ADMIN;

/** Signed-in user plus `user_profiles.role` and `full_name` from the database (see `getUserAuthContext`). */
export type UserAuthContext = {
  user: User;
  role: AppRole;
  fullName: string | null;
};

export const parseAppRole = (value: unknown): AppRole | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return AppRoleValues.includes(normalized as AppRole)
    ? (normalized as AppRole)
    : null;
};
