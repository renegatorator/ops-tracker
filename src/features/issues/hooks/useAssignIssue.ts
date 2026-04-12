"use client";

import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { assignIssue } from "@/features/issues/actions";
import { projectQueryKeys } from "@/features/projects/keys";

import { isIssuesQueryError, IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";
import type { IssueWithStatus } from "../types";

export const useAssignIssue = (locale: string) => {
  const queryClient = useQueryClient();
  const t = useTranslations("issues");

  return useMutation({
    mutationFn: async (input: { issueId: string; assigneeId: string | null }) => {
      const result = await assignIssue(locale, input);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onMutate: async (input) => {
      const detailKey = issueQueryKeys.detail(locale, input.issueId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<IssueWithStatus>(detailKey);

      queryClient.setQueryData<IssueWithStatus>(detailKey, (old) => {
        if (!old) return old;
        const assigneeList = queryClient.getQueryData<
          { id: string; email: string | null; full_name: string | null }[]
        >(issueQueryKeys.assigneeOptions(locale));
        const nextAssignee =
          input.assigneeId == null
            ? null
            : assigneeList?.find((u) => u.id === input.assigneeId) ?? null;
        return {
          ...old,
          assignee_id: input.assigneeId,
          assignee: nextAssignee,
        };
      });

      return { previous, issueId: input.issueId } as {
        previous: IssueWithStatus | undefined;
        issueId: string;
      };
    },
    onError: (err, input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          issueQueryKeys.detail(locale, input.issueId),
          context.previous,
        );
      }
      const key = isIssuesQueryError(err) ? err.errorKey : "errors.assignFailed";
      notifications.show({
        title: t("detail.assignUpdateFailedTitle"),
        message: t(key),
        color: "red",
      });
    },
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: issueQueryKeys.lists() });
      await queryClient.invalidateQueries({
        queryKey: issueQueryKeys.detail(locale, input.issueId),
      });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
};
