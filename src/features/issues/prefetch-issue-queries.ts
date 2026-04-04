import "server-only";

import { QueryClient } from "@tanstack/react-query";

import { getIssue, listIssueStatuses } from "./actions";
import { IssuesQueryError } from "./issues-query-error";
import { issueQueryKeys } from "./keys";

export const prefetchIssueDetailPageQueries = async (
  queryClient: QueryClient,
  locale: string,
  issueId: string,
): Promise<void> => {
  const detailPromise = queryClient.prefetchQuery({
    queryKey: issueQueryKeys.detail(locale, issueId),
    queryFn: async () => {
      const result = await getIssue(locale, { issueId });
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
};
