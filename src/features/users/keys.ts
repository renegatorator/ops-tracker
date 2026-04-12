/** React Query root for admin users list (not an `AppRole`). */
const ADMIN_USERS_QUERY_ROOT = "admin" as const;

export const userAdminQueryKeys = {
  list: (locale: string) => [ADMIN_USERS_QUERY_ROOT, "users", locale] as const,
};
