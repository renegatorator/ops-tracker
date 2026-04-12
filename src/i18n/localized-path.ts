import { routing } from "./routing";

/**
 * URL path as seen in the browser with `localePrefix: "as-needed"`:
 * default locale (en) has no prefix; others use `/si/...`, `/de/...`.
 *
 * @param pathname path without locale segment, must start with `/` (e.g. `/issues`, `/login`, `/`)
 */
export const localizedPath = (locale: string, pathname: string): string => {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) {
    return p === "" ? "/" : p;
  }
  if (p === "/") {
    return `/${locale}`;
  }
  return `/${locale}${p}`;
};
