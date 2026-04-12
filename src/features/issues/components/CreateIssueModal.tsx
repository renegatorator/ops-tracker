"use client";

import { Button, Modal, Select, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { createIssue } from "@/features/issues/actions";
import { useIssueStatuses } from "@/features/issues/hooks/useIssueStatuses";
import { useRouter } from "@/i18n/navigation";
import { projectIssueDetailPath } from "@/lib/routes";

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
  const router = useRouter();
  const { data: statuses = [], isSuccess } = useIssueStatuses(locale);

  const form = useForm({
    initialValues: {
      title: "",
      description: "",
      status_id: "",
    },
    validate: {
      title: (v) => (!v.trim() ? t("titleRequired") : null),
      status_id: (v) => (!v ? t("statusRequired") : null),
    },
  });

  useEffect(() => {
    if (isSuccess && statuses.length > 0 && !form.values.status_id) {
      form.setFieldValue("status_id", statuses[0].id);
    }
  }, [isSuccess, statuses, form]);

  const onSubmit = form.onSubmit(async (values) => {
    const result = await createIssue(locale, {
      project_id: projectId,
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      status_id: values.status_id,
    });
    if (!result.ok) {
      notifications.show({
        title: t("failedTitle"),
        message: t(result.errorKey),
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

  return (
    <Modal opened={opened} onClose={onClose} title={t("modalTitle")} size="md">
      <form onSubmit={onSubmit}>
        <Stack gap="md">
          <TextInput
            label={t("titleLabel")}
            {...form.getInputProps("title")}
            data-autofocus
          />
          <Textarea
            label={t("descriptionLabel")}
            minRows={3}
            {...form.getInputProps("description")}
          />
          <Select
            label={t("statusLabel")}
            data={statusData}
            {...form.getInputProps("status_id")}
            comboboxProps={{ withinPortal: true }}
          />
          <Button type="submit">{t("submit")}</Button>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateIssueModal;
