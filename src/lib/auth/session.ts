import { redirect } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

import { type AppRole, AppRoleValues, parseAppRole, type UserAuthContext } from "./types";

export type { AppRole, UserAuthContext } from "./types";

type ProfileData = { role: AppRole; fullName: string | null };

const fetchProfile = async (userId: string): Promise<ProfileData | null> => {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[auth] user_profiles select failed:",
        error.message,
        error.code,
      );
    }
    return null;
  }

  if (!profile) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[auth] user_profiles: no row visible for",
        userId,
        "(missing row, id mismatch, or RLS blocked read — SQL Editor often bypasses RLS)",
      );
    }
    return null;
  }

  const role = parseAppRole(profile.role);
  if (role == null) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[auth] user_profiles.role not recognized (expected ${AppRoleValues.join("|")}):`,
        profile.role,
      );
    }
    return null;
  }
  return {
    role,
    fullName: (profile.full_name as string | null) ?? null,
  };
};

export const getSession = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user: user ?? null };
};

/**
 * Signed-in user plus `user_profiles.role` and `full_name` from the database. No redirects.
 * Use in Server Actions: if null, return an unauthorized result; then `assertRole(ctx, AdminAccessRoles)` (or `SuperAdminRoles`) for gated actions.
 */
export const getUserAuthContext = async (): Promise<UserAuthContext | null> => {
  const { user } = await getSession();
  if (!user) return null;
  const profile = await fetchProfile(user.id);
  if (profile == null) return null;
  return { user, role: profile.role, fullName: profile.fullName };
};

export const requireUser = async (locale: string) => {
  const { user } = await getSession();
  if (!user) {
    return redirect({ href: routes.login, locale });
  }
  return user;
};

/**
 * Ensures the user is signed in and their `user_profiles.role` is one of `allowed`.
 * Redirects to login if unauthenticated or profile missing; to dashboard if role not allowed.
 */
export const requireRole = async (
  locale: string,
  allowed: readonly AppRole[],
) => {
  const user = await requireUser(locale);
  const profile = await fetchProfile(user.id);

  if (profile == null) {
    return redirect({ href: routes.login, locale });
  }

  if (!allowed.includes(profile.role)) {
    return redirect({ href: routes.dashboard, locale });
  }

  return { user, role: profile.role, fullName: profile.fullName };
};
