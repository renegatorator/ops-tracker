"use client";

import { useQuery } from "@tanstack/react-query";

import { IssuesQueryError } from "@/features/issues/issues-query-error";
import { listUserProfilesForAdmin } from "@/features/users/actions";

import { userAdminQueryKeys } from "../keys";

export const useAdminUsersList = (locale: string) =>
  useQuery({
    queryKey: userAdminQueryKeys.list(locale),
    queryFn: async () => {
      const result = await listUserProfilesForAdmin(locale);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
  });
