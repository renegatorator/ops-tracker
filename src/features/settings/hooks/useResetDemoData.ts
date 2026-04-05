"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { IssuesQueryError } from "@/features/issues/issues-query-error";
import { issueQueryKeys } from "@/features/issues/keys";

import { resetDemoData } from "../actions";

export const useResetDemoData = (locale: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await resetDemoData(locale);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: issueQueryKeys.all });
    },
  });
};
