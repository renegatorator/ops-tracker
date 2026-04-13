import { Container, Paper } from "@mantine/core";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import IssueDetailPanel from "@/features/issues/components/IssueDetailPanel";
import { issueQueryKeys } from "@/features/issues/keys";
import {
  canEditIssueDetails,
  canUserTransitionIssueStatus,
} from "@/features/issues/permissions";
import { prefetchIssueDetailPageQueries } from "@/features/issues/prefetch-issue-queries";
import type { IssueWithStatus } from "@/features/issues/types";
import { redirect } from "@/i18n/navigation";
import { getUserAuthContext } from "@/lib/auth/session";
import { isAdminAccessRole } from "@/lib/auth/types";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface IssueDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export const generateMetadata = async ({
  params,
}: IssueDetailPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.issues);
};

const IssueDetailPage = async ({ params }: IssueDetailPageProps) => {
  const { locale, id } = await params;
  const ctx = await getUserAuthContext();
  if (!ctx) {
    return redirect({ href: routes.login, locale });
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  const canViewIssueAudit = isAdminAccessRole(ctx.role);

  await prefetchIssueDetailPageQueries(queryClient, locale, id, {
    prefetchIssueAudit: canViewIssueAudit,
  });

  const issue = queryClient.getQueryData<IssueWithStatus>(
    issueQueryKeys.detail(locale, id),
  );
  const canTransitionStatus =
    issue != null ? canUserTransitionIssueStatus(ctx, issue) : false;
  const canAssignIssue = isAdminAccessRole(ctx.role);
  const canEditDetails =
    issue != null ? canEditIssueDetails(ctx, issue) : false;

  return (
    <Container size="md" py="xl">
      <Paper withBorder p="lg" radius="md">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <IssueDetailPanel
            locale={locale}
            issueId={id}
            canTransitionStatus={canTransitionStatus}
            canAssignIssue={canAssignIssue}
            canEditDetails={canEditDetails}
            canViewIssueAudit={canViewIssueAudit}
          />
        </HydrationBoundary>
      </Paper>
    </Container>
  );
};

export default IssueDetailPage;
