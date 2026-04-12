import type { ReactNode } from "react";

import WorkspaceRouteLayout from "@/components/Layout/WorkspaceRouteLayout";

interface IssuesLayoutProps {
  children: ReactNode;
  params: Promise<unknown>;
}

const IssuesLayout = ({ children, params }: IssuesLayoutProps) => (
  <WorkspaceRouteLayout
    params={params as Promise<{ locale: string }>}
  >
    {children}
  </WorkspaceRouteLayout>
);

export default IssuesLayout;
