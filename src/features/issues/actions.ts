"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { ZodError } from "zod";

import { assertRole, ForbiddenError } from "@/lib/auth/rbac";
import { getUserAuthContext } from "@/lib/auth/session";

import { ISSUES_CACHE_TAG } from "./cache";
import { zodToFieldErrors } from "./map-errors";
import {
  assignIssueSchema,
  createIssueSchema,
  createIssueStatusSchema,
  deleteIssueStatusSchema,
  getIssueSchema,
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

const revalidateIssuesSegment = (locale: string, issueId?: string) => {
  revalidatePath(`/${locale}/issues`, "page");
  if (issueId) {
    revalidatePath(`/${locale}/issues/${issueId}`, "page");
  }
  revalidateTag(ISSUES_CACHE_TAG, "max");
};

const revalidateAfterIssueStatusMutation = (locale: string) => {
  revalidatePath(`/${locale}/issues`, "page");
  revalidatePath(`/${locale}/admin/statuses`, "page");
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
): Promise<IssuesActionResult<UserProfileBrief[]>> => {
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
  return issueService.getIssueById(parsed.data.issueId);
};

export const createIssue = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const ctx = await getUserAuthContext();
  if (!ctx) return unauthorized();
  const parsed = createIssueSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.createIssue(ctx.user.id, parsed.data);
  if (result.ok) revalidateIssuesSegment(locale);
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
  if (result.ok) revalidateIssuesSegment(locale);
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
    revalidateIssuesSegment(locale, parsed.data.issueId);
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
    assertRole(ctx, ["admin", "super_admin"]);
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
    revalidateIssuesSegment(locale, parsed.data.issueId);
  }
  return result;
};

const assertAdminOrSuper = async (): Promise<IssuesActionFailure | null> => {
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
  return null;
};

export const createIssueStatus = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const gate = await assertAdminOrSuper();
  if (gate) return gate;
  const parsed = createIssueStatusSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.createIssueStatus(parsed.data);
  if (result.ok) revalidateAfterIssueStatusMutation(locale);
  return result;
};

export const updateIssueStatus = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const gate = await assertAdminOrSuper();
  if (gate) return gate;
  const parsed = updateIssueStatusSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.updateIssueStatus(parsed.data);
  if (result.ok) revalidateAfterIssueStatusMutation(locale);
  return result;
};

export const deleteIssueStatus = async (
  locale: string,
  raw: unknown,
): Promise<IssuesActionResult<{ id: string }>> => {
  const gate = await assertAdminOrSuper();
  if (gate) return gate;
  const parsed = deleteIssueStatusSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.deleteIssueStatus(parsed.data);
  if (result.ok) revalidateAfterIssueStatusMutation(locale);
  return result;
};

export const softDeleteIssue = async (
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
  const parsed = softDeleteIssueSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await issueService.softDeleteIssue(parsed.data);
  if (result.ok) {
    revalidateIssuesSegment(locale, parsed.data.issueId);
  }
  return result;
};
