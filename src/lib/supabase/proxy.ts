import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";

import { env } from "@/lib/env";

/**
 * Refreshes the auth session and applies Set-Cookie on `response`.
 * Call after building the final NextResponse (e.g. from next-intl).
 */
export const refreshSupabaseSession = async (
  request: NextRequest,
  response: NextResponse,
) => {
  const supabase = createServerClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
};
