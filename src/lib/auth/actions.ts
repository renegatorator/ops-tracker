"use server";

import { redirect } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const signOutAction = async (
  locale: string,
  _formData: FormData,
) => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect({ href: routes.login, locale });
};
