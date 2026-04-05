import PagesLayout from "@/components/Layout/PagesLayout";
import LoginPage, { type LoginError } from "@/components/Pages/LoginPage/LoginPage";

interface LoginProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: LoginError }>;
}

export default async function Login({ params, searchParams }: LoginProps) {
  const { locale } = await params;
  const { error } = await searchParams;

  return (
    <PagesLayout>
      <LoginPage locale={locale} error={error} />
    </PagesLayout>
  );
}
