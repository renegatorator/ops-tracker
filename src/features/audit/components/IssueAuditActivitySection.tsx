"use client";

import { Badge, Stack, Table, Text, Title } from "@mantine/core";
import { useTranslations } from "next-intl";

import { isIssuesQueryError } from "@/features/issues/issues-query-error";

import { useIssueAuditActivity } from "../hooks/useIssueAuditActivity";
import type { AuditLogRow } from "../types";

const formatSummary = (row: AuditLogRow): string => {
  const m = row.metadata as Record<string, unknown>;
  switch (row.action) {
    case "issue.create":
      return typeof m.title === "string" ? m.title : "—";
    case "issue.update": {
      const fields = Array.isArray(m.fields) ? (m.fields as string[]) : [];
      return fields.length > 0 ? `Updated: ${fields.join(", ")}` : "Updated issue";
    }
    case "issue.assign": {
      if (m.assignee_id == null) return "Unassigned";
      return typeof m.assignee_id === "string"
        ? `Assigned to ${m.assignee_id.slice(0, 8)}…`
        : "Assigned";
    }
    case "issue.status_transition":
      return typeof m.status_id === "string"
        ? `Status → ${m.status_id.slice(0, 8)}…`
        : "Status changed";
    case "issue.archive":
      return "Issue archived";
    default:
      return row.action;
  }
};

const formatIssueKey = (row: AuditLogRow): string => {
  const m = row.metadata as Record<string, unknown>;
  if (typeof m.issue_key === "string" && m.issue_key) return m.issue_key;
  return "—";
};

const actionColor = (action: string): string => {
  if (action === "issue.create") return "green";
  if (action === "issue.archive") return "red";
  if (action.includes("assign")) return "blue";
  if (action.includes("status")) return "violet";
  return "gray";
};

interface IssueAuditActivitySectionProps {
  locale: string;
  issueId: string;
}

const IssueAuditActivitySection = ({
  locale,
  issueId,
}: IssueAuditActivitySectionProps) => {
  const t = useTranslations("issues.detail.activity");
  const tIssues = useTranslations("issues");
  const tAdmin = useTranslations("admin");
  const { data = [], isPending, isError, error } = useIssueAuditActivity(
    locale,
    issueId,
  );

  return (
    <Stack gap="sm" mt="lg">
      <Title order={4}>{t("title")}</Title>
      <Text size="xs" c="dimmed">
        {t("hint")}
      </Text>
      {isPending ? (
        <Text c="dimmed" size="sm">
          {t("loading")}
        </Text>
      ) : isError ? (
        <Text c="red" size="sm">
          {isIssuesQueryError(error)
            ? error.errorKey.startsWith("audit.")
              ? tAdmin(error.errorKey)
              : tIssues(error.errorKey)
            : t("loadFailed")}
        </Text>
      ) : data.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t("empty")}
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={480}>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("when")}</Table.Th>
                <Table.Th>{t("actor")}</Table.Th>
                <Table.Th>{t("action")}</Table.Th>
                <Table.Th>{t("issueKey")}</Table.Th>
                <Table.Th>{t("summary")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Text size="xs" ff="monospace">
                      {new Date(row.created_at).toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">
                      {row.actor?.full_name?.trim() ||
                        row.actor?.email?.trim() ||
                        row.actor_id.slice(0, 8)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={actionColor(row.action)} variant="light">
                      {row.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" ff="monospace">
                      {formatIssueKey(row)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{formatSummary(row)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
};

export default IssueAuditActivitySection;
