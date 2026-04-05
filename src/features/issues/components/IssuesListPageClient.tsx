"use client";

import {
  Button,
  Checkbox,
  Group,
  Menu,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import type { VisibilityState } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

import { useAssigneeFilterOptions } from "../hooks/useAssigneeFilterOptions";
import { useAssignIssue } from "../hooks/useAssignIssue";
import { useIssuesList } from "../hooks/useIssuesList";
import { useIssueStatuses } from "../hooks/useIssueStatuses";
import { isIssuesQueryError } from "../issues-query-error";
import {
  issuesListParamsToSearchParams,
  type IssuesListSortField,
  parseIssuesListParams,
  patchIssuesListParams,
} from "../list-url-params";
import type { ListIssuesSchemaInput } from "../schemas";
import { IssuesVirtualizedTable } from "./IssuesVirtualizedTable";

const COLUMN_STORAGE_KEY = "ops-issues-table-columns-v1";

const TABLE_COLUMN_IDS = [
  "title",
  "status",
  "created_at",
  "updated_at",
  "assignee",
] as const;

interface IssuesListPageClientProps {
  locale: string;
  currentUserId: string;
  canListAllAssignees: boolean;
}

function loadColumnVisibility(): VisibilityState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as VisibilityState;
  } catch {
    return {};
  }
}

