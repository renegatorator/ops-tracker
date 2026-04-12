"use client";

import {
  Button,
  Group,
  Loader,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { createIssue } from "@/features/issues/actions";
import { useAssigneeFilterOptions } from "@/features/issues/hooks/useAssigneeFilterOptions";
import { useIssueStatuses } from "@/features/issues/hooks/useIssueStatuses";
import { useRouter } from "@/i18n/navigation";
import { projectIssueDetailPath } from "@/lib/routes";

const UNASSIGNED_VALUE = "__unassigned__";

interface CreateIssueModalProps {
  locale: string;
  projectId: string;
  projectKey: string;
  opened: boolean;
  onClose: () => void;
}

const CreateIssueModal = ({
  locale,
  projectId,
  projectKey,
  opened,
  onClose,
}: CreateIssueModalProps) => {
  const t = useTranslations("issues.create");
  const tErrors = useTranslations("issues");
  const router = useRouter();
  const { data: statuses = [], isSuccess } = useIssueStatuses(locale);
  const {
    data: assigneeUsers = [],
    isPending: assigneesPending,
  } = useAssigneeFilterOptions(locale, true, projectId);

  const form = useForm({
    initialValues: {
      title: "",
      description: "",
      status_id: "",
      issue_type: "ticket" as "bug" | "ticket",
      assignee_id: UNASSIGNED_VALUE,
    },
    validate: {
      title: (v) => (!v.trim() ? t("titleRequired") : null),
      status_id: (v) => (!v ? t("statusRequired") : null),
      description: (v, values) => {
        if (values.issue_type === "ticket" && !v.trim()) {
          return t("descriptionRequired");
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (isSuccess && statuses.length > 0 && !form.values.status_id) {
      form.setFieldValue("status_id", statuses[0].id);
    }
  }, [isSuccess, statuses, form]);

  const onSubmit = form.onSubmit(async (values) => {
    const assigneeId =
      values.assignee_id && values.assignee_id !== UNASSIGNED_VALUE
        ? values.assignee_id
        : null;

    const result = await createIssue(locale, {
      project_id: projectId,
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      status_id: values.status_id,
      issue_type: values.issue_type,
      assignee_id: assigneeId,
    });
    if (!result.ok) {
      notifications.show({
        title: t("failedTitle"),
        message: tErrors(result.errorKey as Parameters<typeof tErrors>[0]),
        color: "red",
      });
      return;
    }
    notifications.show({
      title: t("successTitle"),
      message: t("successMessage"),
      color: "green",
    });
    form.reset();
    onClose();
    router.push(
      projectIssueDetailPath(projectKey, result.data.issue_number),
    );
  });

  const statusData = statuses.map((s) => ({ value: s.id, label: s.name }));

  const assigneeData = useMemo(
    () => [
      { value: UNASSIGNED_VALUE, label: t("assigneeUnassigned") },
      ...assigneeUsers.map((u) => ({
        value: u.id,
        label: u.full_name?.trim() || u.email?.trim() || u.id,
      })),
    ],
    [assigneeUsers, t],
  );

  const isTicket = form.values.issue_type === "ticket";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("modalTitle")}
      size="lg"
    >
      <form onSubmit={onSubmit}>
        <Stack gap="md">
          <SegmentedControl
            data={[
              { value: "ticket", label: t("typeTicket") },
              { value: "bug", label: t("typeBug") },
            ]}
            {...form.getInputProps("issue_type")}
            fullWidth
          />

          <TextInput
            label={t("titleLabel")}
            {...form.getInputProps("title")}
            data-autofocus
          />

          <Textarea
            label={
              isTicket
                ? t("descriptionLabel")
                : t("descriptionLabelOptional")
            }
            minRows={6}
            autosize
            maxRows={16}
            {...form.getInputProps("description")}
          />

          <Select
            label={t("statusLabel")}
            data={statusData}
            {...form.getInputProps("status_id")}
            comboboxProps={{ withinPortal: true }}
          />

          {assigneesPending ? (
            <Loader size="sm" type="dots" />
          ) : (
            <Select
              label={t("assigneeLabel")}
              data={assigneeData}
              {...form.getInputProps("assignee_id")}
              comboboxProps={{ withinPortal: true }}
            />
          )}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("submit")}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateIssueModal;
