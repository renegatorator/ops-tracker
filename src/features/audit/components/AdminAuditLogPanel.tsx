"use client";

import {
  Button,
  Group,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { isIssuesQueryError } from "@/features/issues/issues-query-error";

import { auditMetadataPreview } from "../auditUtils";
import { useAdminAuditLogList } from "../hooks/useAdminAuditLogList";
import { useAuditTranslations } from "../hooks/useAuditTranslations";
import type { ListAuditLogsInput } from "../schemas";

const LIMIT = 25;

interface AdminAuditLogPanelProps {
  locale: string;
}

const AdminAuditLogPanel = ({ locale }: AdminAuditLogPanelProps) => {
  const t = useTranslations("admin.audit");
  const tAdmin = useTranslations("admin");
  const tIssues = useTranslations("issues");

  const { translateAction, translateEntityType } = useAuditTranslations();

  const [actionFilter, setActionFilter] = useState("");
  const [debouncedAction] = useDebouncedValue(actionFilter.trim(), 350);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [debouncedAction, entityType, fromDate, toDate]);

  const params: ListAuditLogsInput = useMemo(() => {
    const p: ListAuditLogsInput = {
      limit: LIMIT,
      offset: page * LIMIT,
    };
    if (debouncedAction.length) p.actionContains = debouncedAction;
    if (entityType) {
      p.entityType = entityType as ListAuditLogsInput["entityType"];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) p.fromDate = fromDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) p.toDate = toDate;
    return p;
  }, [debouncedAction, entityType, fromDate, toDate, page]);

  const { data, isPending, isError, error } = useAdminAuditLogList(
    locale,
    params,
  );

  const entityOptions = useMemo(
    () => [
      { value: "", label: t("filters.entityAll") },
      { value: "issue", label: t("filters.entity.issue") },
      { value: "issue_status", label: t("filters.entity.issue_status") },
      { value: "user_profile", label: t("filters.entity.user_profile") },
      { value: "system", label: t("filters.entity.system") },
    ],
    [t],
  );

  const translateError = (key: string) =>
    key.startsWith("audit.") ? tAdmin(key) : tIssues(key);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <Stack gap="md">
      <Group align="flex-end" gap="sm" wrap="wrap">
        <TextInput
          label={t("filters.action")}
          placeholder={t("filters.actionPlaceholder")}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.currentTarget.value)}
          w={220}
        />
        <Select
          label={t("filters.entityType")}
          data={entityOptions}
          value={entityType ?? ""}
          onChange={(v) => setEntityType(v && v.length ? v : null)}
          clearable
          w={200}
        />
        <TextInput
          type="date"
          label={t("filters.fromDate")}
          value={fromDate}
          onChange={(e) => setFromDate(e.currentTarget.value)}
          w={160}
        />
        <TextInput
          type="date"
          label={t("filters.toDate")}
          value={toDate}
          onChange={(e) => setToDate(e.currentTarget.value)}
          w={160}
        />
      </Group>

      {isPending ? (
        <Text c="dimmed">{t("loading")}</Text>
      ) : isError ? (
        <Text c="red">
          {isIssuesQueryError(error)
            ? translateError(error.errorKey)
            : t("errors.listFailed")}
        </Text>
      ) : data.items.length === 0 ? (
        <Text c="dimmed">{t("empty")}</Text>
      ) : (
        <>
          <Table.ScrollContainer minWidth={720}>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("table.when")}</Table.Th>
                  <Table.Th>{t("table.actor")}</Table.Th>
                  <Table.Th>{t("table.action")}</Table.Th>
                  <Table.Th>{t("table.entity")}</Table.Th>
                  <Table.Th>{t("table.entityId")}</Table.Th>
                  <Table.Th>{t("table.metadata")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.items.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {new Date(row.created_at).toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {row.actor?.full_name?.trim() ||
                          row.actor?.email?.trim() ||
                          row.actor_id.slice(0, 8)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {translateAction(row.action)}
                      </Text>
                    </Table.Td>
                    <Table.Td>{translateEntityType(row.entity_type)}</Table.Td>
                    <Table.Td>
                      <Text size="xs" ff="monospace" maw={120} truncate>
                        {row.entity_id ?? "—"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" ff="monospace" maw={280} truncate>
                        {auditMetadataPreview(row.metadata)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {t("pagination.summary", {
                from: data.offset + 1,
                to: data.offset + data.items.length,
                total: data.total,
              })}
            </Text>
            <Group gap="xs">
              <Button
                variant="default"
                size="xs"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t("pagination.prev")}
              </Button>
              <Text size="sm" c="dimmed">
                {t("pagination.pageOf", { page: page + 1, totalPages })}
              </Text>
              <Button
                variant="default"
                size="xs"
                disabled={!data.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("pagination.next")}
              </Button>
            </Group>
          </Group>
        </>
      )}
    </Stack>
  );
};

export default AdminAuditLogPanel;
