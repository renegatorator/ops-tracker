import { NextRequest, NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function getPreferredLocale(request: NextRequest): string {
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
}

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;

    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
