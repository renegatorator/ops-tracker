import { APP_ROLE, isAdminAccessRole, type UserAuthContext } from "@/lib/auth/types";

import type { IssueWithStatus } from "./types";

/**
 * Mirrors issues RLS: admins may update any row; `user` role only if reporter or assignee.
 */
export const canUserTransitionIssueStatus = (
  ctx: UserAuthContext,
  issue: IssueWithStatus,
): boolean => {
  if (isAdminAccessRole(ctx.role)) {
    return true;
  }
  if (ctx.role === APP_ROLE.user) {
    return (
      issue.reporter_id === ctx.user.id || issue.assignee_id === ctx.user.id
    );
  }
  return false;
};
