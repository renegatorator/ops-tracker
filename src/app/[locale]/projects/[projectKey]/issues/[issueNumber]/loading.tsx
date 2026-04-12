import { Container } from "@mantine/core";

import IssueDetailSkeleton from "@/components/skeletons/IssueDetailSkeleton";

const ProjectIssueDetailLoading = () => (
  <Container size="md" py="xl">
    <IssueDetailSkeleton />
  </Container>
);

export default ProjectIssueDetailLoading;
