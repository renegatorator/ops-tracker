import type { ListAuditLogsInput } from "./schemas";

export const auditQueryKeys = {
  all: ["audit"] as const,
  lists: () => [...auditQueryKeys.all, "list"] as const,
  list: (locale: string, params: ListAuditLogsInput) =>
    [...auditQueryKeys.lists(), locale, params] as const,
  issueActivity: (locale: string, issueId: string) =>
    [...auditQueryKeys.all, "issue", locale, issueId] as const,
};
