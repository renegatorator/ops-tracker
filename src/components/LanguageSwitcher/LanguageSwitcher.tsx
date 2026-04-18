"use client";

import { Menu, UnstyledButton } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import ReactCountryFlag from "react-country-flag";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: "GB",
  si: "SI",
  de: "DE",
};

const Flag = ({ locale, size = 16 }: { locale: string; size?: number }) => (
  <ReactCountryFlag
    countryCode={LOCALE_TO_COUNTRY[locale] ?? locale.toUpperCase()}
    svg
    style={{
      width: size * 1.33,
      height: size,
      borderRadius: 2,
      display: "block",
    }}
  />
);

const LanguageSwitcher = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (value: string) => {
    if (value === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: value });
    });
  };

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <UnstyledButton
          aria-label={t("ui.language.label")}
          disabled={isPending}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 6px",
            borderRadius: 6,
            border: "1px solid var(--mantine-color-default-border)",
            background: "var(--mantine-color-default)",
            opacity: isPending ? 0.6 : 1,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          <Flag locale={locale} />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {routing.locales.map((value) => (
          <Menu.Item
            key={value}
            leftSection={<Flag locale={value} size={18} />}
            onClick={() => switchLocale(value)}
            fw={value === locale ? 700 : 400}
          >
            {t(`ui.language.${value}`)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

export default LanguageSwitcher;
