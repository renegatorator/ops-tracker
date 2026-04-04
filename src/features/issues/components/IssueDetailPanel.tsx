"use client";

import { Anchor, Stack, Text, Title } from "@mantine/core";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { useIssueDetail } from "../hooks/useIssueDetail";
import { isIssuesQueryError } from "../issues-query-error";

interface IssueDetailPanelProps {
  locale: string;
  issueId: string;
}

export const IssueDetailPanel = ({ locale, issueId }: IssueDetailPanelProps) => {
  const t = useTranslations("issues");
  const { data, isPending, isError, error } = useIssueDetail(
    locale,
    issueId,
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
          {data.issue_statuses?.name ? (
            <Text c="dimmed" size="sm">
              {data.issue_statuses.name}
            </Text>
          ) : null}
          {data.description ? (
            <Text style={{ whiteSpace: "pre-wrap" }}>{data.description}</Text>
          ) : null}
        </>
      )}
    </Stack>
  );
};
