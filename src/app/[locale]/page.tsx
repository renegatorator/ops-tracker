import PagesLayout from "@/components/Layout/PagesLayout";
import LandingPage from "@/components/Pages/LandingPage";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, "/");
}

export default async function Home() {
  return (
    <PagesLayout>
      <LandingPage />
    </PagesLayout>
  );
}
