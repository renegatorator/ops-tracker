import { Container, Paper, Stack, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import WorkspaceRouteLayout from "@/components/Layout/WorkspaceRouteLayout";
import AdminSubnav from "@/features/admin/components/AdminSubnav";
import { requireRole } from "@/lib/auth/session";
import { AdminAccessRoles, isSuperAdminRole } from "@/lib/auth/types";

const AdminLayout = async ({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<unknown>;
}) => {
  const { locale } = (await params) as { locale: string };
  const { role } = await requireRole(locale, AdminAccessRoles);
  const t = await getTranslations({ locale });
  const showSuperSettings = isSuperAdminRole(role);

  return (
    <WorkspaceRouteLayout params={params as Promise<{ locale: string }>}>
      <Container size="lg" py="xl">
        <Paper withBorder p={{ base: "sm", sm: "lg" }} radius="md" w="100%">
          <Stack gap="md">
            <Title order={2}>{t("admin.title")}</Title>
            <AdminSubnav showSuperSettings={showSuperSettings} />
            {children}
          </Stack>
        </Paper>
      </Container>
    </WorkspaceRouteLayout>
  );
};

export default AdminLayout;
