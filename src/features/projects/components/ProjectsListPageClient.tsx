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
import { IconSettings } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { isIssuesQueryError } from "@/features/issues/issues-query-error";
import { createProject } from "@/features/projects/actions";
import { useProjectsList } from "@/features/projects/hooks/useProjectsList";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppRole } from "@/lib/auth/types";
import { isAdminAccessRole } from "@/lib/auth/types";
import { projectBoardPath, projectSettingsPath } from "@/lib/routes";

interface ProjectsListPageClientProps {
  locale: string;
  userRole: AppRole;
}

const ProjectsListPageClient = ({
  locale,
  userRole,
}: ProjectsListPageClientProps) => {
  const t = useTranslations("projects.list");
  const tIssues = useTranslations("issues");
  const tProjErrors = useTranslations("projects.errors");
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

  const form = useForm({
    initialValues: { key: "", name: "", description: "" },
    validate: {
      key: (v) => (!v.trim() ? t("keyRequired") : null),
      name: (v) => (!v.trim() ? t("nameRequired") : null),
    },
  });

  const onCreate = form.onSubmit(async (values) => {
    const result = await createProject(locale, {
      key: values.key.trim().toUpperCase(),
      name: values.name.trim(),
      description: values.description.trim() || undefined,
    });
    if (!result.ok) {
      notifications.show({
        title: t("createFailed"),
        message: result.errorKey.startsWith("projects.errors.")
          ? tProjErrors(result.errorKey.replace("projects.errors.", ""))
          : tIssues(result.errorKey),
        color: "red",
      });
      return;
    }
    notifications.show({
      title: t("createSuccess"),
      message: t("createSuccessMessage"),
      color: "green",
    });
    form.reset();
    setCreating(false);
    await refetch();
    const key = values.key.trim().toUpperCase();
    router.push(projectBoardPath(key));
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Title order={2} data-testid="projects-page-title">
          {t("title")}
        </Title>
        {canManage ? (
          <Button onClick={() => setCreating((v) => !v)} variant="light">
            {creating ? t("cancelCreate") : t("newProject")}
          </Button>
        ) : null}
      </Group>

      {creating && canManage ? (
        <Paper withBorder p="md" radius="md">
          <form onSubmit={onCreate}>
            <Stack gap="sm">
              <TextInput
                label={t("keyLabel")}
                description={t("keyHint")}
                {...form.getInputProps("key")}
              />
              <TextInput
                label={t("nameLabel")}
                {...form.getInputProps("name")}
              />
              <TextInput
                label={t("descriptionLabel")}
                {...form.getInputProps("description")}
              />
              <Button type="submit">{t("submitCreate")}</Button>
            </Stack>
          </form>
        </Paper>
      ) : null}

      {isPending ? (
        <Text c="dimmed">{t("loading")}</Text>
      ) : isError ? (
        <Text c="red">
          {isIssuesQueryError(error)
            ? tIssues(error.errorKey)
            : t("loadFailed")}
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={480}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("colKey")}</Table.Th>
                <Table.Th>{t("colName")}</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>
                  {t("colAction")}
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
                        {t("open")}
                      </Button>
                      {canManage && (
                        <Tooltip label={t("settings")} position="top" withArrow>
                          <ActionIcon
                            component={Link}
                            href={projectSettingsPath(p.key)}
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={t("settings")}
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
