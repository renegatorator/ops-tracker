"use client";

import { useQuery } from "@tanstack/react-query";

import { listIssueStatuses } from "@/features/issues/actions";

import { IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";

export const useIssueStatuses = (locale: string) =>
  useQuery({
    queryKey: issueQueryKeys.statuses(locale),
    queryFn: async () => {
      const result = await listIssueStatuses(locale);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    staleTime: 60_000,
  });
