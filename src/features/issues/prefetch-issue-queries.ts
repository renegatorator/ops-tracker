import "server-only";

import { QueryClient } from "@tanstack/react-query";

import { listAuditLogsForAdmin } from "@/features/audit/actions";
import { auditQueryKeys } from "@/features/audit/keys";

import { getIssue, listIssueStatuses } from "./actions";
import { IssuesQueryError } from "./issues-query-error";
import { issueQueryKeys } from "./keys";

export const prefetchIssueDetailPageQueries = async (
  queryClient: QueryClient,
  locale: string,
  issueId: string,
  options?: { prefetchIssueAudit?: boolean },
): Promise<void> => {
  const detailPromise = queryClient.prefetchQuery({
    queryKey: issueQueryKeys.detail(locale, issueId),
    queryFn: async () => {
      const result = await getIssue(locale, { issueId: issueId });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
  });

  const statusesPromise = queryClient.prefetchQuery({
    queryKey: issueQueryKeys.statuses(locale),
    queryFn: async () => {
      const result = await listIssueStatuses(locale);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
  });

  await Promise.allSettled([detailPromise, statusesPromise]);

  if (options?.prefetchIssueAudit) {
    await queryClient.prefetchQuery({
      queryKey: auditQueryKeys.issueActivity(locale, issueId),
      queryFn: async () => {
        const result = await listAuditLogsForAdmin(locale, {
          entityType: "issue",
          entityId: issueId,
          limit: 40,
          offset: 0,
        });
        if (!result.ok) {
          throw new IssuesQueryError(result.errorKey, result.fieldErrors);
        }
        return result.data.items;
      },
    });
  }
};
