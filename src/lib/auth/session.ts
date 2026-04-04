import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "admin" | "super_admin";

export const getSession = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user: user ?? null };
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
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role == null) {
    redirect(`/${locale}/login`);
  }

  const role = profile.role as AppRole;
  if (!allowed.includes(role)) {
    redirect(`/${locale}/dashboard`);
  }

  return { user, role };
};
