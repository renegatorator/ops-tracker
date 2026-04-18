"use client";

import { Badge, Stack, Table, Text, Title } from "@mantine/core";
import { useTranslations } from "next-intl";

import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { isIssuesQueryError } from "@/features/issues/issues-query-error";

import { auditActionColor } from "../auditUtils";
import { useAuditTranslations } from "../hooks/useAuditTranslations";
import { useIssueAuditActivity } from "../hooks/useIssueAuditActivity";
import type { AuditLogRow } from "../types";


interface IssueAuditActivitySectionProps {
  locale: string;
  issueId: string;
}

const IssueAuditActivitySection = ({
  locale,
  issueId,
}: IssueAuditActivitySectionProps) => {
  const t = useTranslations();
  const { translateAction } = useAuditTranslations();

  const formatSummary = (row: AuditLogRow): string => {
    const m = row.metadata as Record<string, unknown>;
    switch (row.action) {
      case "issue.create":
        return typeof m.title === "string" ? m.title : "—";
      case "issue.update": {
        const fields = Array.isArray(m.fields) ? (m.fields as string[]) : [];
        return fields.length > 0
          ? t("issues.detail.activity.summary.update", {
              fields: fields.join(", "),
            })
          : t("issues.detail.activity.summary.updateNoFields");
      }
      case "issue.assign": {
        if (m.assignee_id == null)
          return t("issues.detail.activity.summary.unassign");
        return typeof m.assignee_id === "string"
          ? t("issues.detail.activity.summary.assign", {
              id: m.assignee_id.slice(0, 8),
            })
          : t("issues.detail.activity.summary.assigned");
      }
      case "issue.status_transition":
        return typeof m.status_id === "string"
          ? t("issues.detail.activity.summary.statusChange", {
              id: m.status_id.slice(0, 8),
            })
          : t("issues.detail.activity.summary.statusChanged");
      case "issue.archive":
        return t("issues.detail.activity.summary.archive");
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
      <Title order={4}>{t("issues.detail.activity.title")}</Title>
      <Text size="xs" c="dimmed">
        {t("issues.detail.activity.hint")}
      </Text>
      {isPending ? (
        <TableSkeleton
          columnWidths={["20%", "25%", "25%", "30%"]}
          rows={3}
          ariaLabel={t("issues.detail.activity.loading")}
        />
      ) : isError ? (
        <Text c="red" size="sm">
          {isIssuesQueryError(error)
            ? error.errorKey.startsWith("audit.")
              ? t(`admin.${error.errorKey}` as Parameters<typeof t>[0])
              : t(`issues.${error.errorKey}` as Parameters<typeof t>[0])
            : t("issues.detail.activity.loadFailed")}
        </Text>
      ) : data.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t("issues.detail.activity.empty")}
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={480}>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("issues.detail.activity.when")}</Table.Th>
                <Table.Th>{t("issues.detail.activity.actor")}</Table.Th>
                <Table.Th>{t("issues.detail.activity.action")}</Table.Th>
                <Table.Th>{t("issues.detail.activity.summaryColumn")}</Table.Th>
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
