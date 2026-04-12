"use client";

import { Box, Group } from "@mantine/core";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

interface AdminSubnavProps {
  showSuperSettings: boolean;
}

interface TabLinkProps {
  href: string;
  label: string;
  active: boolean;
}

const TabLink = ({ href, label, active }: TabLinkProps) => (
  <Box
    component={Link}
    href={href}
    style={{
      display: "inline-flex",
      alignItems: "center",
      paddingBottom: 10,
      paddingTop: 4,
      paddingLeft: 4,
      paddingRight: 4,
      borderBottom: active
        ? "2px solid var(--mantine-color-blue-filled)"
        : "2px solid transparent",
      textDecoration: "none",
      color: active
        ? "var(--mantine-color-blue-filled)"
        : "var(--mantine-color-dimmed)",
      fontWeight: active ? 600 : 400,
      fontSize: "var(--mantine-font-size-sm)",
      transition: "color 120ms ease, border-color 120ms ease",
    }}
  >
    {label}
  </Box>
);

const AdminSubnav = ({ showSuperSettings }: AdminSubnavProps) => {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  const is = (prefix: string) =>
    prefix === routes.admin
      ? pathname === routes.admin
      : pathname.startsWith(prefix);

  return (
    <Box
      style={{
        borderBottom: "1px solid var(--mantine-color-default-border)",
        marginBottom: "var(--mantine-spacing-md)",
      }}
    >
      <Group gap="lg" wrap="nowrap" style={{ overflowX: "auto" }}>
        <TabLink href={routes.admin} label={t("overview")} active={is(routes.admin)} />
        <TabLink href={routes.adminUsers} label={t("users")} active={is(routes.adminUsers)} />
        <TabLink href={routes.adminStatuses} label={t("statuses")} active={is(routes.adminStatuses)} />
        <TabLink href={routes.adminAudit} label={t("audit")} active={is(routes.adminAudit)} />
        {showSuperSettings && (
          <TabLink href={routes.adminSettings} label={t("settings")} active={is(routes.adminSettings)} />
        )}
      </Group>
    </Box>
  );
};

export default AdminSubnav;
