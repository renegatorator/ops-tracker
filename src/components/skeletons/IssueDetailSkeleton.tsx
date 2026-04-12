"use client";

import { Paper, Skeleton, Stack } from "@mantine/core";

const IssueDetailSkeleton = () => (
  <Paper withBorder p="lg" radius="md" aria-busy="true" aria-live="polite">
    <Stack gap="md">
      <Skeleton height={16} width={120} radius="sm" />
      <Skeleton height={28} width="60%" radius="sm" />
      <Skeleton height={80} radius="sm" />
      <Skeleton height={36} width="100%" radius="sm" />
      <Skeleton height={36} width="100%" radius="sm" />
    </Stack>
  </Paper>
);

export default IssueDetailSkeleton;
