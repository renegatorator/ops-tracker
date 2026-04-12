"use client";

import { useQuery } from "@tanstack/react-query";

import { IssuesQueryError } from "@/features/issues/issues-query-error";
import { listProjectMembers } from "@/features/projects/actions";

import { projectQueryKeys } from "../keys";
import type { ProjectMemberWithProfile } from "../types";

export const useProjectMembers = (locale: string, projectId: string) =>
  useQuery({
    queryKey: projectQueryKeys.members(locale, projectId),
    queryFn: async (): Promise<ProjectMemberWithProfile[]> => {
      const result = await listProjectMembers(locale, { projectId });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    staleTime: 30_000,
  });
