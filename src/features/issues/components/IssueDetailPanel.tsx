"use client";

import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBug, IconClipboardList, IconPencil } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import IssueAuditActivitySection from "@/features/audit/components/IssueAuditActivitySection";
import { useRouter } from "@/i18n/navigation";
import { projectIssuesPath } from "@/lib/routes";

import { useAssigneeFilterOptions } from "../hooks/useAssigneeFilterOptions";
import { useAssignIssue } from "../hooks/useAssignIssue";
import { useIssueDetail } from "../hooks/useIssueDetail";
import { useIssueStatuses } from "../hooks/useIssueStatuses";
import { useSoftDeleteIssue } from "../hooks/useSoftDeleteIssue";
import { useTransitionIssueStatus } from "../hooks/useTransitionIssueStatus";
import { useUpdateIssue } from "../hooks/useUpdateIssue";
import { isIssuesQueryError } from "../issues-query-error";
import { isIssueBug } from "../issueTypeUtils";

const UNASSIGNED_VALUE = "__unassigned__";

interface IssueDetailPanelProps {
  locale: string;
  issueId: string;
  canTransitionStatus: boolean;
  canAssignIssue: boolean;
  canEditDetails: boolean;
  canViewIssueAudit: boolean;
  isAdmin: boolean;
}

