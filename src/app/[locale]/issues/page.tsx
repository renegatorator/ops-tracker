import { Container, List, Paper, Stack, Text, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import PagesLayout from "@/components/Layout/PagesLayout";
import { listIssues } from "@/features/issues/actions";
import { requireUser } from "@/lib/auth/session";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

type Props = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: Props) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, "/issues");
};

const IssuesPage = async ({ params }: Props) => {
  const { locale } = await params;
  await requireUser(locale);
  const t = await getTranslations({ locale, namespace: "issues" });
  const result = await listIssues(locale, {
    mode: "offset",
    offset: 0,
    limit: 20,
  });

  return (
    <PagesLayout>
      <Container size="md" py="xl">
        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            <Title order={2}>{t("pageTitle")}</Title>
            {!result.ok ? (
              <Text c="red">{t(result.errorKey)}</Text>
            ) : result.data.items.length === 0 ? (
              <Text c="dimmed">{t("empty")}</Text>
            ) : (
              <List listStyleType="disc" spacing="xs" withPadding>
                {result.data.items.map((row) => (
                  <List.Item key={row.id}>
                    <Text span fw={600}>
                      {row.title}
                    </Text>
                    {row.issue_statuses?.name ? (
                      <Text span c="dimmed" size="sm" ml="xs">
                        ({row.issue_statuses.name})
                      </Text>
                    ) : null}
                  </List.Item>
                ))}
              </List>
            )}
          </Stack>
        </Paper>
      </Container>
    </PagesLayout>
  );
};

export default IssuesPage;
