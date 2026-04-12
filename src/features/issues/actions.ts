"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { ZodError } from "zod";

import * as projectService from "@/features/projects/service";
import { localizedPath } from "@/i18n/localized-path";
import { logAudit } from "@/lib/audit/log-audit";
import { assertRole, ForbiddenError } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";
import type { UserAuthContext } from "@/lib/auth/types";
import { ADMIN_ACCESS_ROLES } from "@/lib/auth/types";
import { sendIssueAssignedEmailIfConfigured } from "@/lib/email/send-issue-assigned-email";
import { sendIssueCreatedReporterEmailIfConfigured } from "@/lib/email/send-issue-created-email";
import {
  issueDetailPath,
  projectBoardPath,
  projectIssuesPath,
  routes,
} from "@/lib/routes";

import { ISSUES_CACHE_TAG } from "./cache";
import { zodToFieldErrors } from "./map-errors";
import {
  assignIssueSchema,
  createIssueSchema,
  createIssueStatusSchema,
  deleteIssueStatusSchema,
  getIssueSchema,
  listAssigneeFiltersSchema,
  listIssuesSchema,
  softDeleteIssueSchema,
  transitionIssueStatusSchema,
  updateIssueSchema,
  updateIssueStatusSchema,
} from "./schemas";
import * as issueService from "./service";
import type {
  IssuesActionFailure,
  IssuesActionResult,
  IssueStatusRow,
  IssueWithStatus,
  ListIssuesSuccess,
  UserProfileBrief,
} from "./types";

const revalidateIssuesSegment = (
  locale: string,
  opts?: { issueId?: string; projectKey?: string },
) => {
  revalidatePath(localizedPath(locale, routes.issues), "page");
  revalidatePath(localizedPath(locale, routes.projects), "layout");
  if (opts?.projectKey) {
    revalidatePath(
      localizedPath(locale, projectBoardPath(opts.projectKey)),
      "page",
    );
    revalidatePath(
      localizedPath(locale, projectIssuesPath(opts.projectKey)),
      "page",
    );
  }
  if (opts?.issueId) {
    revalidatePath(localizedPath(locale, issueDetailPath(opts.issueId)), "page");
  }
  revalidateTag(ISSUES_CACHE_TAG, "max");
};

const revalidateAfterIssueStatusMutation = (locale: string) => {
  revalidatePath(localizedPath(locale, routes.issues), "page");
  revalidatePath(localizedPath(locale, routes.projects), "layout");
  revalidatePath(localizedPath(locale, routes.adminStatuses), "page");
  revalidateTag(ISSUES_CACHE_TAG, "max");
};

const unauthorized = (): IssuesActionFailure => ({
  ok: false,
  errorKey: "errors.unauthorized",
});

const validationFailure = (err: ZodError): IssuesActionFailure => ({
  ok: false,
  errorKey: "errors.validation",
  fieldErrors: zodToFieldErrors(err),
});

export const listIssues = async (
  _locale: string,
  raw: unknown,
): Promise<IssuesActionResult<ListIssuesSuccess>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  const parsed = listIssuesSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  return issueService.listIssues(parsed.data);
};

export const listIssueStatuses = async (
  _locale: string,
): Promise<IssuesActionResult<IssueStatusRow[]>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  return issueService.listIssueStatuses();
};

export const listUserProfilesForIssueFilters = async (
  _locale: string,
  raw?: unknown,
): Promise<IssuesActionResult<UserProfileBrief[]>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  try {
    assertRole(ctx, ADMIN_ACCESS_ROLES);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, errorKey: "errors.forbidden" };
    }
    throw e;
  }
  const parsed = listAssigneeFiltersSchema.safeParse(raw ?? {});
  if (!parsed.success) return validationFailure(parsed.error);
  if (parsed.data.projectId) {
    return projectService.listProjectMemberProfilesBrief(parsed.data.projectId);
  }
  return issueService.listUserProfilesBrief();
};

export const getIssue = async (
  _locale: string,
  raw: unknown,
): Promise<IssuesActionResult<IssueWithStatus>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  const parsed = getIssueSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const d = parsed.data;
  if (d.issueId) {
    return issueService.getIssue({ issueId: d.issueId });
  }
  return issueService.getIssue({
    projectKey: d.projectKey!.trim().toUpperCase(),
    issueNumber: d.issueNumber!,
  });
};

export const createIssue = async (
  locale: string,
  raw: unknown,
): Promise<
  IssuesActionResult<{
    id: string;
    issue_key: string;
    issue_number: number;
    project_key: string;
  }>
> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  const parsed = createIssueSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.createIssue(ctx.user.id, parsed.data);
  if (result.ok) {
    await logAudit({
      actorId: ctx.user.id,
      action: "issue.create",
      entityType: "issue",
      entityId: result.data.id,
      metadata: {
        title: parsed.data.title,
        project_id: parsed.data.project_id,
        issue_key: result.data.issue_key,
      },
    });
    await sendIssueCreatedReporterEmailIfConfigured({
      locale,
      issueId: result.data.id,
      title: parsed.data.title,
      toEmail: ctx.user.email ?? undefined,
    });
    revalidateIssuesSegment(locale, {
      projectKey: result.data.project_key,
    });
  }
  return result;
};

