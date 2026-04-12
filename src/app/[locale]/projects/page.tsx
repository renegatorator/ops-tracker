import { Container, Paper, Stack } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import ProjectsListPageClient from "@/features/projects/components/ProjectsListPageClient";
import { redirect } from "@/i18n/navigation";
import { getUserAuthContext } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: ProjectsPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.projects);
};

const ProjectsPage = async ({ params }: ProjectsPageProps) => {
  const { locale } = await params;
  const ctx = await getUserAuthContext();
  if (!ctx) {
    return redirect({ href: routes.login, locale });
  }
  await getTranslations({ locale, namespace: "projects.list" });

  return (
    <Container size="lg" py="xl">
      <Paper withBorder p={{ base: "sm", sm: "lg" }} radius="md" w="100%">
        <Stack gap="md">
          <ProjectsListPageClient locale={locale} userRole={ctx.role} />
        </Stack>
      </Paper>
    </Container>
  );
};

export default ProjectsPage;
