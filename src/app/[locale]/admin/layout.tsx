import { Anchor, Container, Group, Stack, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import PagesLayout from "@/components/Layout/PagesLayout";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth/session";

const AdminLayout = async ({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<unknown>;
}) => {
  const { locale } = (await params) as { locale: string };
  await requireRole(locale, ["admin", "super_admin"]);
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <PagesLayout>
      <Container size="lg" py="xl" w="100%">
        <Stack gap="lg" w="100%" maw={960}>
          <Title order={2}>{t("title")}</Title>
          <Group gap="md">
            <Anchor component={Link} href="/admin" size="sm">
              {t("nav.overview")}
            </Anchor>
            <Anchor component={Link} href="/admin/users" size="sm">
              {t("nav.users")}
            </Anchor>
            <Anchor component={Link} href="/admin/statuses" size="sm">
              {t("nav.statuses")}
            </Anchor>
          </Group>
          {children}
        </Stack>
      </Container>
    </PagesLayout>
  );
};

export default AdminLayout;
