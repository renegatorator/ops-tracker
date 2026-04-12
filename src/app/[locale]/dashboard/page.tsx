import { Container, Paper } from "@mantine/core";

import DashboardOverview from "@/features/dashboard/components/DashboardOverview";
import { getDashboardData } from "@/features/dashboard/getDashboardData";
import { redirect } from "@/i18n/navigation";
import { getUserAuthContext } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: DashboardPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.dashboard);
};

const DashboardPage = async ({ params }: DashboardPageProps) => {
  const { locale } = await params;
  const ctx = await getUserAuthContext();
  if (!ctx) {
    return redirect({ href: routes.login, locale });
  }

  const data = await getDashboardData(ctx.user.id);

  return (
    <Container size="lg" py="xl">
      <Paper withBorder p={{ base: "sm", sm: "lg" }} radius="md" w="100%">
        <DashboardOverview
          data={data}
          email={ctx.user.email ?? ctx.user.id}
          fullName={ctx.fullName}
          locale={locale}
        />
      </Paper>
    </Container>
  );
};

export default DashboardPage;
