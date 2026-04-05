import { Stack, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import { AdminIssueStatusesPanel } from "@/features/issues/components/AdminIssueStatusesPanel";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

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
