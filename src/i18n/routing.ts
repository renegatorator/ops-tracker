import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "si", "de"],
  defaultLocale: "en",
  /** English URLs omit `/en` (e.g. `/issues`); `si` and `de` keep a prefix. */
  localePrefix: "as-needed",
});
