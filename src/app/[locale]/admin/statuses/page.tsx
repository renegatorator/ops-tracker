import { Stack, Title } from "@mantine/core";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { RouteLoading } from "@/components/RouteLoading";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

const AdminIssueStatusesPanel = dynamic(
  () =>
    import("@/features/issues/components/AdminIssueStatusesPanel").then(
      (m) => ({
        default: m.AdminIssueStatusesPanel,
      }),
    ),
  { loading: () => <RouteLoading compact /> },
);

interface AdminStatusesPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: AdminStatusesPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, "/admin/statuses");
};

const AdminStatusesPage = async ({ params }: AdminStatusesPageProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <Stack gap="md" w="100%">
      <Title order={3}>{t("statuses.pageTitle")}</Title>
      <AdminIssueStatusesPanel locale={locale} />
    </Stack>
  );
};

export default AdminStatusesPage;
