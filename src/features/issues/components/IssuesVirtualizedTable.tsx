"use client";

import {
  Anchor,
  Box,
  Group,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconSelector,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";
import { useMemo, useRef } from "react";

import { Link } from "@/i18n/navigation";

import type { IssuesListSortField } from "../list-url-params";
import type { IssueWithStatus } from "../types";

const VIRTUAL_ROW_HEIGHT = 48;
const VIRTUAL_THRESHOLD = 40;
const VIRTUAL_VIEWPORT_HEIGHT = 480;

const SORT_ID_SET = new Set<IssuesListSortField>([
  "created_at",
  "title",
  "updated_at",
  "status",
]);

interface IssuesVirtualizedTableProps {
  locale: string;
  data: IssueWithStatus[];
  sortBy: IssuesListSortField;
  sortDir: "asc" | "desc";
  onSortChange: (field: IssuesListSortField, dir: "asc" | "desc") => void;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (
    updater: VisibilityState | ((old: VisibilityState) => VisibilityState),
  ) => void;
}

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

function sortableHeader(
  label: string,
  columnId: IssuesListSortField,
  sortBy: IssuesListSortField,
  sortDir: "asc" | "desc",
  onSort: (field: IssuesListSortField, dir: "asc" | "desc") => void,
) {
  const active = sortBy === columnId;
  const ariaSort = active
    ? sortDir === "asc"
      ? "ascending"
      : "descending"
    : "none";

  const cycle = () => {
    if (!active) {
      onSort(columnId, columnId === "title" ? "asc" : "desc");
      return;
    }
    onSort(columnId, sortDir === "asc" ? "desc" : "asc");
  };

  const SortIcon =
    !active ? IconSelector : sortDir === "asc" ? IconChevronUp : IconChevronDown;

  return (
    <Group gap={6} wrap="nowrap">
      <UnstyledButton
        type="button"
        onClick={cycle}
        aria-sort={ariaSort}
        style={{ fontWeight: 600 }}
      >
        <Group gap={4} wrap="nowrap">
          {label}
          <SortIcon size={14} aria-hidden />
        </Group>
      </UnstyledButton>
    </Group>
  );
}

export const IssuesVirtualizedTable = ({
  locale,
  data,
  sortBy,
  sortDir,
  onSortChange,
  columnVisibility,
  onColumnVisibilityChange,
}: IssuesVirtualizedTableProps) => {
  const t = useTranslations("issues.table");
  const tCommon = useTranslations("issues");
  const scrollRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<IssueWithStatus, unknown>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: () =>
          sortableHeader(t("title"), "title", sortBy, sortDir, onSortChange),
        cell: ({ row }) => (
          <Anchor component={Link} href={`/issues/${row.original.id}`} fw={600}>
            {row.original.title}
          </Anchor>
        ),
      },
      {
        id: "status",
        accessorFn: (row) => row.issue_statuses?.name ?? "",
        header: () =>
          sortableHeader(t("status"), "status", sortBy, sortDir, onSortChange),
        cell: ({ row }) => (
          <Text size="sm">{row.original.issue_statuses?.name ?? "—"}</Text>
        ),
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: () =>
          sortableHeader(
            t("createdAt"),
            "created_at",
            sortBy,
            sortDir,
            onSortChange,
          ),
        cell: ({ row }) => (
          <Text size="sm">{formatDate(row.original.created_at, locale)}</Text>
        ),
      },
      {
        id: "updated_at",
        accessorKey: "updated_at",
        header: () =>
          sortableHeader(
            t("updatedAt"),
            "updated_at",
            sortBy,
            sortDir,
            onSortChange,
          ),
        cell: ({ row }) => (
          <Text size="sm">{formatDate(row.original.updated_at, locale)}</Text>
        ),
      },
      {
        id: "assignee",
        accessorFn: (row) =>
          row.assignee?.full_name?.trim() ||
          row.assignee?.email?.trim() ||
          "",
        header: t("assignee"),
        enableSorting: false,
        cell: ({ row }) => {
          const a = row.original.assignee;
          const label =
            a?.full_name?.trim() || a?.email?.trim() || tCommon("unassigned");
          return <Text size="sm">{label}</Text>;
        },
      },
    ],
    [locale, onSortChange, sortBy, sortDir, t, tCommon],
  );

  const sorting: SortingState = useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  /* TanStack Table returns unstable function refs; React Compiler skips memoization here. */
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable API
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onColumnVisibilityChange,
    manualSorting: true,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      if (first && SORT_ID_SET.has(first.id as IssuesListSortField)) {
        onSortChange(
          first.id as IssuesListSortField,
          first.desc ? "desc" : "asc",
        );
      }
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const useVirtual = rows.length >= VIRTUAL_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: useVirtual ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,
    overscan: 12,
  });

  const virtualRows = useVirtual ? virtualizer.getVirtualItems() : [];
  const totalSize = useVirtual ? virtualizer.getTotalSize() : 0;

  const tableInner = (
    <Table horizontalSpacing="sm" verticalSpacing="xs" striped highlightOnHover>
      <Table.Thead
        style={
          useVirtual
            ? {
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "var(--mantine-color-body)",
              }
            : undefined
        }
      >
        {table.getHeaderGroups().map((hg) => (
          <Table.Tr key={hg.id}>
            {hg.headers.map((h) => (
              <Table.Th key={h.id} scope="col">
                {h.isPlaceholder
                  ? null
                  : flexRender(h.column.columnDef.header, h.getContext())}
              </Table.Th>
            ))}
          </Table.Tr>
        ))}
      </Table.Thead>
      <Table.Tbody
        style={
          useVirtual
            ? { position: "relative", height: totalSize }
            : undefined
        }
      >
        {rows.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={columns.length}>
              <Text c="dimmed" size="sm">
                {tCommon("empty")}
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : useVirtual ? (
          virtualRows.map((vr) => {
            const row = rows[vr.index];
            if (!row) return null;
            return (
              <Table.Tr
                key={row.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vr.start}px)`,
                  height: vr.size,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Td key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
                  </Table.Td>
                ))}
              </Table.Tr>
            );
          })
        ) : (
          rows.map((row) => (
            <Table.Tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Td>
              ))}
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );

  if (useVirtual) {
    return (
      <Table.ScrollContainer minWidth={720} type="native">
        <Box
          ref={scrollRef}
          mah={VIRTUAL_VIEWPORT_HEIGHT}
          style={{ overflow: "auto" }}
        >
          {tableInner}
        </Box>
      </Table.ScrollContainer>
    );
  }

  return (
    <Table.ScrollContainer minWidth={720} type="native">
      {tableInner}
    </Table.ScrollContainer>
  );
};
