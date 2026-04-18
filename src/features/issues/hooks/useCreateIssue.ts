"use client";

import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { createIssue } from "@/features/issues/actions";
import { projectQueryKeys } from "@/features/projects/keys";

import { isIssuesQueryError, IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";
import type { CreateIssueInput } from "../schemas";

export const useCreateIssue = (locale: string) => {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: async (input: CreateIssueInput) => {
      const result = await createIssue(locale, input);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: issueQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.all }),
      ]);
      notifications.show({
        title: t("issues.create.successTitle"),
        message: t("issues.create.successMessage"),
        color: "green",
      });
    },
    onError: (err) => {
      const key = isIssuesQueryError(err)
        ? err.errorKey
        : "errors.createFailed";
      notifications.show({
        title: t("issues.create.failedTitle"),
        message: t(`issues.${key}` as Parameters<typeof t>[0]),
        color: "red",
      });
    },
  });
};
