"use server";

import { revalidatePath } from "next/cache";

import type {
  IssuesActionFailure,
  IssuesActionResult,
} from "@/features/issues/types";
import { assertRole, ForbiddenError } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";
import { isDemoResetEnabled } from "@/lib/env";
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
    assertRole(ctx, ["super_admin"]);
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

  const { error: auditError } = await supabase.from("audit_log").insert({
    actor_id: ctx.user.id,
    action: "demo.reset",
    entity_type: "system",
    entity_id: null,
    metadata: { issues_deleted: issuesDeleted },
  });

  if (auditError) {
    return { ok: false, errorKey: "settings.errors.auditFailed" };
  }

  revalidatePath(`/${locale}/issues`, "layout");
  revalidatePath(`/${locale}/dashboard`, "layout");

  return { ok: true, data: { issuesDeleted } };
};
