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

import { Link } from "@/i18n/navigation";

import { useIssueDetail } from "../hooks/useIssueDetail";
import { useIssueStatuses } from "../hooks/useIssueStatuses";
import { useTransitionIssueStatus } from "../hooks/useTransitionIssueStatus";
import { isIssuesQueryError } from "../issues-query-error";

interface IssueDetailPanelProps {
  locale: string;
  issueId: string;
  canTransitionStatus: boolean;
}

export const IssueDetailPanel = ({
  locale,
  issueId,
  canTransitionStatus,
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
  const transition = useTransitionIssueStatus(locale, issueId);

  const statusSelectData = statuses.map((s) => ({
    value: s.id,
    label: s.name,
  }));

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
          {data.description ? (
            <Text style={{ whiteSpace: "pre-wrap" }}>{data.description}</Text>
          ) : null}
        </>
      )}
    </Stack>
  );
};
