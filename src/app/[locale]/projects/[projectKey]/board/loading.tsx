import { Container } from "@mantine/core";

import ProjectBoardSkeleton from "@/components/skeletons/ProjectBoardSkeleton";

const ProjectBoardLoading = () => (
  <Container size="xl" py="md">
    <ProjectBoardSkeleton />
  </Container>
);

export default ProjectBoardLoading;
