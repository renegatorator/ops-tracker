"use client";

import {
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoonStars, IconSun } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const t = useTranslations("ui.themeToggle");
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const [mounted, setMounted] = useState(false);
  const isDark = computedColorScheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setColorScheme(isDark ? "light" : "dark");
  };

  return (
    <Tooltip label={isDark ? t("toLight") : t("toDark")}>
      <ActionIcon
        variant="subtle"
        size="lg"
        aria-label={t("aria")}
        onClick={handleToggle}
      >
        {mounted ? (
          isDark ? (
            <IconSun size={18} />
          ) : (
            <IconMoonStars size={18} />
          )
        ) : (
          <IconMoonStars size={18} />
        )}
      </ActionIcon>
    </Tooltip>
  );
};

export default ThemeToggle;