export const updateIssue = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  const parsed = updateIssueSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.updateIssue(parsed.data);
  if (result.ok) {
    const fields = (
      [
        parsed.data.title !== undefined ? "title" : null,
        parsed.data.description !== undefined ? "description" : null,
      ] as const
    ).filter((x): x is "title" | "description" => x != null);
    await logAudit({
      actorId: ctx.user.id,
      action: "issue.update",
      entityType: "issue",
      entityId: parsed.data.issueId,
      metadata: { fields },
    });
    revalidateIssuesSegment(locale, {});
  }
  return result;
};

export const transitionIssueStatus = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  const parsed = transitionIssueStatusSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.transitionIssueStatus(parsed.data);
  if (result.ok) {
    await logAudit({
      actorId: ctx.user.id,
      action: "issue.status_transition",
      entityType: "issue",
      entityId: parsed.data.issueId,
      metadata: { status_id: parsed.data.statusId },
    });
    revalidateIssuesSegment(locale, { issueId: parsed.data.issueId });
  }
  return result;
};

export const assignIssue = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  try {
    assertRole(ctx, ADMIN_ACCESS_ROLES);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, errorKey: "errors.forbidden" };
    }
    throw e;
  }
  const parsed = assignIssueSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.assignIssue(parsed.data);
  if (result.ok) {
    await logAudit({
      actorId: ctx.user.id,
      action: "issue.assign",
      entityType: "issue",
      entityId: parsed.data.issueId,
      metadata: { assignee_id: parsed.data.assigneeId },
    });
    if (parsed.data.assigneeId) {
      await sendIssueAssignedEmailIfConfigured({
        locale,
        issueId: parsed.data.issueId,
        assigneeId: parsed.data.assigneeId,
      });
    }
    revalidateIssuesSegment(locale, { issueId: parsed.data.issueId });
  }
  return result;
};

type AdminAuthResult =
  | IssuesActionFailure
  | { ok: true; ctx: UserAuthContext };

const requireAdminOrSuperCtx = async (): Promise<AdminAuthResult> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  try {
    assertRole(ctx, ADMIN_ACCESS_ROLES);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, errorKey: "errors.forbidden" };
    }
    throw e;
  }
  return { ok: true, ctx };
};

export const createIssueStatus = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const auth = await requireAdminOrSuperCtx();
  if (auth.ok === false) return auth;
  const parsed = createIssueStatusSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.createIssueStatus(parsed.data);
  if (result.ok) {
    await logAudit({
      actorId: auth.ctx.user.id,
      action: "issue_status.create",
      entityType: "issue_status",
      entityId: result.data.id,
      metadata: { slug: parsed.data.slug, name: parsed.data.name },
    });
    revalidateAfterIssueStatusMutation(locale);
  }
  return result;
};

export const updateIssueStatus = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const auth = await requireAdminOrSuperCtx();
  if (auth.ok === false) return auth;
  const parsed = updateIssueStatusSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.updateIssueStatus(parsed.data);
  if (result.ok) {
    const fields = (
      [
        parsed.data.name !== undefined ? "name" : null,
        parsed.data.slug !== undefined ? "slug" : null,
        parsed.data.sort_order !== undefined ? "sort_order" : null,
        parsed.data.is_terminal !== undefined ? "is_terminal" : null,
      ] as const
    ).filter((x): x is "name" | "slug" | "sort_order" | "is_terminal" => x != null);
    await logAudit({
      actorId: auth.ctx.user.id,
      action: "issue_status.update",
      entityType: "issue_status",
      entityId: parsed.data.statusId,
      metadata: { fields },
    });
    revalidateAfterIssueStatusMutation(locale);
  }
  return result;
};

export const deleteIssueStatus = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const auth = await requireAdminOrSuperCtx();
  if (auth.ok === false) return auth;
  const parsed = deleteIssueStatusSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.deleteIssueStatus(parsed.data);
  if (result.ok) {
    await logAudit({
      actorId: auth.ctx.user.id,
      action: "issue_status.delete",
      entityType: "issue_status",
      entityId: parsed.data.statusId,
      metadata: {},
    });
    revalidateAfterIssueStatusMutation(locale);
  }
  return result;
};

export const softDeleteIssue = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  try {
    assertRole(ctx, ADMIN_ACCESS_ROLES);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, errorKey: "errors.forbidden" };
    }
    throw e;
  }
  const parsed = softDeleteIssueSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.softDeleteIssue(parsed.data);
  if (result.ok) {
    await logAudit({
      actorId: ctx.user.id,
      action: "issue.archive",
      entityType: "issue",
      entityId: parsed.data.issueId,
      metadata: {},
    });
    revalidateIssuesSegment(locale, { issueId: parsed.data.issueId });
  }
  return result;
};
