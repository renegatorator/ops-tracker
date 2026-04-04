import { Stack, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import { AdminUsersPanel } from "@/features/users/components/AdminUsersPanel";
import { getUserAuthContext } from "@/lib/auth/session";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface AdminUsersPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: AdminUsersPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, "/admin/users");
};

const AdminUsersPage = async ({ params }: AdminUsersPageProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  const ctx = await getUserAuthContext();
  const isSuperAdmin = ctx?.role === "super_admin";

  return (
    <Stack gap="md" w="100%">
      <Title order={3}>{t("users.title")}</Title>
      <AdminUsersPanel locale={locale} isSuperAdmin={isSuperAdmin} />
    </Stack>
  );
};

export default AdminUsersPage;
