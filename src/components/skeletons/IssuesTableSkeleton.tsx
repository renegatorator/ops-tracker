"use client";

import { Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core";

const IssuesTableSkeleton = () => (
  <Paper withBorder p="md" radius="md" w="100%" aria-busy="true" aria-live="polite">
    <Stack gap="md">
      <Skeleton height={28} width="40%" radius="sm" />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
        <Skeleton height={36} radius="sm" />
        <Skeleton height={36} radius="sm" />
        <Skeleton height={36} radius="sm" />
      </SimpleGrid>
      <Stack gap="xs">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={40} radius="sm" />
        ))}
      </Stack>
    </Stack>
  </Paper>
);

export default IssuesTableSkeleton;
