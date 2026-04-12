import { Container } from "@mantine/core";

import IssuesTableSkeleton from "@/components/skeletons/IssuesTableSkeleton";

const ProjectIssuesLoading = () => (
  <Container size="xl" py="md">
    <IssuesTableSkeleton />
  </Container>
);

export default ProjectIssuesLoading;
