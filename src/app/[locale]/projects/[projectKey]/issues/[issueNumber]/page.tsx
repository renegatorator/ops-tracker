import { Container, Paper, Stack, Title } from "@mantine/core";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getIssue } from "@/features/issues/actions";
import IssueDetailPanel from "@/features/issues/components/IssueDetailPanel";
import { issueQueryKeys } from "@/features/issues/keys";
import {
  canEditIssueDetails,
  canUserTransitionIssueStatus,
} from "@/features/issues/permissions";
import { prefetchIssueDetailPageQueries } from "@/features/issues/prefetch-issue-queries";
import type { IssueWithStatus } from "@/features/issues/types";
import * as projectService from "@/features/projects/service";
import { redirect } from "@/i18n/navigation";
import { getUserAuthContext } from "@/lib/auth/session";
import { isAdminAccessRole } from "@/lib/auth/types";
import {
  projectIssuesPath,
  routes,
} from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface ProjectIssueDetailPageProps {
  params: Promise<{ locale: string; projectKey: string; issueNumber: string }>;
}

export const generateMetadata = async ({
  params,
}: ProjectIssueDetailPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.projects);
};

const ProjectIssueDetailPage = async ({
  params,
}: ProjectIssueDetailPageProps) => {
  const { locale, projectKey, issueNumber: issueNumberRaw } = await params;
  const key = decodeURIComponent(projectKey);
  const issueNumber = Number.parseInt(issueNumberRaw, 10);
  if (!Number.isFinite(issueNumber) || issueNumber < 1) {
    notFound();
  }

  const ctx = await getUserAuthContext();
  if (!ctx) {
    return redirect({ href: routes.login, locale });
  }

  const proj = await projectService.getProjectByKey({ key });
  if (!proj.ok) {
    notFound();
  }

  const issueResult = await getIssue(locale, {
    projectKey: proj.data.key,
    issueNumber,
  });
  if (!issueResult.ok) {
    notFound();
  }
  const issueId = issueResult.data.id;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  const canViewIssueAudit = isAdminAccessRole(ctx.role);

  await prefetchIssueDetailPageQueries(queryClient, locale, issueId, {
    prefetchIssueAudit: canViewIssueAudit,
  });

  const issue = queryClient.getQueryData<IssueWithStatus>(
    issueQueryKeys.detail(locale, issueId),
  );
  const canTransitionStatus =
    issue != null ? canUserTransitionIssueStatus(ctx, issue) : false;
  const canAssignIssue = isAdminAccessRole(ctx.role);
  const canEditDetails =
    issue != null ? canEditIssueDetails(ctx, issue) : false;

  const t = await getTranslations({ locale, namespace: "issues" });
  const backHref = projectIssuesPath(proj.data.key);

  return (
    <Container size="md" py="xl">
      <Paper withBorder p="lg" radius="md">
        <Stack gap="md">
          <Title order={2}>{t("detailTitle")}</Title>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <IssueDetailPanel
              locale={locale}
              issueId={issueId}
              canTransitionStatus={canTransitionStatus}
              canAssignIssue={canAssignIssue}
              canEditDetails={canEditDetails}
              canViewIssueAudit={canViewIssueAudit}
              backHref={backHref}
            />
          </HydrationBoundary>
        </Stack>
      </Paper>
    </Container>
  );
};

export default ProjectIssueDetailPage;
