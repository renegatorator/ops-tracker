"use client";

import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconSettings } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { isIssuesQueryError } from "@/features/issues/issues-query-error";
import { createProject } from "@/features/projects/actions";
import { useProjectsList } from "@/features/projects/hooks/useProjectsList";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppRole } from "@/lib/auth/types";
import { isAdminAccessRole } from "@/lib/auth/types";
import { projectBoardPath, projectSettingsPath } from "@/lib/routes";

const defaultValues = {
  key: "",
  name: "",
  description: "",
};

type CreateProjectFormValues = typeof defaultValues;

interface ProjectsListPageClientProps {
  locale: string;
  userRole: AppRole;
}

const ProjectsListPageClient = ({
  locale,
  userRole,
}: ProjectsListPageClientProps) => {
  const t = useTranslations();
  const router = useRouter();
  const canManage = isAdminAccessRole(userRole);
  const {
    data: projects = [],
    isPending,
    isError,
    error,
    refetch,
  } = useProjectsList(locale);
  const [creating, setCreating] = useState(false);

  const {
    onSubmit: handleFormSubmit,
    getInputProps,
    reset,
  } = useForm<CreateProjectFormValues>({
    initialValues: defaultValues,
    validate: {
      key: (v) => (!v.trim() ? t("projects.list.keyRequired") : null),
      name: (v) => (!v.trim() ? t("projects.list.nameRequired") : null),
    },
  });

  const onCreate = handleFormSubmit(async (values) => {
    const result = await createProject(locale, {
      key: values.key.trim().toUpperCase(),
      name: values.name.trim(),
      description: values.description.trim() || undefined,
    });
    if (!result.ok) {
      notifications.show({
        title: t("projects.list.createFailed"),
        message: result.errorKey.startsWith("projects.errors.")
          ? t(result.errorKey as Parameters<typeof t>[0])
          : t(`issues.${result.errorKey}` as Parameters<typeof t>[0]),
        color: "red",
      });
      return;
    }
    notifications.show({
      title: t("projects.list.createSuccess"),
      message: t("projects.list.createSuccessMessage"),
      color: "green",
    });
    reset();
    setCreating(false);
    await refetch();
    const key = values.key.trim().toUpperCase();
    router.push(projectBoardPath(key));
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Title order={2} data-testid="projects-page-title">
          {t("projects.list.title")}
        </Title>
        {canManage ? (
          <Button
            onClick={() => setCreating((v) => !v)}
            leftSection={creating ? undefined : <IconPlus size={16} />}
          >
            {creating
              ? t("projects.list.cancelCreate")
              : t("projects.list.newProject")}
          </Button>
        ) : null}
      </Group>

      {creating && canManage ? (
        <Paper withBorder p="md" radius="md">
          <form onSubmit={onCreate}>
            <Stack gap="sm">
              <TextInput
                label={t("projects.list.keyLabel")}
                description={t("projects.list.keyHint")}
                {...getInputProps("key")}
              />
              <TextInput
                label={t("projects.list.nameLabel")}
                {...getInputProps("name")}
              />
              <TextInput
                label={t("projects.list.descriptionLabel")}
                {...getInputProps("description")}
              />
              <Button type="submit" leftSection={<IconPlus size={16} />}>
                {t("projects.list.submitCreate")}
              </Button>
            </Stack>
          </form>
        </Paper>
      ) : null}

      {isPending ? (
        <TableSkeleton
          columnWidths={["20%", "55%", "25%"]}
          ariaLabel={t("projects.list.loading")}
        />
      ) : isError ? (
        <Text c="red">
          {isIssuesQueryError(error)
            ? t(`issues.${error.errorKey}` as Parameters<typeof t>[0])
            : t("projects.list.loadFailed")}
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={480}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("projects.list.colKey")}</Table.Th>
                <Table.Th>{t("projects.list.colName")}</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>
                  {t("projects.list.colAction")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {projects.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Text ff="monospace" fw={600}>
                      {p.key}
                    </Text>
                  </Table.Td>
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap" justify="flex-end">
                      <Button
                        component={Link}
                        href={projectBoardPath(p.key)}
                        size="xs"
                        variant="light"
                      >
                        {t("projects.list.open")}
                      </Button>
                      {canManage && (
                        <Tooltip
                          label={t("projects.list.settings")}
                          position="top"
                          withArrow
                        >
                          <ActionIcon
                            component={Link}
                            href={projectSettingsPath(p.key)}
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={t("projects.list.settings")}
                          >
                            <IconSettings size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
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

export default ProjectsListPageClient;
