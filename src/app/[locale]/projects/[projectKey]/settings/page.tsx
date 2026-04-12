import { Container, Paper, Stack, Text, Title } from "@mantine/core";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import ProjectSettingsPageClient from "@/features/projects/components/ProjectSettingsPageClient";
import * as projectService from "@/features/projects/service";
import { redirect } from "@/i18n/navigation";
import { getUserAuthContext } from "@/lib/auth/session";
import { isAdminAccessRole } from "@/lib/auth/types";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface ProjectSettingsPageProps {
  params: Promise<{ locale: string; projectKey: string }>;
}

export const generateMetadata = async ({ params }: ProjectSettingsPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.projects);
};

const ProjectSettingsPage = async ({ params }: ProjectSettingsPageProps) => {
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

  const t = await getTranslations({ locale, namespace: "projects.settings" });
  const canManage = isAdminAccessRole(ctx.role);

  return (
    <Container size="md" py="md">
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Title order={3}>{t("pageTitle", { name: proj.data.name })}</Title>
          {canManage ? (
            <ProjectSettingsPageClient
              locale={locale}
              projectId={proj.data.id}
              projectKey={proj.data.key}
            />
          ) : (
            <Text c="dimmed">{t("adminOnly")}</Text>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default ProjectSettingsPage;
