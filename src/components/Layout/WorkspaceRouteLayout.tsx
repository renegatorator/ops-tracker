import type { ReactNode } from "react";

import LanguageSwitcher from "@/components/Language/LanguageSwitcher";
import LogoutSection from "@/components/Layout/LogoutSection";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import { getUserAuthContext } from "@/lib/auth/session";
import { isAdminAccessRole } from "@/lib/auth/types";

import WorkspaceShellClient from "./WorkspaceShellClient";

interface WorkspaceRouteLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const WorkspaceRouteLayout = async ({
  children,
  params,
}: WorkspaceRouteLayoutProps) => {
  const { locale } = await params;
  const ctx = await getUserAuthContext();
  if (!ctx) {
    return <>{children}</>;
  }

  return (
    <WorkspaceShellClient
      locale={locale}
      isStaff={isAdminAccessRole(ctx.role)}
      headerRight={
        <>
          <LogoutSection />
          <LanguageSwitcher />
          <ThemeToggle />
        </>
      }
    >
      {children}
    </WorkspaceShellClient>
  );
};

export default WorkspaceRouteLayout;