const IssueDetailPanel = ({
  locale,
  issueId,
  canTransitionStatus,
  canAssignIssue,
  canEditDetails,
  canViewIssueAudit,
  isAdmin,
}: IssueDetailPanelProps) => {
  const t = useTranslations("issues");
  const tDetail = useTranslations("issues.detail");
  const router = useRouter();

  const { data, isPending, isError, error } = useIssueDetail(locale, issueId);
  const {
    data: statuses = [],
    isPending: statusesPending,
    isError: statusesError,
  } = useIssueStatuses(locale);
  const {
    data: assigneeUsers = [],
    isPending: assigneesPending,
    isError: assigneesError,
  } = useAssigneeFilterOptions(locale, canAssignIssue && !!data?.project_id, data?.project_id);
  const transition = useTransitionIssueStatus(locale, issueId);
  const assignMutation = useAssignIssue(locale);
  const updateMutation = useUpdateIssue(locale, issueId);
  const closeIssue = useSoftDeleteIssue(locale);

  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] =
    useDisclosure(false);

  useEffect(() => {
    if (data) {
      setTitleDraft(data.title);
      setDescDraft(data.description ?? "");
    }
  }, [data]);

  const statusSelectData = statuses.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const assigneeSelectData = useMemo(
    () => [
      { value: UNASSIGNED_VALUE, label: t("unassigned") },
      ...assigneeUsers.map((u) => ({
        value: u.id,
        label: u.full_name?.trim() || u.email?.trim() || u.id,
      })),
    ],
    [assigneeUsers, t],
  );

  const dirty =
    data != null &&
    (titleDraft !== data.title ||
      (descDraft || "") !== (data.description ?? ""));

  const onSaveDetails = () => {
    if (!data || !dirty) return;
    const patch: { title?: string; description?: string | null } = {};
    if (titleDraft !== data.title) patch.title = titleDraft;
    if ((descDraft || "") !== (data.description ?? "")) {
      patch.description = descDraft.length ? descDraft : null;
    }
    updateMutation.mutate(patch, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const onCancelEdit = () => {
    if (data) {
      setTitleDraft(data.title);
      setDescDraft(data.description ?? "");
    }
    setIsEditing(false);
  };

  const onConfirmClose = () => {
    closeConfirm();
    closeIssue.mutate(issueId, {
      onSuccess: () => {
        const projectKey = data?.projects?.key;
        if (projectKey) {
          router.push(projectIssuesPath(projectKey));
        } else {
          router.push("/issues");
        }
      },
    });
  };

  return (
    <Stack gap="md">
      {isPending ? (
        <Text c="dimmed">{t("loading")}</Text>
      ) : isError ? (
        <Text c="red">
          {t(
            isIssuesQueryError(error) ? error.errorKey : "errors.readFailed",
          )}
        </Text>
      ) : (
        <>
          <Group gap={6} align="center">
            <Tooltip
              label={isIssueBug(data.issue_type) ? tDetail("typeBug") : tDetail("typeTask")}
              position="top"
              withArrow
            >
              {isIssueBug(data.issue_type) ? (
                <IconBug size={16} color="var(--mantine-color-red-6)" />
              ) : (
                <IconClipboardList size={16} color="var(--mantine-color-blue-6)" />
              )}
            </Tooltip>
            <Text size="sm" c="dimmed" ff="monospace">
              {data.issue_key}
            </Text>
          </Group>

          {canEditDetails ? (
            isEditing ? (
              <Stack gap="sm">
                <TextInput
                  label={tDetail("titleLabel")}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.currentTarget.value)}
                  aria-label={tDetail("titleLabel")}
                />
                <Textarea
                  label={tDetail("descriptionLabel")}
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.currentTarget.value)}
                  minRows={4}
                  autosize
                  maxRows={16}
                  aria-label={tDetail("descriptionLabel")}
                />
                <Group>
                  <Button
                    onClick={onSaveDetails}
                    disabled={!dirty || updateMutation.isPending}
                    loading={updateMutation.isPending}
                  >
                    {tDetail("save")}
                  </Button>
                  <Button variant="subtle" onClick={onCancelEdit}>
                    {tDetail("cancelEdit")}
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Title order={3} style={{ flex: 1 }}>{data.title}</Title>
                  <Tooltip label={tDetail("editTooltip")} position="left">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => setIsEditing(true)}
                      aria-label={tDetail("editTooltip")}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                {data.description ? (
                  <Text style={{ whiteSpace: "pre-wrap" }} c="dimmed">
                    {data.description}
                  </Text>
                ) : (
                  <Text size="sm" c="dimmed" fs="italic">
                    {tDetail("noDescription")}
                  </Text>
                )}
              </Stack>
            )
          ) : (
            <>
              <Title order={3}>{data.title}</Title>
              {data.description ? (
                <Text style={{ whiteSpace: "pre-wrap" }}>{data.description}</Text>
              ) : null}
            </>
          )}

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {canTransitionStatus ? (
              statusesError ? (
                <Text c="dimmed" size="sm">
                  {data.issue_statuses?.name ?? "—"}
                </Text>
              ) : statusesPending ? (
                <Loader size="sm" type="dots" />
              ) : (
                <Select
                  label={tDetail("statusLabel")}
                  placeholder={tDetail("statusPlaceholder")}
                  data={statusSelectData}
                  value={data.status_id}
                  onChange={(value) => {
                    if (!value || value === data.status_id) return;
                    transition.mutate(value);
                  }}
                  disabled={transition.isPending}
                  aria-label={tDetail("statusLabel")}
                />
              )
            ) : (
              <Stack gap={4}>
                <Text size="sm" fw={600}>
                  {tDetail("statusLabel")}
                </Text>
                <Text c="dimmed" size="sm">
                  {data.issue_statuses?.name ?? "—"}
                </Text>
                <Text size="xs" c="dimmed">
                  {tDetail("statusReadOnlyHint")}
                </Text>
              </Stack>
            )}

            {canAssignIssue ? (
              assigneesError ? (
                <Stack gap={4}>
                  <Text size="sm" fw={600}>
                    {tDetail("assigneeLabel")}
                  </Text>
                  <Text c="dimmed" size="sm">
                    {data.assignee?.full_name?.trim() ||
                      data.assignee?.email?.trim() ||
                      t("unassigned")}
                  </Text>
                </Stack>
              ) : assigneesPending ? (
                <Loader size="sm" type="dots" />
              ) : (
                <Select
                  label={tDetail("assigneeLabel")}
                  placeholder={tDetail("assignPlaceholder")}
                  data={assigneeSelectData}
                  value={data.assignee_id ?? UNASSIGNED_VALUE}
                  onChange={(value) => {
                    const next =
                      value === UNASSIGNED_VALUE || !value ? null : value;
                    if (next === data.assignee_id) return;
                    assignMutation.mutate({ issueId, assigneeId: next });
                  }}
                  disabled={assignMutation.isPending}
                  comboboxProps={{ withinPortal: true }}
                  aria-label={tDetail("assigneeLabel")}
                />
              )
            ) : (
              <Stack gap={4}>
                <Text size="sm" fw={600}>
                  {tDetail("assigneeLabel")}
                </Text>
                <Text c="dimmed" size="sm">
                  {data.assignee?.full_name?.trim() ||
                    data.assignee?.email?.trim() ||
                    t("unassigned")}
                </Text>
                <Text size="xs" c="dimmed">
                  {tDetail("assignReadOnlyHint")}
                </Text>
              </Stack>
            )}
          </SimpleGrid>

          {canEditDetails ? (
            <Stack gap={4}>
              <Text size="sm" fw={600}>
                {tDetail("issueTypeLabel")}
              </Text>
              <SegmentedControl
                data={[
                  {
                    value: "ticket",
                    label: (
                      <Group gap={6} justify="center" align="center" wrap="nowrap">
                        <IconClipboardList size={14} color="var(--mantine-color-blue-6)" />
                        {tDetail("typeTask")}
                      </Group>
                    ),
                  },
                  {
                    value: "bug",
                    label: (
                      <Group gap={6} justify="center" align="center" wrap="nowrap">
                        <IconBug size={14} color="var(--mantine-color-red-6)" />
                        {tDetail("typeBug")}
                      </Group>
                    ),
                  },
                ]}
                value={data.issue_type}
                onChange={(value) => {
                  if (!value || value === data.issue_type) return;
                  updateMutation.mutate({
                    issue_type: value as "bug" | "ticket",
                  });
                }}
                disabled={updateMutation.isPending}
              />
            </Stack>
          ) : (
            <Stack gap={4}>
              <Text size="sm" fw={600}>
                {tDetail("issueTypeLabel")}
              </Text>
              <Group gap={6} align="center">
                {isIssueBug(data.issue_type) ? (
                  <IconBug size={14} color="var(--mantine-color-red-6)" />
                ) : (
                  <IconClipboardList size={14} color="var(--mantine-color-blue-6)" />
                )}
                <Text c="dimmed" size="sm">
                  {isIssueBug(data.issue_type)
                    ? tDetail("typeBug")
                    : tDetail("typeTask")}
                </Text>
              </Group>
            </Stack>
          )}

          {canViewIssueAudit ? (
            <IssueAuditActivitySection locale={locale} issueId={issueId} />
          ) : null}

          {isAdmin ? (
            <>
              <Divider />
              <Group justify="flex-end">
                <Button
                  variant="subtle"
                  color="red"
                  onClick={openConfirm}
                  loading={closeIssue.isPending}
                >
                  {tDetail("closeIssue")}
                </Button>
              </Group>
            </>
          ) : null}
        </>
      )}

      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title={tDetail("closeIssueConfirmTitle")}
        centered
      >
        <Stack gap="md">
          <Text size="sm">{tDetail("closeIssueConfirmBody")}</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeConfirm}>
              {t("create.cancel")}
            </Button>
            <Button
              color="red"
              onClick={onConfirmClose}
              loading={closeIssue.isPending}
            >
              {tDetail("closeIssueConfirmButton")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default IssueDetailPanel;
