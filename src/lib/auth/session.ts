import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { AppRole, UserAuthContext } from "./types";
import { parseAppRole } from "./types";

export type { AppRole, UserAuthContext } from "./types";

const fetchProfileRole = async (
  userId: string,
): Promise<AppRole | null> => {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || profile?.role == null) {
    return null;
  }
  return parseAppRole(profile.role);
};

export const getSession = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user: user ?? null };
};

/**
 * Signed-in user plus `user_profiles.role` from the database. No redirects.
 * Use in Server Actions: if null, return an unauthorized result; then `assertRole(ctx, [...])` for admin paths.
 */
export const getUserAuthContext = async (): Promise<UserAuthContext | null> => {
  const { user } = await getSession();
  if (!user) return null;
  const role = await fetchProfileRole(user.id);
  if (role == null) return null;
  return { user, role };
};

export const requireUser = async (locale: string) => {
  const { user } = await getSession();
  if (!user) {
    redirect(`/${locale}/login`);
  }
  return user;
};

/**
 * Ensures the user is signed in and their `user_profiles.role` is one of `allowed`.
 * Redirects to login if unauthenticated or profile missing; to dashboard if role not allowed.
 */
export const requireRole = async (locale: string, allowed: AppRole[]) => {
  const user = await requireUser(locale);
  const role = await fetchProfileRole(user.id);

  if (role == null) {
    redirect(`/${locale}/login`);
  }

  if (!allowed.includes(role)) {
    redirect(`/${locale}/dashboard`);
  }

  return { user, role };
};
