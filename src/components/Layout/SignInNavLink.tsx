import { getTranslations } from "next-intl/server";

import { getSession } from "@/lib/auth/session";

import SignInNavLinkButton from "./SignInNavLinkButton";

const SignInNavLink = async () => {
  const { user } = await getSession();
  if (user) return null;
  const t = await getTranslations();
  return <SignInNavLinkButton label={t("landing.loginButton")} />;
};

export default SignInNavLink;
