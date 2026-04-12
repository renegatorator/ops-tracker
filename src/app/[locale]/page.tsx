import PagesLayout from "@/components/Layout/PagesLayout";
import LandingPage from "@/components/Pages/LandingPage";
import { routes } from "@/lib/routes";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomeProps) {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, routes.home);
}

export default async function Home() {
  return (
    <PagesLayout>
      <LandingPage />
    </PagesLayout>
  );
}
