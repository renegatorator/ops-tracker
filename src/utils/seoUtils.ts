import "server-only";

import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { localizedPath } from "@/i18n/localized-path";
import { routing } from "@/i18n/routing";
import { routes } from "@/lib/routes";

type KnownRoute =
  | typeof routes.home
  | typeof routes.dashboard
  | typeof routes.issues
  | typeof routes.admin
  | typeof routes.adminUsers
  | typeof routes.adminStatuses
  | typeof routes.adminSettings
  | typeof routes.adminAudit;

const routeToSeoKey: Record<KnownRoute, string> = {
  [routes.home]: "home",
  [routes.dashboard]: "dashboard",
  [routes.issues]: "issues",
  [routes.admin]: "admin",
  [routes.adminUsers]: "adminUsers",
  [routes.adminStatuses]: "adminStatuses",
  [routes.adminSettings]: "adminSettings",
  [routes.adminAudit]: "adminAudit",
};

const stripLocaleFromPath = (pathname: string): string => {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (hasLocale(routing.locales, first)) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return pathname || "/";
};

const getLocalizedPath = (locale: string, pathname: string): string =>
  localizedPath(locale, pathname);

export const getLocalizedSeoMetadata = async (
  locale: string,
  pathname: string,
): Promise<Metadata> => {
  const normalizedPath = stripLocaleFromPath(pathname);
  const seoKey = routeToSeoKey[normalizedPath as KnownRoute] ?? "default";
  const t = await getTranslations({
    locale,
    namespace: `seo.routes.${seoKey}`,
  });

  const canonicalPath = getLocalizedPath(locale, normalizedPath);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [
          item,
          getLocalizedPath(item, normalizedPath),
        ]),
      ),
    },
  };
};
