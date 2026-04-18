import { Container, Paper, Stack, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import IssuesListPageClient from "@/features/issues/components/IssuesListPageClient";
import { redirect } from "@/i18n/navigation";
import { getUserAuthContext } from "@/lib/auth/session";
import { isAdminAccessRole } from "@/lib/auth/types";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface IssuesPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: IssuesPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.issues);
};

const IssuesPage = async ({ params }: IssuesPageProps) => {
  const { locale } = await params;
  const ctx = await getUserAuthContext();
  if (!ctx) {
    return redirect({ href: routes.login, locale });
  }
  const t = await getTranslations({ locale });
  const canListAllAssignees = isAdminAccessRole(ctx.role);

  return (
    <Container size="xl" px={{ base: "xs", sm: "md" }} py="xl">
      <Paper withBorder p={{ base: "sm", sm: "lg" }} radius="md" w="100%">
        <Stack gap="md">
          <Title order={2}>{t("issues.pageTitle")}</Title>
          <IssuesListPageClient
            locale={locale}
            currentUserId={ctx.user.id}
            canListAllAssignees={canListAllAssignees}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default IssuesPage;
