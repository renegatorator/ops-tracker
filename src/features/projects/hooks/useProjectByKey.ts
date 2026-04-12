"use client";

import { useQuery } from "@tanstack/react-query";

import { IssuesQueryError } from "@/features/issues/issues-query-error";
import { getProjectByKey } from "@/features/projects/actions";

import { projectQueryKeys } from "../keys";
import type { ProjectRow } from "../types";

export const useProjectByKey = (locale: string, projectKey: string) =>
  useQuery({
    queryKey: projectQueryKeys.detailByKey(locale, projectKey),
    queryFn: async (): Promise<ProjectRow> => {
      const result = await getProjectByKey(locale, { key: projectKey });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    staleTime: 60_000,
  });
