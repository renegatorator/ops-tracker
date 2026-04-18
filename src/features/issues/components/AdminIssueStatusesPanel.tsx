"use client";

import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import TableSkeleton from "@/components/skeletons/TableSkeleton";
import {
  createIssueStatus,
  deleteIssueStatus,
  listIssueStatuses,
  updateIssueStatus,
} from "@/features/issues/actions";

import { isIssuesQueryError, IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";
import type { IssueStatusRow } from "../types";

const defaultStatusValues = {
  name: "",
  slug: "",
  sort_order: 0,
  is_terminal: false,
};

type IssueStatusFormValues = typeof defaultStatusValues;

interface AdminIssueStatusesPanelProps {
  locale: string;
}

const AdminIssueStatusesPanel = ({
  locale,
}: AdminIssueStatusesPanelProps) => {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<IssueStatusRow | null>(null);
  const [deleting, setDeleting] = useState<IssueStatusRow | null>(null);

  const { data = [], isPending, isError, error } = useQuery({
    queryKey: issueQueryKeys.statuses(locale),
    queryFn: async () => {
      const result = await listIssueStatuses(locale);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: issueQueryKeys.statuses(locale),
    });

  const {
    values: createValues,
    onSubmit: handleCreateSubmit,
    getInputProps: getCreateInputProps,
    reset: resetCreateForm,
  } = useForm<IssueStatusFormValues>({
    initialValues: defaultStatusValues,
    validate: {
      name: (v) =>
        !v?.trim() ? t("issues.validation.statusNameRequired") : null,
      slug: (v) => (!v?.trim() ? t("issues.validation.slugInvalid") : null),
    },
  });

  const {
    values: editValues,
    onSubmit: handleEditSubmit,
    getInputProps: getEditInputProps,
    setValues: setEditValues,
  } = useForm<IssueStatusFormValues>({
    initialValues: defaultStatusValues,
    validate: {
      name: (v) =>
        !v?.trim() ? t("issues.validation.statusNameRequired") : null,
      slug: (v) => (!v?.trim() ? t("issues.validation.slugInvalid") : null),
    },
  });

  const {
    mutate: createStatus,
    isPending: createPending,
    isError: createFailed,
    error: createError,
  } = useMutation({
    mutationFn: async () => {
      const result = await createIssueStatus(locale, createValues);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onSuccess: async () => {
      await invalidate();
      setCreateOpen(false);
      resetCreateForm();
    },
  });

  const {
    mutate: updateStatus,
    isPending: updatePending,
    isError: updateFailed,
    error: updateError,
  } = useMutation({
    mutationFn: async () => {
      if (!editing) {
        throw new Error("No row selected");
      }
      const result = await updateIssueStatus(locale, {
        statusId: editing.id,
        name: editValues.name,
        slug: editValues.slug,
        sort_order: editValues.sort_order,
        is_terminal: editValues.is_terminal,
      });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onSuccess: async () => {
      await invalidate();
      setEditing(null);
    },
  });

  const {
    mutate: deleteStatus,
    isPending: deletePending,
    isError: deleteFailed,
    error: deleteError,
  } = useMutation({
    mutationFn: async () => {
      if (!deleting) {
        throw new Error("No row selected");
      }
      const result = await deleteIssueStatus(locale, {
        statusId: deleting.id,
      });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onSuccess: async () => {
      await invalidate();
      setDeleting(null);
    },
  });

  const openEdit = (row: IssueStatusRow) => {
    setEditValues({
      name: row.name,
      slug: row.slug,
      sort_order: row.sort_order,
      is_terminal: row.is_terminal,
    });
    setEditing(row);
  };

  if (isPending) {
    return (
      <TableSkeleton
        columnWidths={["30%", "20%", "10%", "15%", "15%", "10%"]}
        ariaLabel={t("admin.statuses.loading")}
      />
    );
  }
  if (isError) {
    const key = isIssuesQueryError(error) ? error.errorKey : "errors.readFailed";
    return <Text c="red">{t(`issues.${key}` as Parameters<typeof t>[0])}</Text>;
  }

  return (
    <Stack gap="md">
      <Group justify="flex-end">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          {t("admin.statuses.add")}
        </Button>
      </Group>

      <Table.ScrollContainer minWidth={640}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("admin.statuses.name")}</Table.Th>
              <Table.Th>{t("admin.statuses.slug")}</Table.Th>
              <Table.Th>{t("admin.statuses.sortOrder")}</Table.Th>
              <Table.Th>{t("admin.statuses.terminal")}</Table.Th>
              <Table.Th w={100} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.name}</Table.Td>
                <Table.Td>{row.slug}</Table.Td>
                <Table.Td>{row.sort_order}</Table.Td>
                <Table.Td>
                  {row.is_terminal
                    ? t("admin.statuses.yes")
                    : t("admin.statuses.no")}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      aria-label={t("admin.statuses.edit")}
                      onClick={() => openEdit(row)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={t("admin.statuses.delete")}
                      onClick={() => setDeleting(row)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Modal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("admin.statuses.createTitle")}
      >
        <form onSubmit={handleCreateSubmit(() => createStatus())}>
          <Stack gap="sm">
            <TextInput
              label={t("admin.statuses.name")}
              {...getCreateInputProps("name")}
            />
            <TextInput
              label={t("admin.statuses.slug")}
              description={t("admin.statuses.slugHint")}
              {...getCreateInputProps("slug")}
            />
            <NumberInput
              label={t("admin.statuses.sortOrder")}
              {...getCreateInputProps("sort_order")}
            />
            <Switch
              label={t("admin.statuses.terminal")}
              {...getCreateInputProps("is_terminal", { type: "checkbox" })}
            />
            {createFailed && isIssuesQueryError(createError) ? (
              <Text c="red" size="sm">
                {t(`admin.${createError.errorKey}` as Parameters<typeof t>[0])}
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCreateOpen(false)}>
                {t("admin.statuses.cancel")}
              </Button>
              <Button type="submit" loading={createPending}>
                {t("admin.statuses.save")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={editing != null}
        onClose={() => setEditing(null)}
        title={t("admin.statuses.editTitle")}
      >
        <form onSubmit={handleEditSubmit(() => updateStatus())}>
          <Stack gap="sm">
            <TextInput
              label={t("admin.statuses.name")}
              {...getEditInputProps("name")}
            />
            <TextInput
              label={t("admin.statuses.slug")}
              {...getEditInputProps("slug")}
            />
            <NumberInput
              label={t("admin.statuses.sortOrder")}
              {...getEditInputProps("sort_order")}
            />
            <Switch
              label={t("admin.statuses.terminal")}
              {...getEditInputProps("is_terminal", { type: "checkbox" })}
            />
            {updateFailed && isIssuesQueryError(updateError) ? (
              <Text c="red" size="sm">
                {t(`admin.${updateError.errorKey}` as Parameters<typeof t>[0])}
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setEditing(null)}>
                {t("admin.statuses.cancel")}
              </Button>
              <Button type="submit" loading={updatePending}>
                {t("admin.statuses.save")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleting != null}
        onClose={() => setDeleting(null)}
        title={t("admin.statuses.deleteTitle")}
      >
        <Stack gap="md">
          <Text size="sm">
            {t("admin.statuses.deleteConfirm", { name: deleting?.name ?? "" })}
          </Text>
          {deleteFailed && isIssuesQueryError(deleteError) ? (
            <Text c="red" size="sm">
              {t(`admin.${deleteError.errorKey}` as Parameters<typeof t>[0])}
            </Text>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleting(null)}>
              {t("admin.statuses.cancel")}
            </Button>
            <Button
              color="red"
              loading={deletePending}
              onClick={() => deleteStatus()}
            >
              {t("admin.statuses.delete")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default AdminIssueStatusesPanel;
