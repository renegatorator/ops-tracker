"use client";

import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { transitionIssueStatus } from "@/features/issues/actions";
import { projectQueryKeys } from "@/features/projects/keys";

import { isIssuesQueryError, IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";
import type { IssueStatusRow, IssueWithStatus } from "../types";

const resolveStatusRow = (
  queryClient: ReturnType<typeof useQueryClient>,
  locale: string,
  statusId: string,
): IssueStatusRow | null => {
  const list = queryClient.getQueryData<IssueStatusRow[]>(
    issueQueryKeys.statuses(locale),
  );
  return list?.find((s) => s.id === statusId) ?? null;
};

export const useTransitionIssueStatus = (
  locale: string,
  issueId: string,
) => {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const detailKey = issueQueryKeys.detail(locale, issueId);

  return useMutation({
    mutationFn: async (statusId: string) => {
      const result = await transitionIssueStatus(locale, {
        issueId,
        statusId,
      });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onMutate: async (statusId) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<IssueWithStatus>(detailKey);
      const statusRow = resolveStatusRow(queryClient, locale, statusId);

      queryClient.setQueryData<IssueWithStatus>(detailKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          status_id: statusId,
          issue_statuses: statusRow ?? old.issue_statuses,
        };
      });

      return { previous } as { previous: IssueWithStatus | undefined };
    },
    onError: (err, _statusId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(detailKey, context.previous);
      }
      const key = isIssuesQueryError(err)
        ? err.errorKey
        : "errors.transitionFailed";
      notifications.show({
        title: t("issues.detail.statusUpdateFailedTitle"),
        message: t(`issues.${key}` as Parameters<typeof t>[0]),
        color: "red",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: issueQueryKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: detailKey });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
};
