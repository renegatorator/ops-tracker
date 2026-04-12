import { NextRequest, NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";
import { refreshSupabaseSession } from "./lib/supabase/proxy";

const intlMiddleware = createMiddleware(routing);

const getPreferredLocale = (request: NextRequest): string => {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (hasLocale(routing.locales, cookieLocale)) {
    return cookieLocale;
  }

  const acceptedLanguages =
    request.headers
      .get("accept-language")
      ?.split(",")
      .map((entry) => entry.split(";")[0]?.trim().toLowerCase()) ?? [];

  for (const language of acceptedLanguages) {
    if (!language) {
      continue;
    }

    if (hasLocale(routing.locales, language)) {
      return language;
    }

    const baseLanguage = language.split("-")[0];
    if (hasLocale(routing.locales, baseLanguage)) {
      return baseLanguage;
    }
  }

  return routing.defaultLocale;
};

const proxy = async (request: NextRequest) => {
  if (request.nextUrl.pathname === "/") {
    const locale = getPreferredLocale(request);
    if (locale !== routing.defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}`;
      const redirectResponse = NextResponse.redirect(url);
      return refreshSupabaseSession(request, redirectResponse);
    }
  }

  const response = intlMiddleware(request);
  return refreshSupabaseSession(request, response);
};

export default proxy;

export const config = {
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
