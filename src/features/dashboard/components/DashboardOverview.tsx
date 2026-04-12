import {
  Alert,
  Badge,
  Box,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import IntlLinkAnchor from "@/components/Navigation/IntlLinkAnchor";
import { projectBoardPath, projectIssuesPath, routes } from "@/lib/routes";

import type { DashboardData } from "../getDashboardData";

interface Props {
  data: DashboardData;
  email: string;
  fullName?: string | null;
  locale: string;
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

const DashboardOverview = async ({ data, email, fullName, locale }: Props) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const {
    projects,
    totalIssues: _totalIssues,
    openIssues,
    myIssues,
    recentIssues,
    myAssignedIssues,
    hasError,
  } = data;

  return (
    <Stack gap="xl">
      {/* Header */}
      <Stack gap={4}>
        <Title order={2}>{t("title")}</Title>
        <Text c="dimmed" size="sm">
          {t("subtitle")}
        </Text>
        <Text size="sm" fw={500}>
          {t("welcome", { email: fullName?.trim() || email })}
        </Text>
      </Stack>

      {hasError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="orange"
          variant="light"
        >
          {t("error")}
        </Alert>
      )}

      {/* KPI strip */}
      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
        <Paper withBorder p="md" radius="md">
          <Stack gap={4}>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed">
              {t("stats.activeProjects")}
            </Text>
            <Title order={2}>{projects.length}</Title>
            <IntlLinkAnchor href={routes.projects} size="sm">
              {t("stats.viewProjects")}
            </IntlLinkAnchor>
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap={4}>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed">
              {t("stats.openIssues")}
            </Text>
            <Title order={2}>{openIssues}</Title>
            <IntlLinkAnchor href={routes.issues} size="sm">
              {t("stats.viewAllIssues")}
            </IntlLinkAnchor>
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap={4}>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed">
              {t("stats.assignedToMe")}
            </Text>
            <Title order={2}>{myIssues}</Title>
            <IntlLinkAnchor href={routes.issues} size="sm">
              {t("stats.viewMyIssues")}
            </IntlLinkAnchor>
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* Project shortcuts */}
      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Title order={4}>{t("projects.heading")}</Title>
          <Divider />
          {projects.length === 0 ? (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                {t("projects.empty")}
              </Text>
              <IntlLinkAnchor href={routes.projects} size="sm">
                {t("projects.createOne")}
              </IntlLinkAnchor>
            </Group>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
              {projects.map((p) => (
                <Paper key={p.id} withBorder p="sm" radius="sm">
                  <Stack gap={4}>
                    <Group gap="xs" align="center">
                      <Badge variant="light" size="sm" radius="sm">
                        {p.key}
                      </Badge>
                      <Text size="sm" fw={500} style={{ flex: 1 }} lineClamp={1}>
                        {p.name}
                      </Text>
                    </Group>
                    <Group gap="sm">
                      <IntlLinkAnchor
                        href={projectBoardPath(p.key)}
                        size="xs"
                        c="dimmed"
                      >
                        {t("projects.board")}
                      </IntlLinkAnchor>
                      <IntlLinkAnchor
                        href={projectIssuesPath(p.key)}
                        size="xs"
                        c="dimmed"
                      >
                        {t("projects.issues")}
                      </IntlLinkAnchor>
                    </Group>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Paper>

      {/* Two-column issue lists */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Title order={4}>{t("recent.heading")}</Title>
            <Divider />
            {recentIssues.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t("recent.empty")}
              </Text>
            ) : (
              <Stack gap={0}>
                {recentIssues.map((issue, idx) => (
                  <Box key={issue.id}>
                    {idx > 0 && <Divider my={0} />}
                    <IssueRow issue={issue} locale={locale} />
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Title order={4}>{t("mine.heading")}</Title>
            <Divider />
            {myAssignedIssues.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t("mine.empty")}
              </Text>
            ) : (
              <Stack gap={0}>
                {myAssignedIssues.map((issue, idx) => (
                  <Box key={issue.id}>
                    {idx > 0 && <Divider my={0} />}
                    <IssueRow issue={issue} locale={locale} />
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
};

// ---------- sub-component ----------

interface IssueRowProps {
  issue: {
    id: string;
    issue_key: string;
    title: string;
    updated_at: string;
    issue_statuses: { name: string } | null;
    projects: { key: string } | null;
    issue_number: number;
  };
  locale: string;
}

const IssueRow = ({ issue, locale }: IssueRowProps) => {
  const projectKey = issue.projects?.key;
  const href = projectKey
    ? `${projectIssuesPath(projectKey)}/${issue.issue_number}`
    : `${routes.issues}/${issue.id}`;

  return (
    <Group
      py="xs"
      gap="sm"
      wrap="nowrap"
      align="flex-start"
    >
      <Text size="xs" c="dimmed" ff="monospace" style={{ whiteSpace: "nowrap" }}>
        {issue.issue_key}
      </Text>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <IntlLinkAnchor href={href} size="sm" lineClamp={1} fw={500}>
          {issue.title}
        </IntlLinkAnchor>
        <Group gap={6} mt={2}>
          {issue.issue_statuses && (
            <Badge variant="outline" size="xs" radius="sm">
              {issue.issue_statuses.name}
            </Badge>
          )}
          <Text size="xs" c="dimmed">
            {formatDate(issue.updated_at, locale)}
          </Text>
        </Group>
      </Box>
    </Group>
  );
};

export default DashboardOverview;
