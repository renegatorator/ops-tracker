"use client";

import {
  AppShell,
  Badge,
  Burger,
  Divider,
  Group,
  Select,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useProjectsList } from "@/features/projects/hooks/useProjectsList";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { projectBoardPath, routes } from "@/lib/routes";

interface WorkspaceShellClientProps {
  locale: string;
  isStaff: boolean;
  headerRight: ReactNode;
  children: React.ReactNode;
}

const OpsTrackerLogo = () => (
  <span style={{ display: "block", flexShrink: 0, lineHeight: 0 }}>
    {/* Inline display:none; CSS overrides to block for the active scheme */}
    <Image
      src="/logo-light.svg"
      alt="Ops Tracker"
      width={103}
      height={28}
      className="ops-logo-light"
      style={{ display: "none" }}
      unoptimized
    />
    <Image
      src="/logo-dark.svg"
      alt=""
      aria-hidden="true"
      width={103}
      height={28}
      className="ops-logo-dark"
      style={{ display: "none" }}
      unoptimized
    />
  </span>
);

const WorkspaceShellClient = ({
  locale,
  isStaff,
  headerRight,
  children,
}: WorkspaceShellClientProps) => {
  const t = useTranslations("workspace.nav");
  const pathname = usePathname();
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure();

  const isAdmin = pathname.startsWith("/admin");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: projects = [] } = useProjectsList(locale);

  const projectMatch = useMemo(() => {
    const m = pathname.match(/^\/projects\/([^/]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }, [pathname]);

  const projectSwitcherData = useMemo(
    () =>
      projects.map((p) => ({
        value: p.key,
        label: `${p.key} — ${p.name}`,
      })),
    [projects],
  );

  const onProjectChange = useCallback(
    (key: string | null) => {
      if (!key) return;
      router.push(projectBoardPath(key));
    },
    [router],
  );

  const navBtn = (href: string, label: string) => (
    <UnstyledButton
      component={Link}
      href={href}
      px="xs"
      py={4}
      style={{ borderRadius: 4 }}
    >
      <Text size="sm" fw={pathname.startsWith(href) ? 700 : 400}>
        {label}
      </Text>
    </UnstyledButton>
  );

  const projectSwitcher =
    mounted && projectSwitcherData.length > 0 ? (
      <Select
        size="xs"
        maw={220}
        placeholder={t("projectPlaceholder")}
        data={projectSwitcherData}
        value={projectMatch}
        onChange={onProjectChange}
        clearable
        searchable
        comboboxProps={{ withinPortal: true }}
        aria-label={t("projectPlaceholder")}
      />
    ) : null;

  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
      navbar={{
        width: 280,
        breakpoint: "md",
        collapsed: { mobile: !opened, desktop: true },
      }}
    >
      {/* ── Header ── */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          {/* Left: burger (mobile) + logo + admin badge + divider + desktop nav */}
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="md"
              size="sm"
            />
            <Group gap="0" wrap="nowrap">
              <UnstyledButton component={Link} href={routes.dashboard}>
                <OpsTrackerLogo />
              </UnstyledButton>
              {isAdmin && (
                <Badge color="red" variant="filled" size="sm" radius="sm">
                  ADMIN
                </Badge>
              )}
            </Group>
            {/* Desktop nav links — separated by a vertical rule */}
            <Divider
              orientation="vertical"
              h={20}
              visibleFrom="md"
              style={{ alignSelf: "center" }}
            />
            <Group gap={4} visibleFrom="md" wrap="nowrap">
              {navBtn(routes.dashboard, t("dashboard"))}
              {navBtn(routes.projects, t("projects"))}
              {navBtn(routes.issues, t("issues"))}
              {isStaff ? navBtn(routes.admin, t("admin")) : null}
            </Group>
          </Group>

          {/* Right: project switcher + controls — desktop only */}
          <Group gap="sm" wrap="nowrap" visibleFrom="md">
            {projectSwitcher}
            {headerRight}
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── Mobile sidebar ── */}
      <AppShell.Navbar p="md" hiddenFrom="md">
        <Stack gap="xs" h="100%">
          {/* Nav links */}
          <Stack gap={4}>
            <UnstyledButton
              component={Link}
              href={routes.dashboard}
              onClick={close}
              py={6}
              px="xs"
              style={{ borderRadius: 4 }}
            >
              <Text size="sm" fw={pathname.startsWith(routes.dashboard) ? 700 : 400}>
                {t("dashboard")}
              </Text>
            </UnstyledButton>
            <UnstyledButton
              component={Link}
              href={routes.projects}
              onClick={close}
              py={6}
              px="xs"
              style={{ borderRadius: 4 }}
            >
              <Text
                size="sm"
                fw={pathname.startsWith(routes.projects) ? 700 : 400}
              >
                {t("projects")}
              </Text>
            </UnstyledButton>
            <UnstyledButton
              component={Link}
              href={routes.issues}
              onClick={close}
              py={6}
              px="xs"
              style={{ borderRadius: 4 }}
            >
              <Text size="sm" fw={pathname.startsWith(routes.issues) ? 700 : 400}>
                {t("issues")}
              </Text>
            </UnstyledButton>
            {isStaff ? (
              <UnstyledButton
                component={Link}
                href={routes.admin}
                onClick={close}
                py={6}
                px="xs"
                style={{ borderRadius: 4 }}
              >
                <Text
                  size="sm"
                  fw={pathname.startsWith(routes.admin) ? 700 : 400}
                >
                  {t("admin")}
                </Text>
              </UnstyledButton>
            ) : null}
          </Stack>

          {/* Project switcher */}
          {projectSwitcher && (
            <>
              <Divider />
              {projectSwitcher}
            </>
          )}

          {/* Controls: logout, language, theme */}
          <Divider />
          <Group gap="xs" wrap="wrap">
            {headerRight}
          </Group>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};

export default WorkspaceShellClient;
