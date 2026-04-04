"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const signOutAction = async (
  locale: string,
  _formData: FormData,
) => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
};
