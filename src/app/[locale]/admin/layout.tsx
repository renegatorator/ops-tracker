import { Anchor, Container, Group, Stack, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import PagesLayout from "@/components/Layout/PagesLayout";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ACCESS_ROLES, isSuperAdminRole } from "@/lib/auth/types";
import { routes } from "@/lib/routes";

const AdminLayout = async ({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<unknown>;
}) => {
  const { locale } = (await params) as { locale: string };
  const { role } = await requireRole(locale, ADMIN_ACCESS_ROLES);
  const t = await getTranslations({ locale, namespace: "admin" });
  const showSuperSettings = isSuperAdminRole(role);

  return (
    <PagesLayout>
      <Container size="lg" py="xl" w="100%">
        <Stack gap="lg" w="100%" maw={960}>
          <Title order={2}>{t("title")}</Title>
          <Group gap="md">
            <Anchor component={Link} href={routes.admin} size="sm">
              {t("nav.overview")}
            </Anchor>
            <Anchor component={Link} href={routes.adminUsers} size="sm">
              {t("nav.users")}
            </Anchor>
            <Anchor component={Link} href={routes.adminStatuses} size="sm">
              {t("nav.statuses")}
            </Anchor>
            <Anchor component={Link} href={routes.adminAudit} size="sm">
              {t("nav.audit")}
            </Anchor>
            {showSuperSettings ? (
              <Anchor component={Link} href={routes.adminSettings} size="sm">
                {t("nav.settings")}
              </Anchor>
            ) : null}
          </Group>
          {children}
        </Stack>
      </Container>
    </PagesLayout>
  );
};

export default AdminLayout;
