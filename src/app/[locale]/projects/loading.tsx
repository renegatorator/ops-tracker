import { Container, Paper, Skeleton, Stack } from "@mantine/core";

const ProjectsLoading = () => (
  <Container size="lg" py="xl">
    <Paper withBorder p={{ base: "sm", sm: "lg" }} radius="md" w="100%">
      <Stack gap="md" aria-busy="true" aria-live="polite">
        <Skeleton height={32} width="30%" />
        <Skeleton height={200} radius="sm" />
      </Stack>
    </Paper>
  </Container>
);

export default ProjectsLoading;
