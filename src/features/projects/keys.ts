export const projectQueryKeys = {
  all: ["projects"] as const,
  lists: () => [...projectQueryKeys.all, "list"] as const,
  list: (locale: string) => [...projectQueryKeys.lists(), locale] as const,
  detailByKey: (locale: string, key: string) =>
    [...projectQueryKeys.all, "detail", locale, key] as const,
  members: (locale: string, projectId: string) =>
    [...projectQueryKeys.all, "members", locale, projectId] as const,
  memberProfiles: (locale: string, projectId: string) =>
    [...projectQueryKeys.all, "memberProfiles", locale, projectId] as const,
};
