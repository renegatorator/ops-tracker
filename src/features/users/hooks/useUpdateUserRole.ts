"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { IssuesQueryError } from "@/features/issues/issues-query-error";
import { updateUserRole } from "@/features/users/actions";

import { userAdminQueryKeys } from "../keys";

export const useUpdateUserRole = (locale: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; role: string }) => {
      const result = await updateUserRole(locale, input);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: userAdminQueryKeys.list(locale),
      });
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
};
