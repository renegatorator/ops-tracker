"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { zodToFieldErrors } from "@/features/issues/map-errors";
import type {
  IssuesActionFailure,
  IssuesActionResult,
} from "@/features/issues/types";
import { assertRole, ForbiddenError } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";

import { updateUserRoleSchema } from "./schemas";
import * as userService from "./service";
import type { UserProfileAdminRow } from "./types";

const unauthorized = (): IssuesActionFailure => ({
  ok: false,
  errorKey: "errors.unauthorized",
});

const validationFailure = (err: ZodError): IssuesActionFailure => ({
  ok: false,
  errorKey: "errors.validation",
  fieldErrors: zodToFieldErrors(err),
});

export const listUserProfilesForAdmin = async (
  _locale: string,
): Promise<IssuesActionResult<UserProfileAdminRow[]>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  try {
    assertRole(ctx, ["admin", "super_admin"]);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, errorKey: "errors.forbidden" };
    }
    throw e;
  }
  const result = await userService.listUserProfilesForAdmin();
  return result;
};

export const updateUserRole = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  try {
    assertRole(ctx, ["admin", "super_admin"]);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, errorKey: "errors.forbidden" };
    }
    throw e;
  }
  const parsed = updateUserRoleSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await userService.updateUserRole(ctx.role, parsed.data);
  if (result.ok) {
    revalidatePath(`/${locale}/admin/users`, "page");
  }
  return result;
};
