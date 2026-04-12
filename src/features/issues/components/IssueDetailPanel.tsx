"use client";

import {
  ActionIcon,
  Anchor,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import IssueAuditActivitySection from "@/features/audit/components/IssueAuditActivitySection";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

import { useAssigneeFilterOptions } from "../hooks/useAssigneeFilterOptions";
import { useAssignIssue } from "../hooks/useAssignIssue";
import { useIssueDetail } from "../hooks/useIssueDetail";
import { useIssueStatuses } from "../hooks/useIssueStatuses";
import { useTransitionIssueStatus } from "../hooks/useTransitionIssueStatus";
import { useUpdateIssue } from "../hooks/useUpdateIssue";
import { isIssuesQueryError } from "../issues-query-error";

const UNASSIGNED_VALUE = "__unassigned__";

interface IssueDetailPanelProps {
  locale: string;
  issueId: string;
  canTransitionStatus: boolean;
  canAssignIssue: boolean;
  canEditDetails: boolean;
  canViewIssueAudit: boolean;
  backHref?: string;
}

const IssueDetailPanel = ({
  locale,
  issueId,
  canTransitionStatus,
  canAssignIssue,
  canEditDetails,
  canViewIssueAudit,
  backHref,
}: IssueDetailPanelProps) => {
  const t = useTranslations("issues");
  const tDetail = useTranslations("issues.detail");
  const listHref = backHref ?? routes.issues;
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
  } = useAssigneeFilterOptions(locale, canAssignIssue, data?.project_id);
  const transition = useTransitionIssueStatus(locale, issueId);
  const assignMutation = useAssignIssue(locale);
  const updateMutation = useUpdateIssue(locale, issueId);

  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");

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

  return (
    <Stack gap="md">
      <Anchor component={Link} href={listHref} size="sm">
        {t("backToList")}
      </Anchor>
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
          <Text size="sm" c="dimmed" ff="monospace">
            {data.issue_key}
          </Text>

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

          {canViewIssueAudit ? (
            <IssueAuditActivitySection locale={locale} issueId={issueId} />
          ) : null}
        </>
      )}
    </Stack>
  );
};

export default IssueDetailPanel;
