import { Container, Paper, Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import PagesLayout from "@/components/Layout/PagesLayout";
import { createClient } from "@/lib/supabase/server";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, "/dashboard");
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

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
    </PagesLayout>
  );
}
