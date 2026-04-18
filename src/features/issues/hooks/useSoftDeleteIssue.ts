"use client";

import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { softDeleteIssue } from "@/features/issues/actions";
import { projectQueryKeys } from "@/features/projects/keys";

import { isIssuesQueryError, IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";

export const useSoftDeleteIssue = (locale: string) => {
  const queryClient = useQueryClient();
  const t = useTranslations("issues");
  const tDetail = useTranslations("issues.detail");

  return useMutation({
    mutationFn: async (issueId: string) => {
      const result = await softDeleteIssue(locale, { issueId });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: issueQueryKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
    onError: (err) => {
      const key = isIssuesQueryError(err)
        ? err.errorKey
        : "errors.deleteFailed";
      notifications.show({
        title: tDetail("closeFailedTitle"),
        message: t(key),
        color: "red",
      });
    },
  });
};
