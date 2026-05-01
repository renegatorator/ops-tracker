import { Box, Button, Group, Paper, Stack, Text } from "@mantine/core";
import {
  IconBug,
  IconClipboardList,
  IconDotsVertical,
  IconLayoutKanban,
  IconPlus,
  IconSettings,
  IconTable,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

import classes from "./LandingPage.module.scss";

export type LandingHeroPreviewCopy = {
  kanbanTitle: string;
  newIssueButton: string;
  columnOpen: string;
  columnProgress: string;
  columnDone: string;
  issueTitleA: string;
  issueTitleB: string;
  issueTitleC: string;
  issueTitleD: string;
};

type LandingHeroProductPreviewProps = {
  copy: LandingHeroPreviewCopy;
};

type IssueType = "bug" | "task";

type PreviewIssue = {
  key: string;
  title: string;
  type: IssueType;
  assignee: string;
};

const ProjectIcon = () => (
  <Box className={classes.previewBrandIcon}>
    <IconLayoutKanban size={14} stroke={2} />
  </Box>
);

const IssueTypeIcon = ({ type }: { type: IssueType }) =>
  type === "bug" ? (
    <IconBug size={13} color="var(--mantine-color-red-6)" />
  ) : (
    <IconClipboardList size={13} color="var(--mantine-color-blue-6)" />
  );

const PreviewCard = ({ issue }: { issue: PreviewIssue }) => (
  <Paper
    p={8}
    radius="sm"
    withBorder
    className={classes.previewKanbanCard}
  >
    <Group gap={4} justify="space-between" wrap="nowrap" align="center">
      <Group gap={4} wrap="nowrap" align="center" style={{ minWidth: 0 }}>
        <IssueTypeIcon type={issue.type} />
        <Text size="xs" ff="monospace" c="dimmed" fw={500}>
          {issue.key}
        </Text>
      </Group>
      <IconDotsVertical
        size={12}
        color="var(--mantine-color-dimmed)"
        aria-hidden
      />
    </Group>
    <Text size="xs" fw={600} mt={4} lineClamp={2}>
      {issue.title}
    </Text>
    <Text size="10px" c="dimmed" mt={2} lineClamp={1}>
      {issue.assignee}
    </Text>
  </Paper>
);

const PreviewColumn = ({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) => (
  <Box className={classes.previewColumn}>
    <Box className={classes.previewColumnInner}>
      <Group gap={6} mb={8} wrap="nowrap" align="center">
        <Text size="xs" fw={700}>
          {title}
        </Text>
        <Text size="10px" c="dimmed" fw={600}>
          {count}
        </Text>
      </Group>
      <Stack gap={6}>{children}</Stack>
    </Box>
  </Box>
);

const LandingHeroProductPreview = ({
  copy,
}: LandingHeroProductPreviewProps) => {
  const openIssues: PreviewIssue[] = [
    {
      key: "OPS-184",
      title: copy.issueTitleA,
      type: "bug",
      assignee: "alex@ops.com",
    },
    {
      key: "OPS-176",
      title: copy.issueTitleB,
      type: "task",
      assignee: "jordan@ops.com",
    },
  ];
  const inProgressIssues: PreviewIssue[] = [
    {
      key: "OPS-162",
      title: copy.issueTitleC,
      type: "task",
      assignee: "sam@ops.com",
    },
  ];
  const doneIssues: PreviewIssue[] = [
    {
      key: "OPS-148",
      title: copy.issueTitleD,
      type: "task",
      assignee: "alex@ops.com",
    },
  ];

  return (
    <Box className={classes.previewRoot}>
      <Box className={classes.previewGlow} aria-hidden />
      <Paper
        shadow="xl"
        radius="lg"
        p={0}
        withBorder
        className={classes.previewPaper}
      >
        <Box className={classes.previewTopBar}>
          <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
            <ProjectIcon />
            <Text size="sm" fw={700} truncate>
              {copy.kanbanTitle}
            </Text>
          </Group>
          <Button
            size="compact-xs"
            radius="sm"
            leftSection={<IconPlus size={12} />}
            className={classes.previewNewIssueBtn}
          >
            {copy.newIssueButton}
          </Button>
        </Box>

        <Box className={classes.previewToolbar}>
          <Group gap={4} wrap="nowrap" align="center">
            <Box className={classes.previewToolbarBtnActive}>
              <IconLayoutKanban size={13} />
            </Box>
            <Box className={classes.previewToolbarBtn}>
              <IconTable size={13} />
            </Box>
          </Group>
          <Box className={classes.previewToolbarBtn}>
            <IconSettings size={13} color="var(--mantine-color-dimmed)" />
          </Box>
        </Box>

        <Box className={classes.previewBoard}>
          <PreviewColumn title={copy.columnOpen} count={openIssues.length}>
            {openIssues.map((issue) => (
              <PreviewCard key={issue.key} issue={issue} />
            ))}
          </PreviewColumn>
          <PreviewColumn
            title={copy.columnProgress}
            count={inProgressIssues.length}
          >
            {inProgressIssues.map((issue) => (
              <PreviewCard key={issue.key} issue={issue} />
            ))}
          </PreviewColumn>
          <PreviewColumn title={copy.columnDone} count={doneIssues.length}>
            {doneIssues.map((issue) => (
              <PreviewCard key={issue.key} issue={issue} />
            ))}
          </PreviewColumn>
        </Box>
      </Paper>
    </Box>
  );
};

export default LandingHeroProductPreview;
