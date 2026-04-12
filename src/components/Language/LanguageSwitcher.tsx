"use client";

import { Select } from "@mantine/core";
import classNames from "classnames";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import classes from "./LanguageSwitcher.module.scss";

const LanguageSwitcher = () => {
  const t = useTranslations("ui.language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const data = routing.locales.map((value) => ({
    value,
    label: t(`${value}Flag`),
  }));

  const handleChange = (value: string | null) => {
    if (!value || value === locale) {
      return;
    }

    startTransition(() => {
      router.replace(pathname, { locale: value });
    });
  };

  return (
    <Select
      aria-label={t("label")}
      data={data}
      value={locale}
      onChange={handleChange}
      allowDeselect={false}
      size="sm"
      w={72}
      disabled={isPending}
      renderOption={({ option, checked }) => (
        <span
          className={classNames(classes.option, {
            [classes.selected]: checked,
          })}
        >
          <span className={classes.flag} aria-hidden="true">
            {option.label}
          </span>
          <span className={classes.srOnly}>{t(option.value)}</span>
        </span>
      )}
    />
  );
};

export default LanguageSwitcher;
