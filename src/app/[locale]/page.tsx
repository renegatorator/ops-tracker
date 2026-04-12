import PagesLayout from "@/components/Layout/PagesLayout";
import LandingPage from "@/components/Pages/LandingPage";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomeProps) {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.home);
}

const Home = async ({ params }: HomeProps) => {
  const { locale } = await params;
  const { user } = await getSession();
  if (user) {
    redirect({ href: routes.dashboard, locale });
  }

  return (
    <PagesLayout>
      <LandingPage />
    </PagesLayout>
  );
};

export default Home;
