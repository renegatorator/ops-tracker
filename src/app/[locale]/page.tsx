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
  const metadata = await getLocalizedSeoMetadata(locale, routes.home);
  return {
    ...metadata,
    title: { absolute: typeof metadata.title === "string" ? metadata.title : "Ops Tracker" },
  };
}

const Home = async ({ params }: HomeProps) => {
  const { locale } = await params;
  const { user } = await getSession();
  if (user) {
    redirect({ href: routes.dashboard, locale });
  }

  return (
    <PagesLayout variant="top">
      <LandingPage />
    </PagesLayout>
  );
};

export default Home;
