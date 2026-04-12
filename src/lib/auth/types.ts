import type { User } from "@supabase/supabase-js";

/**
 * Application roles; literals must match Postgres enum `app_role` in Supabase (`user_profiles.role`).
 *
 * **Source of truth on the server:** `user_profiles.role` loaded per request (see `getUserAuthContext`).
 * You may add JWT custom claims later to avoid an extra read; keep RLS and critical checks aligned with the DB.
 */
export type AppRole = "user" | "admin" | "super_admin";

export const APP_ROLES: readonly AppRole[] = [
  "user",
  "admin",
  "super_admin",
] as const;

export type UserAuthContext = {
  user: User;
  role: AppRole;
};

export const parseAppRole = (value: unknown): AppRole | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return APP_ROLES.includes(normalized as AppRole)
    ? (normalized as AppRole)
    : null;
};
