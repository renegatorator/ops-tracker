"use client";

import { useQuery } from "@tanstack/react-query";

import { listIssues } from "@/features/issues/actions";

import { IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";
import type { ListIssuesSchemaInput } from "../schemas";

export const useIssuesList = (locale: string, params: ListIssuesSchemaInput) =>
  useQuery({
    queryKey: issueQueryKeys.list(locale, params),
    queryFn: async () => {
      const result = await listIssues(locale, params);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
  });
