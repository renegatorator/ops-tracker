import { supabaseErrorKey } from "@/features/issues/map-errors";
import type {
  IssuesActionFailure,
  IssuesActionResult,
} from "@/features/issues/types";
import { logAudit } from "@/lib/audit/log-audit";
import { type AppRole, AppRoles, parseAppRole } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

import type { UpdateUserRoleInput } from "./schemas";
import type { UserProfileAdminRow } from "./types";

export const listUserProfilesForAdmin = async (): Promise<
  IssuesActionResult<UserProfileAdminRow[]>
> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, email, full_name, role, created_at")
    .order("email", { ascending: true });

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.listUsersFailed"),
    };
  }

  const rows = (data ?? []) as UserProfileAdminRow[];
  return { ok: true, data: rows };
};

const forbidden = (): IssuesActionFailure => ({
  ok: false,
  errorKey: "errors.cannotEditRole",
});

export const updateUserRole = async (
  actorId: string,
  actorRole: AppRole,
  input: UpdateUserRoleInput,
): Promise<IssuesActionResult<{ id: string }>> => {
  const supabase = await createClient();

  const { data: target, error: readErr } = await supabase
    .from("user_profiles")
    .select("id, role")
    .eq("id", input.userId)
    .maybeSingle();

  if (readErr) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(readErr, "errors.readUserFailed"),
    };
  }
  if (!target) {
    return { ok: false, errorKey: "errors.notFound" };
  }

  const targetRole = parseAppRole(target.role);
  if (targetRole == null) {
    return { ok: false, errorKey: "errors.readUserFailed" };
  }

  if (actorRole === AppRoles.ADMIN) {
    if (input.role === AppRoles.SUPER_ADMIN) {
      return { ok: false, errorKey: "errors.cannotAssignSuperAdmin" };
    }
    if (targetRole !== AppRoles.USER) {
      return forbidden();
    }
    if (input.role !== AppRoles.USER && input.role !== AppRoles.ADMIN) {
      return forbidden();
    }
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ role: input.role })
    .eq("id", input.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.updateRoleFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "errors.notFound" };
  }
  await logAudit({
    actorId,
    action: "user.role_change",
    entityType: "user_profile",
    entityId: input.userId,
    metadata: { from: targetRole, to: input.role },
  });
  return { ok: true, data: { id: data.id } };
};
