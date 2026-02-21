import "server-only";

import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";

type KnownRoute = "/" | "/dashboard";

const routeToSeoKey: Record<KnownRoute, string> = {
  "/": "home",
  "/dashboard": "dashboard",
};

function stripLocaleFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (hasLocale(routing.locales, first)) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return pathname || "/";
}

function getLocalizedPath(locale: string, pathname: string): string {
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

export async function getLocalizedSeoMetadata(
  locale: string,
  pathname: string,
): Promise<Metadata> {
  const normalizedPath = stripLocaleFromPath(pathname);
  const seoKey = routeToSeoKey[normalizedPath as KnownRoute] ?? "default";
  const t = await getTranslations({
    locale,
    namespace: `seo.routes.${seoKey}`,
  });

  const localizedPath = getLocalizedPath(locale, normalizedPath);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: localizedPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [
          item,
          getLocalizedPath(item, normalizedPath),
        ]),
      ),
    },
  };
}
