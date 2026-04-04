"use client";

import {
  Anchor,
  Loader,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Link } from "@/i18n/navigation";

import { useAssigneeFilterOptions } from "../hooks/useAssigneeFilterOptions";
import { useAssignIssue } from "../hooks/useAssignIssue";
import { useIssueDetail } from "../hooks/useIssueDetail";
import { useIssueStatuses } from "../hooks/useIssueStatuses";
import { useTransitionIssueStatus } from "../hooks/useTransitionIssueStatus";
import { isIssuesQueryError } from "../issues-query-error";

const UNASSIGNED_VALUE = "__unassigned__";

interface IssueDetailPanelProps {
  locale: string;
  issueId: string;
  canTransitionStatus: boolean;
  canAssignIssue: boolean;
}

export const IssueDetailPanel = ({
  locale,
  issueId,
  canTransitionStatus,
  canAssignIssue,
}: IssueDetailPanelProps) => {
  const t = useTranslations("issues");
  const tDetail = useTranslations("issues.detail");
  const { data, isPending, isError, error } = useIssueDetail(
    locale,
    issueId,
  );
  const {
    data: statuses = [],
    isPending: statusesPending,
    isError: statusesError,
  } = useIssueStatuses(locale);
  const {
    data: assigneeUsers = [],
    isPending: assigneesPending,
    isError: assigneesError,
  } = useAssigneeFilterOptions(locale, canAssignIssue);
  const transition = useTransitionIssueStatus(locale, issueId);
  const assignMutation = useAssignIssue(locale);

  const statusSelectData = statuses.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const assigneeSelectData = useMemo(
    () => [
      { value: UNASSIGNED_VALUE, label: t("unassigned") },
      ...assigneeUsers.map((u) => ({
        value: u.id,
        label: u.full_name?.trim() || u.email?.trim() || u.id,
      })),
    ],
    [assigneeUsers, t],
  );

  return (
    <Stack gap="md">
      <Anchor component={Link} href="/issues" size="sm">
        {t("backToList")}
      </Anchor>
      {isPending ? (
        <Text c="dimmed">{t("loading")}</Text>
      ) : isError ? (
        <Text c="red">
          {t(
            isIssuesQueryError(error) ? error.errorKey : "errors.readFailed",
          )}
        </Text>
      ) : (
        <>
          <Title order={3}>{data.title}</Title>
          {canTransitionStatus ? (
            statusesError ? (
              <Text c="dimmed" size="sm">
                {data.issue_statuses?.name ?? "—"}
              </Text>
            ) : statusesPending ? (
              <Loader size="sm" type="dots" />
            ) : (
              <Select
                label={tDetail("statusLabel")}
                placeholder={tDetail("statusPlaceholder")}
                data={statusSelectData}
                value={data.status_id}
                onChange={(value) => {
                  if (!value || value === data.status_id) return;
                  transition.mutate(value);
                }}
                disabled={transition.isPending}
                aria-label={tDetail("statusLabel")}
              />
            )
          ) : (
            <Stack gap={4}>
              <Text size="sm" fw={600}>
                {tDetail("statusLabel")}
              </Text>
              <Text c="dimmed" size="sm">
                {data.issue_statuses?.name ?? "—"}
              </Text>
              <Text size="xs" c="dimmed">
                {tDetail("statusReadOnlyHint")}
              </Text>
            </Stack>
          )}
          {canAssignIssue ? (
            assigneesError ? (
              <Stack gap={4}>
                <Text size="sm" fw={600}>
                  {tDetail("assigneeLabel")}
                </Text>
                <Text c="dimmed" size="sm">
                  {data.assignee?.full_name?.trim() ||
                    data.assignee?.email?.trim() ||
                    t("unassigned")}
                </Text>
              </Stack>
            ) : assigneesPending ? (
              <Loader size="sm" type="dots" />
            ) : (
              <Select
                label={tDetail("assigneeLabel")}
                placeholder={tDetail("assignPlaceholder")}
                data={assigneeSelectData}
                value={data.assignee_id ?? UNASSIGNED_VALUE}
                onChange={(value) => {
                  const next =
                    value === UNASSIGNED_VALUE || !value ? null : value;
                  if (next === data.assignee_id) return;
                  assignMutation.mutate({
                    issueId,
                    assigneeId: next,
                  });
                }}
                disabled={assignMutation.isPending}
                comboboxProps={{ withinPortal: true }}
                aria-label={tDetail("assigneeLabel")}
              />
            )
          ) : (
            <Stack gap={4}>
              <Text size="sm" fw={600}>
                {tDetail("assigneeLabel")}
              </Text>
              <Text c="dimmed" size="sm">
                {data.assignee?.full_name?.trim() ||
                  data.assignee?.email?.trim() ||
                  t("unassigned")}
              </Text>
              <Text size="xs" c="dimmed">
                {tDetail("assignReadOnlyHint")}
              </Text>
            </Stack>
          )}
          {data.description ? (
            <Text style={{ whiteSpace: "pre-wrap" }}>{data.description}</Text>
          ) : null}
        </>
      )}
    </Stack>
  );
};
