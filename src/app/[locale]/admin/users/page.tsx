import { Stack, Title } from "@mantine/core";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { RouteLoading } from "@/components/RouteLoading";
import { getUserAuthContext } from "@/lib/auth/session";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

const AdminUsersPanel = dynamic(
  () =>
    import("@/features/users/components/AdminUsersPanel").then((m) => ({
      default: m.AdminUsersPanel,
    })),
  { loading: () => <RouteLoading compact /> },
);

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
