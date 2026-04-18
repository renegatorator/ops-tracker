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

import {
  createIssueStatus,
  deleteIssueStatus,
  listIssueStatuses,
  updateIssueStatus,
} from "@/features/issues/actions";

import { isIssuesQueryError,IssuesQueryError } from "../issues-query-error";
import { issueQueryKeys } from "../keys";
import type { IssueStatusRow } from "../types";

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

  const createForm = useForm({
    initialValues: {
      name: "",
      slug: "",
      sort_order: 0,
      is_terminal: false,
    },
    validate: {
      name: (v) =>
        !v?.trim() ? t("issues.validation.statusNameRequired") : null,
      slug: (v) => (!v?.trim() ? t("issues.validation.slugInvalid") : null),
    },
  });

  const editForm = useForm({
    initialValues: {
      name: "",
      slug: "",
      sort_order: 0,
      is_terminal: false,
    },
    validate: {
      name: (v) =>
        !v?.trim() ? t("issues.validation.statusNameRequired") : null,
      slug: (v) => (!v?.trim() ? t("issues.validation.slugInvalid") : null),
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const result = await createIssueStatus(locale, createForm.values);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
    onSuccess: async () => {
      await invalidate();
      setCreateOpen(false);
      createForm.reset();
    },
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editing) {
        throw new Error("No row selected");
      }
      const result = await updateIssueStatus(locale, {
        statusId: editing.id,
        name: editForm.values.name,
        slug: editForm.values.slug,
        sort_order: editForm.values.sort_order,
        is_terminal: editForm.values.is_terminal,
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

  const deleteMut = useMutation({
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
    editForm.setValues({
      name: row.name,
      slug: row.slug,
      sort_order: row.sort_order,
      is_terminal: row.is_terminal,
    });
    setEditing(row);
  };

  if (isPending) {
    return <Text c="dimmed">{t("admin.statuses.loading")}</Text>;
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
        <form
          onSubmit={createForm.onSubmit(() => createMut.mutate())}
        >
          <Stack gap="sm">
            <TextInput
              label={t("admin.statuses.name")}
              {...createForm.getInputProps("name")}
            />
            <TextInput
              label={t("admin.statuses.slug")}
              description={t("admin.statuses.slugHint")}
              {...createForm.getInputProps("slug")}
            />
            <NumberInput
              label={t("admin.statuses.sortOrder")}
              {...createForm.getInputProps("sort_order")}
            />
            <Switch
              label={t("admin.statuses.terminal")}
              {...createForm.getInputProps("is_terminal", { type: "checkbox" })}
            />
            {createMut.isError && isIssuesQueryError(createMut.error) ? (
              <Text c="red" size="sm">
                {t(
                  `admin.${createMut.error.errorKey}` as Parameters<typeof t>[0],
                )}
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCreateOpen(false)}>
                {t("admin.statuses.cancel")}
              </Button>
              <Button type="submit" loading={createMut.isPending}>
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
        <form onSubmit={editForm.onSubmit(() => updateMut.mutate())}>
          <Stack gap="sm">
            <TextInput
              label={t("admin.statuses.name")}
              {...editForm.getInputProps("name")}
            />
            <TextInput
              label={t("admin.statuses.slug")}
              {...editForm.getInputProps("slug")}
            />
            <NumberInput
              label={t("admin.statuses.sortOrder")}
              {...editForm.getInputProps("sort_order")}
            />
            <Switch
              label={t("admin.statuses.terminal")}
              {...editForm.getInputProps("is_terminal", { type: "checkbox" })}
            />
            {updateMut.isError && isIssuesQueryError(updateMut.error) ? (
              <Text c="red" size="sm">
                {t(
                  `admin.${updateMut.error.errorKey}` as Parameters<typeof t>[0],
                )}
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setEditing(null)}>
                {t("admin.statuses.cancel")}
              </Button>
              <Button type="submit" loading={updateMut.isPending}>
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
          {deleteMut.isError && isIssuesQueryError(deleteMut.error) ? (
            <Text c="red" size="sm">
              {t(
                `admin.${deleteMut.error.errorKey}` as Parameters<typeof t>[0],
              )}
            </Text>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleting(null)}>
              {t("admin.statuses.cancel")}
            </Button>
            <Button
              color="red"
              loading={deleteMut.isPending}
              onClick={() => deleteMut.mutate()}
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
