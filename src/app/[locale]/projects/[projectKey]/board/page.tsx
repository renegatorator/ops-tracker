import { Container, Paper, Stack, Title } from "@mantine/core";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import ProjectBoardPageClient from "@/features/projects/components/ProjectBoardPageClient";
import * as projectService from "@/features/projects/service";
import { redirect } from "@/i18n/navigation";
import { getUserAuthContext } from "@/lib/auth/session";
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

  const t = await getTranslations({ locale, namespace: "projects.board" });

  return (
    <Container size="xl" py="md">
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Title order={3}>{t("pageTitle", { key: proj.data.key })}</Title>
          <ProjectBoardPageClient
            locale={locale}
            projectId={proj.data.id}
            projectKey={proj.data.key}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default ProjectBoardPage;
