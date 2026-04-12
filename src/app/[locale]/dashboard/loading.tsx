import { Container } from "@mantine/core";

import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";

const DashboardLoading = () => (
  <Container size="sm" py="xl">
    <DashboardSkeleton />
  </Container>
);

export default DashboardLoading;
