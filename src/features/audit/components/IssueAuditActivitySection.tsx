"use client";

import { Badge, Stack, Table, Text, Title } from "@mantine/core";
import { useTranslations } from "next-intl";

import { isIssuesQueryError } from "@/features/issues/issues-query-error";

import { auditActionColor } from "../auditUtils";
import { useAuditTranslations } from "../hooks/useAuditTranslations";
import { useIssueAuditActivity } from "../hooks/useIssueAuditActivity";
import type { AuditLogRow } from "../types";

const formatIssueKey = (row: AuditLogRow): string => {
  const m = row.metadata as Record<string, unknown>;
  if (typeof m.issue_key === "string" && m.issue_key) return m.issue_key;
  return "—";
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
  const { translateAction } = useAuditTranslations();

  const formatSummary = (row: AuditLogRow): string => {
    const m = row.metadata as Record<string, unknown>;
    switch (row.action) {
      case "issue.create":
        return typeof m.title === "string" ? m.title : "—";
      case "issue.update": {
        const fields = Array.isArray(m.fields) ? (m.fields as string[]) : [];
        return fields.length > 0
          ? t("summary.update", { fields: fields.join(", ") })
          : t("summary.updateNoFields");
      }
      case "issue.assign": {
        if (m.assignee_id == null) return t("summary.unassign");
        return typeof m.assignee_id === "string"
          ? t("summary.assign", { id: m.assignee_id.slice(0, 8) })
          : t("summary.assigned");
      }
      case "issue.status_transition":
        return typeof m.status_id === "string"
          ? t("summary.statusChange", { id: m.status_id.slice(0, 8) })
          : t("summary.statusChanged");
      case "issue.archive":
        return t("summary.archive");
      default:
        return row.action;
    }
  };
  const {
    data = [],
    isPending,
    isError,
    error,
  } = useIssueAuditActivity(locale, issueId);

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
                <Table.Th>{t("summaryColumn")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Text size="xs" ff="monospace">
                      {new Date(row.created_at).toLocaleString(locale)}
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
                    <Badge
                      size="xs"
                      color={auditActionColor(row.action)}
                      variant="light"
                    >
                      {translateAction(row.action)}
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
