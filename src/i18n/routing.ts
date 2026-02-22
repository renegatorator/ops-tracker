import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "si", "de"],
  defaultLocale: "en",
  localePrefix: "always",
});
