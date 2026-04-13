import { Container } from "@mantine/core";
import type { ReactNode } from "react";

import ProjectSubnav from "@/features/projects/components/ProjectSubnav";

interface ProjectKeyLayoutProps {
  children: ReactNode;
  params: Promise<unknown>;
}

const ProjectKeyLayout = async ({ children, params }: ProjectKeyLayoutProps) => {
  const { projectKey } = (await params) as {
    locale: string;
    projectKey: string;
  };
  const key = decodeURIComponent(projectKey);

  return (
    <>
      <Container size="xl" pt="md" px="md">
        <ProjectSubnav projectKey={key} />
      </Container>
      {children}
    </>
  );
};

export default ProjectKeyLayout;
