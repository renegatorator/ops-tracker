import type { ReactNode } from "react";

import WorkspaceRouteLayout from "@/components/Layout/WorkspaceRouteLayout";

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<unknown>;
}

const DashboardLayout = ({ children, params }: DashboardLayoutProps) => (
  <WorkspaceRouteLayout
    params={params as Promise<{ locale: string }>}
  >
    {children}
  </WorkspaceRouteLayout>
);

export default DashboardLayout;
