"use client";

import { Group, Paper, Skeleton, Stack } from "@mantine/core";

const ProjectBoardSkeleton = () => (
  <Paper withBorder p="md" radius="md" aria-busy="true" aria-live="polite">
    <Stack gap="md">
      <Skeleton height={24} width="35%" radius="sm" />
      <Group align="flex-start" gap="md" wrap="wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <Stack key={i} gap="xs" style={{ flex: "1 1 220px", minWidth: 200 }}>
            <Skeleton height={20} width="50%" />
            <Skeleton height={56} radius="sm" />
            <Skeleton height={56} radius="sm" />
            <Skeleton height={56} radius="sm" />
          </Stack>
        ))}
      </Group>
    </Stack>
  </Paper>
);

export default ProjectBoardSkeleton;
