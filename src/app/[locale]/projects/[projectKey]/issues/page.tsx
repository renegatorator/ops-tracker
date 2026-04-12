import { Container, Group, Paper, Stack, Title } from "@mantine/core";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import IssuesListPageClient from "@/features/issues/components/IssuesListPageClient";
import * as projectService from "@/features/projects/service";
import { redirect } from "@/i18n/navigation";
import { getUserAuthContext } from "@/lib/auth/session";
import { isAdminAccessRole } from "@/lib/auth/types";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

import { ProjectIssuesHeaderActions } from "./ProjectIssuesHeaderActions";

interface ProjectIssuesPageProps {
  params: Promise<{ locale: string; projectKey: string }>;
}

export const generateMetadata = async ({ params }: ProjectIssuesPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.projects);
};

const ProjectIssuesPage = async ({ params }: ProjectIssuesPageProps) => {
  const { locale, projectKey } = await params;
  const key = decodeURIComponent(projectKey);
  const ctx = await getUserAuthContext();
  if (!ctx) {
    return redirect({ href: routes.login, locale });
  }

  const proj = await projectService.getProjectByKey({ key });
  if (!proj.ok) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "projects.issues" });
  const canListAllAssignees = isAdminAccessRole(ctx.role);

  return (
    <Container size="xl" py="md">
      <Paper withBorder p={{ base: "sm", sm: "lg" }} radius="md" w="100%">
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap">
            <Title order={3}>{t("title", { name: proj.data.name })}</Title>
            <ProjectIssuesHeaderActions
              locale={locale}
              projectId={proj.data.id}
              projectKey={proj.data.key}
            />
          </Group>
          <IssuesListPageClient
            locale={locale}
            currentUserId={ctx.user.id}
            canListAllAssignees={canListAllAssignees}
            forcedProjectId={proj.data.id}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default ProjectIssuesPage;
