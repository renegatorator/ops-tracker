"use client";

import { useQuery } from "@tanstack/react-query";

import { IssuesQueryError } from "@/features/issues/issues-query-error";
import { listProjects } from "@/features/projects/actions";

import { projectQueryKeys } from "../keys";
import type { ProjectRow } from "../types";

export const useProjectsList = (locale: string) =>
  useQuery({
    queryKey: projectQueryKeys.list(locale),
    queryFn: async (): Promise<ProjectRow[]> => {
      const result = await listProjects(locale);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    staleTime: 30_000,
  });
