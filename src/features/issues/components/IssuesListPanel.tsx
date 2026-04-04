"use client";

import { Anchor, List, Text } from "@mantine/core";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { useIssuesList } from "../hooks/useIssuesList";
import { isIssuesQueryError } from "../issues-query-error";
import type { ListIssuesSchemaInput } from "../schemas";

interface IssuesListPanelProps {
  locale: string;
  listParams: ListIssuesSchemaInput;
}

export const IssuesListPanel = ({
  locale,
  listParams,
}: IssuesListPanelProps) => {
  const t = useTranslations("issues");
  const { data, isPending, isError, error } = useIssuesList(
    locale,
    listParams,
  );

  if (isPending) {
    return <Text c="dimmed">{t("loading")}</Text>;
  }
  if (isError) {
    const key = isIssuesQueryError(error)
      ? error.errorKey
      : "errors.listFailed";
    return <Text c="red">{t(key)}</Text>;
  }
  if (data.items.length === 0) {
    return <Text c="dimmed">{t("empty")}</Text>;
  }
  return (
    <List listStyleType="disc" spacing="xs" withPadding>
      {data.items.map((row) => (
        <List.Item key={row.id}>
          <Anchor component={Link} href={`/issues/${row.id}`} fw={600}>
            {row.title}
          </Anchor>
          {row.issue_statuses?.name ? (
            <Text span c="dimmed" size="sm" ml="xs">
              ({row.issue_statuses.name})
            </Text>
          ) : null}
        </List.Item>
      ))}
    </List>
  );
};
