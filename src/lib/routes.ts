/**
 * Pathnames without locale prefix (`localePrefix: "as-needed"`).
 * Use with next-intl `Link` / `redirect`, `localizedPath`, `revalidatePath`, and Playwright `page.goto`.
 */
export const routes = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  issues: "/issues",
  admin: "/admin",
  adminUsers: "/admin/users",
  adminStatuses: "/admin/statuses",
  adminSettings: "/admin/settings",
  adminAudit: "/admin/audit",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export const issueDetailPath = (issueId: string): string =>
  `${routes.issues}/${issueId}`;
