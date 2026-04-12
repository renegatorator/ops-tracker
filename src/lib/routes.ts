/**
 * Pathnames without locale prefix (`localePrefix: "as-needed"`).
 * Use with next-intl `Link` / `redirect`, `localizedPath`, `revalidatePath`, and Playwright `page.goto`.
 */
export const routes = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  issues: "/issues",
  projects: "/projects",
  admin: "/admin",
  adminUsers: "/admin/users",
  adminStatuses: "/admin/statuses",
  adminSettings: "/admin/settings",
  adminAudit: "/admin/audit",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export const issueDetailPath = (issueId: string): string =>
  `${routes.issues}/${issueId}`;

export const projectBoardPath = (projectKey: string): string =>
  `${routes.projects}/${encodeURIComponent(projectKey)}/board`;

export const projectIssuesPath = (projectKey: string): string =>
  `${routes.projects}/${encodeURIComponent(projectKey)}/issues`;

export const projectSettingsPath = (projectKey: string): string =>
  `${routes.projects}/${encodeURIComponent(projectKey)}/settings`;

export const projectIssueDetailPath = (
  projectKey: string,
  issueNumber: number,
): string =>
  `${routes.projects}/${encodeURIComponent(projectKey)}/issues/${issueNumber}`;
