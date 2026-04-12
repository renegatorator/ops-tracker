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
      <ProjectSubnav projectKey={key} />
      {children}
    </>
  );
};

export default ProjectKeyLayout;
