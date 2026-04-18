import { getTranslations } from "next-intl/server";

import IntlLinkAnchor from "@/components/Navigation/IntlLinkAnchor";
import { hasRole } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";
import { AdminAccessRoles } from "@/lib/auth/types";
import { routes } from "@/lib/routes";

const AdminNavLink = async () => {
  const ctx = await getUserAuthContext();
  if (!ctx || !hasRole(ctx, AdminAccessRoles)) {
    return null;
  }
  const t = await getTranslations();
  return (
    <IntlLinkAnchor href={routes.admin} size="sm" fw={500}>
      {t("admin.nav.link")}
    </IntlLinkAnchor>
  );
};

export default AdminNavLink;
