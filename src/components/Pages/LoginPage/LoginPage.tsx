import { Container, Paper, Stack } from "@mantine/core";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link, redirect } from "@/i18n/navigation";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

import LoginForm from "./LoginForm";

export type LoginError = "invalid_credentials" | "generic";

interface LoginPageProps {
  locale: string;
  error?: LoginError;
}

async function signInAction(locale: string, formData: FormData) {
  "use server";

  const recaptchaToken = String(formData.get("recaptcha_token") ?? "").trim();
  const tokenValid = await verifyRecaptchaToken(recaptchaToken || null);
  if (!tokenValid) {
    return redirect({ href: `${routes.login}?error=generic`, locale });
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const errorType: LoginError =
      error.code === "invalid_credentials" ||
      error.message === "Invalid login credentials"
        ? "invalid_credentials"
        : "generic";

    return redirect({
      href: `${routes.login}?error=${errorType}`,
      locale,
    });
  }

  return redirect({ href: routes.dashboard, locale });
}

const LoginPage = async ({ locale, error }: LoginPageProps) => {
  const t = await getTranslations({ locale });
  const signIn = signInAction.bind(null, locale);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || undefined;

  return (
    <Container size="xs" py="xl">
      <Paper withBorder p="lg" radius="md" miw={400}>
        <Stack gap="md">
          <Link
            href={routes.home}
            aria-label={t("seo.root.title")}
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: 4,
            }}
          >
            <Image
              src="/logo-light.svg"
              alt="Ops Tracker"
              width={148}
              height={40}
              className="ops-logo-light"
              style={{ display: "none" }}
              unoptimized
            />
            <Image
              src="/logo-dark.svg"
              alt=""
              aria-hidden="true"
              width={148}
              height={40}
              className="ops-logo-dark"
              style={{ display: "none" }}
              unoptimized
            />
          </Link>
          <LoginForm
            action={signIn}
            error={error}
            siteKey={siteKey}
            labels={{
              emailLabel: t("auth.login.emailLabel"),
              emailPlaceholder: t("auth.login.emailPlaceholder"),
              emailTitle: t("auth.login.emailTitle"),
              passwordLabel: t("auth.login.passwordLabel"),
              passwordPlaceholder: t("auth.login.passwordPlaceholder"),
              submit: t("auth.login.submit"),
              errorInvalidCredentials: t("auth.login.errors.invalidCredentials"),
              errorGeneric: t("auth.login.errors.generic"),
            }}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default LoginPage;
