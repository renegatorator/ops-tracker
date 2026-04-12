import { Container, Paper, Skeleton, Stack } from "@mantine/core";

const ProjectSettingsLoading = () => (
  <Container size="md" py="md">
    <Paper withBorder p="md" radius="md">
      <Stack gap="md" aria-busy="true" aria-live="polite">
        <Skeleton height={28} width="50%" />
        <Skeleton height={120} radius="sm" />
      </Stack>
    </Paper>
  </Container>
);

export default ProjectSettingsLoading;
