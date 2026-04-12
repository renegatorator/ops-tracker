"use client";

import {
  Button,
  Group,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { listUserProfilesForIssueFilters } from "@/features/issues/actions";
import { IssuesQueryError } from "@/features/issues/issues-query-error";
import { addProjectMember, removeProjectMember } from "@/features/projects/actions";
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers";

import { projectQueryKeys } from "../keys";

interface ProjectSettingsPageClientProps {
  locale: string;
  projectId: string;
  projectKey: string;
}

const ProjectSettingsPageClient = ({
  locale,
  projectId,
}: ProjectSettingsPageClientProps) => {
  const t = useTranslations("projects.settings");
  const queryClient = useQueryClient();
  const { data: members = [], isPending } = useProjectMembers(locale, projectId);
  const [addUserId, setAddUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        title: t("addFailed"),
        message: t(result.errorKey),
        color: "red",
      });
      return;
    }
    setAddUserId(null);
    await queryClient.invalidateQueries({
      queryKey: projectQueryKeys.members(locale, projectId),
    });
    await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    notifications.show({ title: t("addSuccess"), message: "", color: "green" });
  };

  const onRemove = async (userId: string) => {
    setBusy(true);
    const result = await removeProjectMember(locale, { projectId, userId });
    setBusy(false);
    if (!result.ok) {
      notifications.show({
        title: t("removeFailed"),
        message: t(result.errorKey),
        color: "red",
      });
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: projectQueryKeys.members(locale, projectId),
    });
    await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    notifications.show({
      title: t("removeSuccess"),
      message: "",
      color: "green",
    });
  };

  return (
    <Stack gap="md">
      <Title order={3}>{t("membersTitle")}</Title>
      <Group align="flex-end" wrap="wrap">
        <Select
          label={t("addMemberLabel")}
          placeholder={t("addMemberPlaceholder")}
          data={addOptions}
          value={addUserId}
          onChange={setAddUserId}
          searchable
          comboboxProps={{ withinPortal: true }}
          maw={360}
        />
        <Button onClick={onAdd} disabled={!addUserId || busy} loading={busy}>
          {t("addMember")}
        </Button>
      </Group>
      {isPending ? (
        <Text c="dimmed">{t("loading")}</Text>
      ) : (
        <Table.ScrollContainer minWidth={400}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("colUser")}</Table.Th>
                <Table.Th>{t("colRole")}</Table.Th>
                <Table.Th>{t("colAction")}</Table.Th>
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
                    <Table.Td>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => onRemove(m.user_id)}
                        disabled={busy}
                      >
                        {t("remove")}
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
