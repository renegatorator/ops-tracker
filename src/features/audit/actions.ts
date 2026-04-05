"use server";

import type { ZodError } from "zod";

import { zodToFieldErrors } from "@/features/issues/map-errors";
import type {
  IssuesActionFailure,
  IssuesActionResult,
} from "@/features/issues/types";
import { assertRole, ForbiddenError } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";

import { listAuditLogsSchema } from "./schemas";
import * as auditService from "./service";
import type { ListAuditLogsSuccess } from "./types";

const unauthorized = (): IssuesActionFailure => ({
  ok: false,
  errorKey: "errors.unauthorized",
});

const validationFailure = (err: ZodError): IssuesActionFailure => ({
  ok: false,
  errorKey: "errors.validation",
  fieldErrors: zodToFieldErrors(err),
});

const requireAdmin = async (): Promise<
  IssuesActionFailure | { ok: true }
> => {
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
  return { ok: true };
};

export const listAuditLogsForAdmin = async (
  _locale: string,
  raw: unknown,
): Promise<IssuesActionResult<ListAuditLogsSuccess>> => {
  const gate = await requireAdmin();
  if (gate.ok === false) return gate;
  const parsed = listAuditLogsSchema.safeParse(raw ?? {});
  if (!parsed.success) return validationFailure(parsed.error);
  return auditService.listAuditLogs(parsed.data);
};
