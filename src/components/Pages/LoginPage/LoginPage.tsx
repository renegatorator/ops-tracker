import { Container, Paper, Stack } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
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
  const t = await getTranslations({ locale, namespace: "auth.login" });
  const signIn = signInAction.bind(null, locale);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || undefined;

  return (
    <Container size="xs" py="xl">
      <Paper withBorder p="lg" radius="md" miw={400}>
        <Stack gap="md">
          <div style={{ display: "flex", justifyContent: "center", paddingBottom: 4 }}>
            <img
              src="/logo-light.svg"
              alt="Ops Tracker"
              height={40}
              className="ops-logo-light"
              style={{ display: "none" }}
            />
            <img
              src="/logo-dark.svg"
              alt=""
              aria-hidden="true"
              height={40}
              className="ops-logo-dark"
              style={{ display: "none" }}
            />
          </div>
          <LoginForm
            action={signIn}
            error={error}
            siteKey={siteKey}
            labels={{
              emailLabel: t("emailLabel"),
              emailPlaceholder: t("emailPlaceholder"),
              emailTitle: t("emailTitle"),
              passwordLabel: t("passwordLabel"),
              passwordPlaceholder: t("passwordPlaceholder"),
              submit: t("submit"),
              errorInvalidCredentials: t("errors.invalidCredentials"),
              errorGeneric: t("errors.generic"),
            }}
          />
        </Stack>
      </Paper>
    </Container>
  );
};

export default LoginPage;
