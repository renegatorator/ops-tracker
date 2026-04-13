import { Container, Paper, Stack } from "@mantine/core";
import { notFound } from "next/navigation";

import ProjectBoardPageClient from "@/features/projects/components/ProjectBoardPageClient";
import * as projectService from "@/features/projects/service";
import { redirect } from "@/i18n/navigation";
import { getUserAuthContext } from "@/lib/auth/session";
import { isAdminAccessRole } from "@/lib/auth/types";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface ProjectBoardPageProps {
  params: Promise<{ locale: string; projectKey: string }>;
}

export const generateMetadata = async ({ params }: ProjectBoardPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.projects);
};

const ProjectBoardPage = async ({ params }: ProjectBoardPageProps) => {
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

  const isAdmin = isAdminAccessRole(ctx.role);

  return (
    <Container size="xl" py="md">
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <ProjectBoardPageClient
            locale={locale}
            projectId={proj.data.id}
            projectKey={proj.data.key}
            projectName={proj.data.name}
            isAdmin={isAdmin}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default ProjectBoardPage;
