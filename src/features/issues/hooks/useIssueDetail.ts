"use client";

import { useQuery } from "@tanstack/react-query";

import { getIssue } from "@/features/issues/actions";

import { IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";

export const useIssueDetail = (locale: string, issueId: string | undefined) =>
  useQuery({
    queryKey:
      issueId != null && issueId !== ""
        ? issueQueryKeys.detail(locale, issueId)
        : ([...issueQueryKeys.details(), locale, "__none__"] as const),
    queryFn: async () => {
      const result = await getIssue(locale, { issueId: issueId! });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    enabled: Boolean(issueId),
  });
