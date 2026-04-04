import { Container, Paper, Stack, Title } from "@mantine/core";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import PagesLayout from "@/components/Layout/PagesLayout";
import { IssueDetailPanel } from "@/features/issues/components/IssueDetailPanel";
import { issueQueryKeys } from "@/features/issues/keys";
import { canUserTransitionIssueStatus } from "@/features/issues/permissions";
import { prefetchIssueDetailPageQueries } from "@/features/issues/prefetch-issue-queries";
import type { IssueWithStatus } from "@/features/issues/types";
import { getUserAuthContext } from "@/lib/auth/session";
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
  const ctx = await getUserAuthContext();
  if (!ctx) {
    redirect(`/${locale}/login`);
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  await prefetchIssueDetailPageQueries(queryClient, locale, id);

  const issue = queryClient.getQueryData<IssueWithStatus>(
    issueQueryKeys.detail(locale, id),
  );
  const canTransitionStatus =
    issue != null ? canUserTransitionIssueStatus(ctx, issue) : false;

  const t = await getTranslations({ locale, namespace: "issues" });

  return (
    <PagesLayout>
      <Container size="md" py="xl">
        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            <Title order={2}>{t("detailTitle")}</Title>
            <HydrationBoundary state={dehydrate(queryClient)}>
              <IssueDetailPanel
                locale={locale}
                issueId={id}
                canTransitionStatus={canTransitionStatus}
              />
            </HydrationBoundary>
          </Stack>
        </Paper>
      </Container>
    </PagesLayout>
  );
};

export default IssueDetailPage;
