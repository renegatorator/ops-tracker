"use server";

import { revalidatePath } from "next/cache";

import type {
  IssuesActionFailure,
  IssuesActionResult,
} from "@/features/issues/types";
import { localizedPath } from "@/i18n/localized-path";
import { logAudit } from "@/lib/audit/log-audit";
import { assertRole, ForbiddenError } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";
import { SUPER_ADMIN_ROLES } from "@/lib/auth/types";
import { isDemoResetEnabled } from "@/lib/env";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

const unauthorized = (): IssuesActionFailure => ({
  ok: false,
  errorKey: "errors.unauthorized",
});

export const resetDemoData = async (
  locale: string,
): Promise<IssuesActionResult<{ issuesDeleted: number }>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  try {
    assertRole(ctx, SUPER_ADMIN_ROLES);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, errorKey: "errors.forbidden" };
    }
    throw e;
  }

  if (!isDemoResetEnabled()) {
    return {
      ok: false,
      errorKey: "settings.errors.demoResetDisabled",
    };
  }

  const supabase = await createClient();

  const { error: deleteError, count } = await supabase
    .from("issues")
    .delete({ count: "exact" })
    .neq("id", NIL_UUID);

  if (deleteError) {
    return { ok: false, errorKey: "settings.errors.resetFailed" };
  }

  const issuesDeleted = count ?? 0;

  const auditOk = await logAudit({
    actorId: ctx.user.id,
    action: "demo.reset",
    entityType: "system",
    entityId: null,
    metadata: { issues_deleted: issuesDeleted },
  });

  if (!auditOk) {
    return { ok: false, errorKey: "settings.errors.auditFailed" };
  }

  revalidatePath(localizedPath(locale, routes.issues), "layout");
  revalidatePath(localizedPath(locale, routes.dashboard), "layout");

  return { ok: true, data: { issuesDeleted } };
};
