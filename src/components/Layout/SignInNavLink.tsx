import { getTranslations } from "next-intl/server";

import IntlLinkAnchor from "@/components/Navigation/IntlLinkAnchor";
import { getSession } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

const SignInNavLink = async () => {
  const { user } = await getSession();
  if (user) return null;
  const t = await getTranslations();
  return (
    <IntlLinkAnchor href={routes.login} size="sm" fw={500}>
      {t("landing.loginButton")}
    </IntlLinkAnchor>
  );
};

export default SignInNavLink;
