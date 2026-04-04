import type { ListIssuesSchemaInput } from "./schemas";

export const issueQueryKeys = {
  all: ["issues"] as const,
  lists: () => [...issueQueryKeys.all, "list"] as const,
  list: (locale: string, params: ListIssuesSchemaInput) =>
    [...issueQueryKeys.lists(), locale, params] as const,
  details: () => [...issueQueryKeys.all, "detail"] as const,
  detail: (locale: string, issueId: string) =>
    [...issueQueryKeys.details(), locale, issueId] as const,
  statuses: (locale: string) =>
    [...issueQueryKeys.all, "statuses", locale] as const,
  assigneeOptions: (locale: string) =>
    [...issueQueryKeys.all, "assigneeOptions", locale] as const,
};
