import { Container } from "@mantine/core";

import IssuesTableSkeleton from "@/components/skeletons/IssuesTableSkeleton";

const IssuesLoading = () => (
  <Container size="xl" px={{ base: "xs", sm: "md" }} py="xl">
    <IssuesTableSkeleton />
  </Container>
);

export default IssuesLoading;
