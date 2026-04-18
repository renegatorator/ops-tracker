"use client";

import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { updateIssue } from "@/features/issues/actions";
import { projectQueryKeys } from "@/features/projects/keys";

import { isIssuesQueryError, IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";
import type { IssueWithStatus } from "../types";

export const useUpdateIssue = (locale: string, issueId: string) => {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: async (input: {
      title?: string;
      description?: string | null;
      issue_type?: "bug" | "ticket";
    }) => {
      const result = await updateIssue(locale, {
        issueId,
        ...input,
      });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onMutate: async (input) => {
      const detailKey = issueQueryKeys.detail(locale, issueId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<IssueWithStatus>(detailKey);
      queryClient.setQueryData<IssueWithStatus>(detailKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.issue_type !== undefined
            ? { issue_type: input.issue_type }
            : {}),
        };
      });
      return { previous } as { previous: IssueWithStatus | undefined };
    },
    onError: (err, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          issueQueryKeys.detail(locale, issueId),
          context.previous,
        );
      }
      const key = isIssuesQueryError(err)
        ? err.errorKey
        : "errors.updateFailed";
      notifications.show({
        title: t("issues.detail.saveFailedTitle"),
        message: t(`issues.${key}` as Parameters<typeof t>[0]),
        color: "red",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: issueQueryKeys.lists() });
      await queryClient.invalidateQueries({
        queryKey: issueQueryKeys.detail(locale, issueId),
      });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      notifications.show({
        title: t("issues.detail.saveSuccessTitle"),
        message: t("issues.detail.saveSuccessMessage"),
        color: "green",
      });
    },
  });
};
