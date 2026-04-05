import { Anchor } from "@mantine/core";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { hasRole } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";

const AdminNavLink = async () => {
  const ctx = await getUserAuthContext();
  if (!ctx || !hasRole(ctx, ["admin", "super_admin"])) {
    return null;
  }
  const t = await getTranslations("admin.nav");
  return (
    <Anchor component={Link} href="/admin" size="sm" fw={500}>
      {t("link")}
    </Anchor>
  );
};

export default AdminNavLink;
