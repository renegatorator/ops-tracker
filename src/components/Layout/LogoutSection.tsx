import { getLocale, getTranslations } from "next-intl/server";

import { signOutAction } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";

import LogoutForm from "./LogoutForm";

const LogoutSection = async () => {
  const { user } = await getSession();
  if (!user) {
    return null;
  }

  const locale = await getLocale();
  const t = await getTranslations();
  const boundSignOut = signOutAction.bind(null, locale);

  return <LogoutForm formAction={boundSignOut} label={t("layout.logout")} />;
};

export default LogoutSection;
