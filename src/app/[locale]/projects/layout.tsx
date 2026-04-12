import type { ReactNode } from "react";

import WorkspaceRouteLayout from "@/components/Layout/WorkspaceRouteLayout";

interface ProjectsLayoutProps {
  children: ReactNode;
  params: Promise<unknown>;
}

const ProjectsLayout = ({ children, params }: ProjectsLayoutProps) => (
  <WorkspaceRouteLayout
    params={params as Promise<{ locale: string }>}
  >
    {children}
  </WorkspaceRouteLayout>
);

export default ProjectsLayout;
