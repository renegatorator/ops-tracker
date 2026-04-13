"use client";

import { ActionIcon, Group, Tooltip } from "@mantine/core";
import {
  IconLayoutKanban,
  IconSettings,
  IconTable,
} from "@tabler/icons-react";
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

  const isSettings = pathname === settings || pathname.startsWith(`${settings}/`);
  const isIssues = !isSettings && (pathname === issues || pathname.startsWith(`${issues}/`));
  const isBoard = !isSettings && !isIssues;

  return (
    <Group justify="space-between" align="center" mb="xs" wrap="nowrap">
      <Group gap={4}>
        <Tooltip label={t("board")} position="bottom" withArrow>
          <ActionIcon
            component={Link}
            href={board}
            variant={isBoard ? "filled" : "subtle"}
            color={isBoard ? "blue" : "gray"}
            size="lg"
            aria-label={t("board")}
            style={
              isBoard
                ? { boxShadow: "0 0 6px 1px color-mix(in srgb, var(--mantine-color-blue-5) 60%, transparent)" }
                : undefined
            }
          >
            <IconLayoutKanban size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={t("issues")} position="bottom" withArrow>
          <ActionIcon
            component={Link}
            href={issues}
            variant={isIssues ? "filled" : "subtle"}
            color={isIssues ? "blue" : "gray"}
            size="lg"
            aria-label={t("issues")}
            style={
              isIssues
                ? { boxShadow: "0 0 6px 1px color-mix(in srgb, var(--mantine-color-blue-5) 60%, transparent)" }
                : undefined
            }
          >
            <IconTable size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Tooltip label={t("settings")} position="left" withArrow>
        <ActionIcon
          component={Link}
          href={settings}
          variant={isSettings ? "filled" : "subtle"}
          color={isSettings ? "blue" : "gray"}
          size="lg"
          aria-label={t("settings")}
          style={
            isSettings
              ? { boxShadow: "0 0 6px 1px color-mix(in srgb, var(--mantine-color-blue-5) 60%, transparent)" }
              : undefined
          }
        >
          <IconSettings size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};

export default ProjectSubnav;