export const IssuesListPageClient = ({
  locale,
  currentUserId,
  canListAllAssignees,
}: IssuesListPageClientProps) => {
  const t = useTranslations("issues");
  const tTable = useTranslations("issues.table");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsKey = searchParams.toString();

  const listParams = useMemo(
    () => parseIssuesListParams(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  );

  const replaceListUrl = useCallback(
    (next: ListIssuesSchemaInput) => {
      const qs = issuesListParamsToSearchParams(next);
      const q = qs.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router],
  );

  const { data, isPending, isError, error, isFetching } = useIssuesList(
    locale,
    listParams,
  );

  const { data: statuses = [] } = useIssueStatuses(locale);
  const { data: adminUsers = [] } = useAssigneeFilterOptions(
    locale,
    canListAllAssignees,
  );
  const assignIssue = useAssignIssue(locale);

  const assignColumnOptions = useMemo(
    () =>
      adminUsers.map((u) => ({
        value: u.id,
        label: u.full_name?.trim() || u.email?.trim() || u.id,
      })),
    [adminUsers],
  );

  const assignPendingIssueId =
    assignIssue.isPending && assignIssue.variables
      ? assignIssue.variables.issueId
      : null;

  const qFromUrl = searchParams.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(qFromUrl);
  const [debouncedSearch] = useDebouncedValue(searchDraft, 300);

  useEffect(() => {
    setSearchDraft(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    const currentQ = (searchParams.get("q") ?? "").trim();
    const nextQ = debouncedSearch.trim();
    if (nextQ === currentQ) return;
    replaceListUrl(
      patchIssuesListParams(listParams, {
        search: nextQ || undefined,
        resetPage: true,
      }),
    );
  }, [debouncedSearch, listParams, replaceListUrl, searchParams]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    setColumnVisibility(loadColumnVisibility());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnVisibility));
    } catch {
      /* ignore quota / private mode */
    }
  }, [columnVisibility]);

  const onSortChange = useCallback(
    (field: IssuesListSortField, dir: "asc" | "desc") => {
      replaceListUrl(
        patchIssuesListParams(listParams, {
          sortBy: field,
          sortDir: dir,
        }),
      );
    },
    [listParams, replaceListUrl],
  );

  const page =
    listParams.mode === "offset"
      ? Math.floor(listParams.offset / listParams.limit)
      : 0;

  const statusSelectData = useMemo(
    () => [
      { value: "", label: tTable("filterStatusAll") },
      ...statuses.map((s) => ({ value: s.id, label: s.name })),
    ],
    [statuses, tTable],
  );

  const assigneeSelectData = useMemo(() => {
    const base: { value: string; label: string }[] = [
      { value: "", label: tTable("filterAssigneeAll") },
      { value: currentUserId, label: tTable("filterAssigneeMe") },
    ];
    if (!canListAllAssignees) return base;
    const seen = new Set(base.map((o) => o.value));
    for (const u of adminUsers) {
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      base.push({
        value: u.id,
        label: u.full_name?.trim() || u.email?.trim() || u.id,
      });
    }
    return base;
  }, [adminUsers, canListAllAssignees, currentUserId, tTable]);

  const perPageData = useMemo(
    () =>
      [20, 50, 100].map((n) => ({
        value: String(n),
        label: tTable("perPage", { count: n }),
      })),
    [tTable],
  );

  const pagination =
    data?.pagination.mode === "offset"
      ? data.pagination
      : null;

  return (
    <Stack gap="md" w="100%" maw={1200}>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
        <TextInput
          label={tTable("searchLabel")}
          placeholder={tTable("searchPlaceholder")}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.currentTarget.value)}
          aria-label={tTable("searchLabel")}
        />
        <Select
          label={tTable("filterStatus")}
          data={statusSelectData}
          value={listParams.statusId ?? ""}
          onChange={(v) =>
            replaceListUrl(
              patchIssuesListParams(listParams, {
                statusId: v || undefined,
                resetPage: true,
              }),
            )
          }
          searchable
          clearable={false}
        />
        <Select
          label={tTable("filterAssignee")}
          data={assigneeSelectData}
          value={listParams.assigneeId ?? ""}
          onChange={(v) =>
            replaceListUrl(
              patchIssuesListParams(listParams, {
                assigneeId: v || undefined,
                resetPage: true,
              }),
            )
          }
          searchable
          clearable={false}
        />
        <Select
          label={tTable("rowsPerPage")}
          data={perPageData}
          value={String(listParams.limit)}
          onChange={(v) => {
            const limit = Number.parseInt(v ?? "20", 10);
            if (![20, 50, 100].includes(limit)) return;
            replaceListUrl(
              patchIssuesListParams(
                { ...listParams, limit },
                { resetPage: true },
              ),
            );
          }}
        />
        <Menu shadow="md" width={260}>
          <Menu.Target>
            <Button variant="default" mt={{ base: 0, sm: 24 }}>
              {tTable("columnsMenu")}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {TABLE_COLUMN_IDS.map((id) => (
              <Menu.Item key={id} closeMenuOnClick={false}>
                <Checkbox
                  label={tTable(`columns.${id}`)}
                  checked={columnVisibility[id] !== false}
                  onChange={(e) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      [id]: e.currentTarget.checked,
                    }))
                  }
                />
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </SimpleGrid>

      {isPending ? (
        <Text c="dimmed">{t("loading")}</Text>
      ) : isError ? (
        <Text c="red">
          {t(
            isIssuesQueryError(error) ? error.errorKey : "errors.listFailed",
          )}
        </Text>
      ) : data ? (
        <>
          {isFetching ? (
            <Text size="sm" c="dimmed">
              {tTable("refreshing")}
            </Text>
          ) : null}
          <IssuesVirtualizedTable
            locale={locale}
            data={data.items}
            sortBy={
              (listParams.sortBy ?? "created_at") as IssuesListSortField
            }
            sortDir={listParams.sortDir ?? "desc"}
            onSortChange={onSortChange}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            canAssignIssues={canListAllAssignees}
            assigneeSelectOptions={assignColumnOptions}
            onAssignIssue={(issueId, assigneeId) =>
              assignIssue.mutate({ issueId, assigneeId })
            }
            assignPendingIssueId={assignPendingIssueId}
          />
          {pagination ? (
            <Group justify="space-between" wrap="wrap">
              <Text size="sm" c="dimmed">
                {tTable("pageSummary", {
                  page: page + 1,
                  count: data.items.length,
                })}
              </Text>
              <Group gap="xs">
                <Button
                  variant="default"
                  disabled={page <= 0}
                  onClick={() =>
                    replaceListUrl(
                      patchIssuesListParams(listParams, {
                        offset: Math.max(
                          0,
                          listParams.offset - listParams.limit,
                        ),
                      }),
                    )
                  }
                >
                  {tTable("prevPage")}
                </Button>
                <Button
                  variant="default"
                  disabled={!pagination.hasMore}
                  onClick={() =>
                    replaceListUrl(
                      patchIssuesListParams(listParams, {
                        offset: listParams.offset + listParams.limit,
                      }),
                    )
                  }
                >
                  {tTable("nextPage")}
                </Button>
              </Group>
            </Group>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
};
