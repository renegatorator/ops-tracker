"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { zodToFieldErrors } from "@/features/issues/map-errors";
import { localizedPath } from "@/i18n/localized-path";
import { logAudit } from "@/lib/audit/log-audit";
import { assertRole, ForbiddenError } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";
import { ADMIN_ACCESS_ROLES, SUPER_ADMIN_ROLES } from "@/lib/auth/types";
import {
  projectBoardPath,
  projectIssuesPath,
  projectSettingsPath,
  routes,
} from "@/lib/routes";

import {
  addProjectMemberSchema,
  createProjectSchema,
  getProjectByKeySchema,
  listProjectMembersSchema,
  removeProjectMemberSchema,
  updateProjectSchema,
} from "./schemas";
import * as projectService from "./service";
import type {
  ProjectMemberWithProfile,
  ProjectRow,
  ProjectsActionFailure,
  ProjectsActionResult,
  UserProfileBrief,
} from "./types";

const revalidateProjectsSegment = (locale: string, projectKey?: string) => {
  revalidatePath(localizedPath(locale, routes.projects), "layout");
  if (projectKey) {
    const base = localizedPath(locale, `${routes.projects}/${projectKey}`);
    revalidatePath(base, "layout");
    revalidatePath(localizedPath(locale, projectBoardPath(projectKey)), "page");
    revalidatePath(localizedPath(locale, projectIssuesPath(projectKey)), "page");
    revalidatePath(
      localizedPath(locale, projectSettingsPath(projectKey)),
      "page",
    );
  }
};

const unauthorized = (): ProjectsActionFailure => ({
  ok: false,
  errorKey: "errors.unauthorized",
});

const validationFailure = (err: ZodError): ProjectsActionFailure => ({
  ok: false,
  errorKey: "errors.validation",
  fieldErrors: zodToFieldErrors(err),
});

export const listProjects = async (
  _locale: string,
): Promise<ProjectsActionResult<ProjectRow[]>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  return projectService.listProjects();
};

export const getProjectByKey = async (
  _locale: string,
  raw: unknown,
): Promise<ProjectsActionResult<ProjectRow>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  const parsed = getProjectByKeySchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  return projectService.getProjectByKey(parsed.data);
};

export const createProject = async (
  locale: string,
  raw: unknown,
): Promise<ProjectsActionResult<{ id: string }>> => {
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
  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await projectService.createProject(ctx.user.id, parsed.data);
  if (result.ok) {
    await logAudit({
      actorId: ctx.user.id,
      action: "project.create",
      entityType: "project",
      entityId: result.data.id,
      metadata: { key: parsed.data.key, name: parsed.data.name },
    });
    revalidateProjectsSegment(locale);
  }
  return result;
};

export const updateProject = async (
  locale: string,
  raw: unknown,
): Promise<ProjectsActionResult<{ id: string; key: string }>> => {
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
  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await projectService.updateProject(parsed.data);
  if (result.ok) {
    await logAudit({
      actorId: ctx.user.id,
      action: "project.update",
      entityType: "project",
      entityId: parsed.data.projectId,
      metadata: {
        key: result.data.key,
        fields: Object.keys(parsed.data).filter((k) => k !== "projectId"),
      },
    });
    revalidateProjectsSegment(locale, result.data.key);
  }
  return result;
};

export const renameProject = async (
  locale: string,
  raw: unknown,
): Promise<ProjectsActionResult<{ id: string; key: string }>> => {
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
  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await projectService.updateProject(parsed.data);
  if (result.ok) {
    await logAudit({
      actorId: ctx.user.id,
      action: "project.rename",
      entityType: "project",
      entityId: parsed.data.projectId,
      metadata: {
        key: result.data.key,
        name: parsed.data.name,
      },
    });
    revalidateProjectsSegment(locale, result.data.key);
  }
  return result;
};

export const listProjectMembers = async (
  _locale: string,
  raw: unknown,
): Promise<ProjectsActionResult<ProjectMemberWithProfile[]>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  const parsed = listProjectMembersSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  return projectService.listProjectMembers(parsed.data);
};

export const listProjectMemberProfilesBrief = async (
  _locale: string,
  projectId: string,
): Promise<ProjectsActionResult<UserProfileBrief[]>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  return projectService.listProjectMemberProfilesBrief(projectId);
};

export const addProjectMember = async (
  locale: string,
  raw: unknown,
): Promise<ProjectsActionResult<null>> => {
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
  const parsed = addProjectMemberSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await projectService.addProjectMember(parsed.data);
  if (result.ok) {
    const proj = await projectService.getProjectKeyById(parsed.data.projectId);
    await logAudit({
      actorId: ctx.user.id,
      action: "project.member.add",
      entityType: "project",
      entityId: parsed.data.projectId,
      metadata: { user_id: parsed.data.userId, role: parsed.data.role },
    });
    revalidateProjectsSegment(locale, proj.ok ? proj.data.key : undefined);
  }
  return result;
};

export const removeProjectMember = async (
  locale: string,
  raw: unknown,
): Promise<ProjectsActionResult<null>> => {
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
  const parsed = removeProjectMemberSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await projectService.removeProjectMember(parsed.data);
  if (result.ok) {
    const proj = await projectService.getProjectKeyById(parsed.data.projectId);
    await logAudit({
      actorId: ctx.user.id,
      action: "project.member.remove",
      entityType: "project",
      entityId: parsed.data.projectId,
      metadata: { user_id: parsed.data.userId },
    });
    revalidateProjectsSegment(locale, proj.ok ? proj.data.key : undefined);
  }
  return result;
};
