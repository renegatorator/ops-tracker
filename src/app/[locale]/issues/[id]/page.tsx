import { Container, Paper, Stack, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import PagesLayout from "@/components/Layout/PagesLayout";
import { IssueDetailPanel } from "@/features/issues/components/IssueDetailPanel";
import { requireUser } from "@/lib/auth/session";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface IssueDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export const generateMetadata = async ({
  params,
}: IssueDetailPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, "/issues");
};

const IssueDetailPage = async ({ params }: IssueDetailPageProps) => {
  const { locale, id } = await params;
  await requireUser(locale);
  const t = await getTranslations({ locale, namespace: "issues" });

  return (
    <PagesLayout>
      <Container size="md" py="xl">
        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            <Title order={2}>{t("detailTitle")}</Title>
            <IssueDetailPanel locale={locale} issueId={id} />
          </Stack>
        </Paper>
      </Container>
    </PagesLayout>
  );
};

export default IssueDetailPage;
