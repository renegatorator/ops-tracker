"use client";

import {
  Box,
  Button,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconBug, IconClipboardList } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { useAssigneeFilterOptions } from "@/features/issues/hooks/useAssigneeFilterOptions";
import { useCreateIssue } from "@/features/issues/hooks/useCreateIssue";
import { useIssueStatuses } from "@/features/issues/hooks/useIssueStatuses";
import { isIssueTask } from "@/features/issues/issueTypeUtils";

const UNASSIGNED_VALUE = "__unassigned__";

interface CreateIssueModalProps {
  locale: string;
  projectId: string;
  opened: boolean;
  onClose: () => void;
}

const CreateIssueModal = ({
  locale,
  projectId,
  opened,
  onClose,
}: CreateIssueModalProps) => {
  const t = useTranslations();
  const { data: statuses = [], isSuccess } = useIssueStatuses(locale);
  const { data: assigneeUsers = [], isPending: assigneesPending } =
    useAssigneeFilterOptions(locale, true, projectId);
  const createMutation = useCreateIssue(locale);
  const pending = createMutation.isPending;

  const form = useForm({
    initialValues: {
      title: "",
      description: "",
      status_id: "",
      issue_type: "ticket" as "bug" | "ticket",
      assignee_id: UNASSIGNED_VALUE,
    },
    validate: {
      title: (v) => (!v.trim() ? t("issues.create.titleRequired") : null),
      status_id: (v) => (!v ? t("issues.create.statusRequired") : null),
      description: (v, values) => {
        if (isIssueTask(values.issue_type) && !v.trim()) {
          return t("issues.create.descriptionRequired");
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

  const handleClose = () => {
    if (pending) return;
    onClose();
  };

  const onSubmit = form.onSubmit((values) => {
    const assigneeId =
      values.assignee_id && values.assignee_id !== UNASSIGNED_VALUE
        ? values.assignee_id
        : null;

    createMutation.mutate(
      {
        project_id: projectId,
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        status_id: values.status_id,
        issue_type: values.issue_type,
        assignee_id: assigneeId,
      },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      },
    );
  });

  const statusData = statuses.map((s) => ({ value: s.id, label: s.name }));

  const assigneeData = useMemo(
    () => [
      { value: UNASSIGNED_VALUE, label: t("issues.create.assigneeUnassigned") },
      ...assigneeUsers.map((u) => ({
        value: u.id,
        label: u.full_name?.trim() || u.email?.trim() || u.id,
      })),
    ],
    [assigneeUsers, t],
  );

  const isTask = isIssueTask(form.values.issue_type);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("issues.create.modalTitle")}
      size="lg"
      closeOnClickOutside={!pending}
      closeOnEscape={!pending}
      withCloseButton={!pending}
    >
      <Box pos="relative">
        <LoadingOverlay
          visible={pending}
          zIndex={1}
          overlayProps={{ blur: 1 }}
          loaderProps={{ "aria-label": t("issues.loading") }}
        />
        <form onSubmit={onSubmit}>
          <Stack gap="md">
            <SegmentedControl
              data={[
                {
                  value: "ticket",
                  label: (
                    <Group gap={6} justify="center" align="center" wrap="nowrap">
                      <IconClipboardList
                        size={14}
                        color="var(--mantine-color-blue-6)"
                      />
                      {t("issues.create.typeTask")}
                    </Group>
                  ),
                },
                {
                  value: "bug",
                  label: (
                    <Group gap={6} justify="center" align="center" wrap="nowrap">
                      <IconBug size={14} color="var(--mantine-color-red-6)" />
                      {t("issues.create.typeBug")}
                    </Group>
                  ),
                },
              ]}
              {...form.getInputProps("issue_type")}
              disabled={pending}
              fullWidth
            />

            <TextInput
              label={t("issues.create.titleLabel")}
              {...form.getInputProps("title")}
              disabled={pending}
              data-autofocus
            />

            <Textarea
              label={
                isTask
                  ? t("issues.create.descriptionLabel")
                  : t("issues.create.descriptionLabelOptional")
              }
              minRows={6}
              autosize
              maxRows={16}
              {...form.getInputProps("description")}
              disabled={pending}
            />

            <Select
              label={t("issues.create.statusLabel")}
              data={statusData}
              {...form.getInputProps("status_id")}
              disabled={pending}
              comboboxProps={{ withinPortal: true }}
            />

            {assigneesPending ? (
              <Loader size="sm" type="dots" />
            ) : (
              <Select
                label={t("issues.create.assigneeLabel")}
                data={assigneeData}
                {...form.getInputProps("assignee_id")}
                disabled={pending}
                comboboxProps={{ withinPortal: true }}
              />
            )}

            <Group justify="flex-end">
              <Button variant="subtle" onClick={handleClose} disabled={pending}>
                {t("issues.create.cancel")}
              </Button>
              <Button type="submit" loading={pending} disabled={pending}>
                {t("issues.create.submit")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
};

export default CreateIssueModal;
