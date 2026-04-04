"use client";

import { useQuery } from "@tanstack/react-query";

import { listUserProfilesForIssueFilters } from "@/features/issues/actions";

import { IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";

export const useAssigneeFilterOptions = (locale: string, enabled: boolean) =>
  useQuery({
    queryKey: issueQueryKeys.assigneeOptions(locale),
    queryFn: async () => {
      const result = await listUserProfilesForIssueFilters(locale);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    enabled,
    staleTime: 60_000,
  });
