import { Container, Paper, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import PagesLayout from "@/components/Layout/PagesLayout";
import { requireUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: DashboardPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.dashboard);
};

const DashboardPage = async ({ params }: DashboardPageProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const user = await requireUser(locale);

  return (
    <PagesLayout>
      <Container size="sm" py="xl">
        <Paper withBorder p="lg" radius="md">
          <Stack gap="sm">
            <Title order={2}>{t("title")}</Title>
            <Text>{t("description")}</Text>
            <Text fw={600}>
              {t("signedInAs", { email: user.email ?? "-" })}
            </Text>
          </Stack>
        </Paper>
      </Container>
      <Link href={routes.issues}>Issues</Link>
    </PagesLayout>
  );
};

export default DashboardPage;
