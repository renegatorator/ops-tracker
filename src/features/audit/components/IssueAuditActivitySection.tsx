"use client";

import { Stack, Table, Text, Title } from "@mantine/core";
import { useTranslations } from "next-intl";

import { isIssuesQueryError } from "@/features/issues/issues-query-error";

import { useIssueAuditActivity } from "../hooks/useIssueAuditActivity";

const metadataPreview = (meta: Record<string, unknown>): string => {
  try {
    const s = JSON.stringify(meta);
    return s.length > 160 ? `${s.slice(0, 160)}…` : s;
  } catch {
    return "—";
  }
};

interface IssueAuditActivitySectionProps {
  locale: string;
  issueId: string;
}

export const IssueAuditActivitySection = ({
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
                <Table.Th>{t("details")}</Table.Th>
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
                    <Text size="xs" ff="monospace">
                      {row.action}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" ff="monospace" truncate maw={240}>
                      {metadataPreview(row.metadata as Record<string, unknown>)}
                    </Text>
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
