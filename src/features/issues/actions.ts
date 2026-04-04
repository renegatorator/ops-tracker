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
  listIssuesSchema,
  softDeleteIssueSchema,
  transitionIssueStatusSchema,
  updateIssueSchema,
} from "./schemas";
import * as issueService from "./service";
import type {
  IssuesActionFailure,
  IssuesActionResult,
  ListIssuesSuccess,
} from "./types";

const revalidateIssuesSegment = (locale: string) => {
  revalidatePath(`/${locale}/issues`, "page");
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
  if (result.ok) revalidateIssuesSegment(locale);
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
  if (result.ok) revalidateIssuesSegment(locale);
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
  if (result.ok) revalidateIssuesSegment(locale);
  return result;
};
