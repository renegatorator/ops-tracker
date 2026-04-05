import { Stack, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import { AdminAuditLogPanel } from "@/features/audit/components/AdminAuditLogPanel";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface AdminAuditPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: AdminAuditPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, "/admin/audit");
};

const AdminAuditPage = async ({ params }: AdminAuditPageProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <Stack gap="md" w="100%">
      <Title order={3}>{t("audit.title")}</Title>
      <AdminAuditLogPanel locale={locale} />
    </Stack>
  );
};

export default AdminAuditPage;
