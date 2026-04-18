"use client";

import {
  Button,
  Divider,
  Group,
  Select,
  Stack,
  Table,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { listUserProfilesForIssueFilters } from "@/features/issues/actions";
import { IssuesQueryError } from "@/features/issues/issues-query-error";
import { addProjectMember, removeProjectMember, renameProject } from "@/features/projects/actions";
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers";

import { projectQueryKeys } from "../keys";

interface ProjectSettingsPageClientProps {
  locale: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  isSuperAdmin: boolean;
}

const ProjectSettingsPageClient = ({
  locale,
  projectId,
  projectName,
  isSuperAdmin,
}: ProjectSettingsPageClientProps) => {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const errMsg = (key: string) =>
    key.startsWith("projects.")
      ? t(key as Parameters<typeof t>[0])
      : t(`issues.${key}` as Parameters<typeof t>[0]);
  const { data: members = [], isPending } = useProjectMembers(locale, projectId);
  const [addUserId, setAddUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState(projectName);
  const [renaming, setRenaming] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["adminUserPick", locale],
    queryFn: async () => {
      const result = await listUserProfilesForIssueFilters(locale, {});
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
  });

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members],
  );

  const addOptions = useMemo(
    () =>
      allUsers
        .filter((u) => !memberIds.has(u.id))
        .map((u) => ({
          value: u.id,
          label: u.full_name?.trim() || u.email?.trim() || u.id,
        })),
    [allUsers, memberIds],
  );

  const onAdd = async () => {
    if (!addUserId) return;
    setBusy(true);
    const result = await addProjectMember(locale, {
      projectId,
      userId: addUserId,
      role: "member",
    });
    setBusy(false);
    if (!result.ok) {
      notifications.show({
        title: t("projects.settings.addFailed"),
        message: errMsg(result.errorKey),
        color: "red",
      });
      return;
    }
    setAddUserId(null);
    await queryClient.invalidateQueries({
      queryKey: projectQueryKeys.members(locale, projectId),
    });
    await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    notifications.show({
      title: t("projects.settings.addSuccess"),
      message: "",
      color: "green",
    });
  };

  const onRemove = async (userId: string) => {
    setBusy(true);
    const result = await removeProjectMember(locale, { projectId, userId });
    setBusy(false);
    if (!result.ok) {
      notifications.show({
        title: t("projects.settings.removeFailed"),
        message: errMsg(result.errorKey),
        color: "red",
      });
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: projectQueryKeys.members(locale, projectId),
    });
    await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    notifications.show({
      title: t("projects.settings.removeSuccess"),
      message: "",
      color: "green",
    });
  };

  const onRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === projectName) return;
    setRenaming(true);
    const result = await renameProject(locale, { projectId, name: trimmed });
    setRenaming(false);
    if (!result.ok) {
      notifications.show({
        title: t("projects.settings.renameFailed"),
        message: errMsg(result.errorKey),
        color: "red",
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    notifications.show({
      title: t("projects.settings.renameSuccess"),
      message: "",
      color: "green",
    });
  };

  return (
    <Stack gap="md">
      {isSuperAdmin && (
        <>
          <Title order={4}>{t("projects.settings.renameTitle")}</Title>
          <Group align="flex-end" wrap="wrap">
            <TextInput
              label={t("projects.settings.renameLabel")}
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              maw={360}
            />
            <Button
              onClick={onRename}
              disabled={!newName.trim() || newName.trim() === projectName || renaming}
              loading={renaming}
            >
              {t("projects.settings.renameButton")}
            </Button>
          </Group>
          <Divider />
        </>
      )}
      <Title order={3}>{t("projects.settings.membersTitle")}</Title>
      <Group align="flex-end" wrap="wrap">
        <Select
          label={t("projects.settings.addMemberLabel")}
          placeholder={t("projects.settings.addMemberPlaceholder")}
          data={addOptions}
          value={addUserId}
          onChange={setAddUserId}
          searchable
          comboboxProps={{ withinPortal: true }}
          maw={360}
        />
        <Button
          onClick={onAdd}
          disabled={!addUserId || busy}
          loading={busy}
          leftSection={<IconPlus size={16} />}
        >
          {t("projects.settings.addMember")}
        </Button>
      </Group>
      {isPending ? (
        <TableSkeleton
          columnWidths={["45%", "30%", "25%"]}
          rows={4}
          ariaLabel={t("projects.settings.loading")}
        />
      ) : (
        <Table.ScrollContainer minWidth={400}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("projects.settings.colUser")}</Table.Th>
                <Table.Th>{t("projects.settings.colRole")}</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>
                  {t("projects.settings.colAction")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {members.map((m) => {
                const profile = m.user_profiles;
                const label =
                  profile?.full_name?.trim() ||
                  profile?.email?.trim() ||
                  m.user_id;
                return (
                  <Table.Tr key={m.user_id}>
                    <Table.Td>{label}</Table.Td>
                    <Table.Td>{m.role}</Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => onRemove(m.user_id)}
                        disabled={busy}
                      >
                        {t("projects.settings.remove")}
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
};

export default ProjectSettingsPageClient;
