"use client";

import { Group, Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core";

interface TableSkeletonProps {
  columnWidths: (number | string)[];
  rows?: number;
  withFilters?: boolean;
  ariaLabel?: string;
}

const TableSkeleton = ({
  columnWidths,
  rows = 6,
  withFilters = false,
  ariaLabel,
}: TableSkeletonProps) => (
  <Paper
    withBorder
    p="md"
    radius="md"
    w="100%"
    aria-busy="true"
    aria-live="polite"
    aria-label={ariaLabel}
  >
    <Stack gap="md">
      {withFilters ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
          <Skeleton height={36} radius="sm" />
          <Skeleton height={36} radius="sm" />
          <Skeleton height={36} radius="sm" />
        </SimpleGrid>
      ) : null}

      <Group gap="md" wrap="nowrap">
        {columnWidths.map((w, i) => (
          <Skeleton key={`h-${i}`} height={20} radius="sm" width={w} />
        ))}
      </Group>

      <Stack gap="xs">
        {Array.from({ length: rows }).map((_, i) => (
          <Group key={`r-${i}`} gap="md" wrap="nowrap">
            {columnWidths.map((w, j) => (
              <Skeleton key={`c-${i}-${j}`} height={32} radius="sm" width={w} />
            ))}
          </Group>
        ))}
      </Stack>
    </Stack>
  </Paper>
);

export default TableSkeleton;
