"use client";

import { Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useState } from "react";

import CreateIssueModal from "@/features/issues/components/CreateIssueModal";

interface ProjectIssuesHeaderActionsProps {
  locale: string;
  projectId: string;
  projectKey: string;
}

export const ProjectIssuesHeaderActions = ({
  locale,
  projectId,
  projectKey,
}: ProjectIssuesHeaderActionsProps) => {
  const t = useTranslations("projects.issues");
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button onClick={() => setOpened(true)} size="sm">
        {t("newIssue")}
      </Button>
      <CreateIssueModal
        locale={locale}
        projectId={projectId}
        projectKey={projectKey}
        opened={opened}
        onClose={() => setOpened(false)}
      />
    </>
  );
};
