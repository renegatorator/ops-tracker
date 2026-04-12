"use client";

import { Paper, Skeleton, Stack } from "@mantine/core";

const DashboardSkeleton = () => (
  <Paper withBorder p="lg" radius="md" aria-busy="true" aria-live="polite">
    <Stack gap="sm">
      <Skeleton height={28} width="55%" radius="sm" />
      <Skeleton height={16} width="100%" radius="sm" />
      <Skeleton height={16} width="80%" radius="sm" />
    </Stack>
  </Paper>
);

export default DashboardSkeleton;
