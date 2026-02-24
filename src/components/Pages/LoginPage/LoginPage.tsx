import {
  Alert,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";

export type LoginError = "invalid_credentials" | "generic";

type LoginPageProps = {
  locale: string;
  error?: LoginError;
};

async function signInAction(locale: string, formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const errorType =
      error.code === "invalid_credentials" ||
      error.message === "Invalid login credentials"
        ? "invalid_credentials"
        : "generic";

    redirect(`/${locale}/login?error=${errorType}`);
  }

  redirect(`/${locale}/dashboard`);
}

export default async function LoginPage({ locale, error }: LoginPageProps) {
  const t = await getTranslations({ locale, namespace: "auth.login" });
  const signIn = signInAction.bind(null, locale);

  return (
    <Container size="xs" py="xl">
      <Paper withBorder p="lg" radius="md" miw={400}>
        <Stack gap="md">
          <Title order={2}>{t("title")}</Title>

          {error ? (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              {error === "invalid_credentials"
                ? t("errors.invalidCredentials")
                : t("errors.generic")}
            </Alert>
          ) : null}

          <form action={signIn}>
            <Stack gap="md">
              <TextInput
                type="email"
                name="email"
                label={t("emailLabel")}
                placeholder={t("emailPlaceholder")}
                description={t("emailDescription")}
                pattern=".+@.+"
                title={t("emailTitle")}
                required
              />
              <PasswordInput
                name="password"
                label={t("passwordLabel")}
                placeholder={t("passwordPlaceholder")}
                required
              />
              <Button type="submit" fullWidth>
                {t("submit")}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
