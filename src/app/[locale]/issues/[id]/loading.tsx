import { Container } from "@mantine/core";

import IssueDetailSkeleton from "@/components/skeletons/IssueDetailSkeleton";

const IssueDetailLoading = () => (
  <Container size="md" py="xl">
    <IssueDetailSkeleton />
  </Container>
);

export default IssueDetailLoading;
