"use client";

import { Button, Group } from "@mantine/core";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import {
  projectBoardPath,
  projectIssuesPath,
  projectSettingsPath,
} from "@/lib/routes";

interface ProjectSubnavProps {
  projectKey: string;
}

const ProjectSubnav = ({ projectKey }: ProjectSubnavProps) => {
  const t = useTranslations("projects.subnav");
  const pathname = usePathname();
  const board = projectBoardPath(projectKey);
  const issues = projectIssuesPath(projectKey);
  const settings = projectSettingsPath(projectKey);

  const variant = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
      ? "filled"
      : "light";

  return (
    <Group gap="xs" mb="md" wrap="wrap">
      <Button component={Link} href={board} variant={variant(board)} size="sm">
        {t("board")}
      </Button>
      <Button component={Link} href={issues} variant={variant(issues)} size="sm">
        {t("issues")}
      </Button>
      <Button
        component={Link}
        href={settings}
        variant={variant(settings)}
        size="sm"
      >
        {t("settings")}
      </Button>
    </Group>
  );
};

export default ProjectSubnav;
