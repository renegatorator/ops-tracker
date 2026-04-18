"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import CreateIssueModal from "@/features/issues/components/CreateIssueModal";

interface ProjectIssuesHeaderActionsProps {
  locale: string;
  projectId: string;
}

export const ProjectIssuesHeaderActions = ({
  locale,
  projectId,
}: ProjectIssuesHeaderActionsProps) => {
  const t = useTranslations();
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button onClick={() => setOpened(true)} size="sm" leftSection={<IconPlus size={16} />}>
        {t("projects.issues.newIssue")}
      </Button>
      <CreateIssueModal
        locale={locale}
        projectId={projectId}
        opened={opened}
        onClose={() => setOpened(false)}
      />
    </>
  );
};
