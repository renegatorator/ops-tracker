import { getTranslations } from "next-intl/server";

import IntlLinkAnchor from "@/components/Navigation/IntlLinkAnchor";
import { hasRole } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";
import { ADMIN_ACCESS_ROLES } from "@/lib/auth/types";
import { routes } from "@/lib/routes";

const AdminNavLink = async () => {
  const ctx = await getUserAuthContext();
  if (!ctx || !hasRole(ctx, ADMIN_ACCESS_ROLES)) {
    return null;
  }
  const t = await getTranslations("admin.nav");
  return (
    <IntlLinkAnchor href={routes.admin} size="sm" fw={500}>
      {t("link")}
    </IntlLinkAnchor>
  );
};

export default AdminNavLink;
