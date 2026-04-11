import { Stack, Title } from "@mantine/core";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { RouteLoading } from "@/components/RouteLoading";
import { requireRole } from "@/lib/auth/session";

const SuperAdminSettingsPanel = dynamic(
  () =>
    import("@/features/settings/components/SuperAdminSettingsPanel").then(
      (m) => ({
        default: m.SuperAdminSettingsPanel,
      }),
    ),
  { loading: () => <RouteLoading compact /> },
);
import {
  env,
  getDemoResetEnvRaw,
  isDemoResetEnabled,
  isExperimentalUiFlagSet,
} from "@/lib/env";
import { getLocalizedSeoMetadata } from "@/utils/seoUtils";

interface AdminSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: AdminSettingsPageProps) => {
  const { locale } = await params;
  return getLocalizedSeoMetadata(locale, "/admin/settings");
};

const AdminSettingsPage = async ({ params }: AdminSettingsPageProps) => {
  const { locale } = await params;
  await requireRole(locale, ["super_admin"]);
  const t = await getTranslations({ locale, namespace: "admin" });

  const demoResetEnabled = isDemoResetEnabled();

  return (
    <Stack gap="md" w="100%">
      <Title order={3}>{t("settings.title")}</Title>
      <SuperAdminSettingsPanel
        locale={locale}
        demoResetEnabled={demoResetEnabled}
        demoResetEnvRaw={getDemoResetEnvRaw()}
        experimentalUi={isExperimentalUiFlagSet()}
        publicSiteUrl={env("NEXT_PUBLIC_SITE_URL")}
        nodeEnv={process.env.NODE_ENV}
      />
    </Stack>
  );
};

export default AdminSettingsPage;
