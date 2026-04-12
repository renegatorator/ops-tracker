import { Stack, Text, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface AdminHomePageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: AdminHomePageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.admin);
};

const AdminHomePage = async ({ params }: AdminHomePageProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <Stack gap="sm">
      <Title order={3}>{t("overview.title")}</Title>
      <Text c="dimmed">{t("overview.description")}</Text>
    </Stack>
  );
};

export default AdminHomePage;
