import type { ListIssuesSchemaInput } from "./schemas";

export type IssuesListOffsetParams = Extract<
  ListIssuesSchemaInput,
  { mode: "offset" }
>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SORT_FIELDS = ["created_at", "title", "updated_at", "status"] as const;
export type IssuesListSortField = (typeof SORT_FIELDS)[number];

const isUuid = (v: string): boolean => UUID_RE.test(v);

const parseSort = (
  raw: string | null,
): { sortBy: IssuesListSortField; sortDir: "asc" | "desc" } => {
  const fallback = { sortBy: "created_at" as const, sortDir: "desc" as const };
  if (!raw?.trim()) return fallback;
  const [field, dir] = raw.split(".");
  if (!SORT_FIELDS.includes(field as IssuesListSortField)) return fallback;
  if (dir !== "asc" && dir !== "desc") return fallback;
  return {
    sortBy: field as IssuesListSortField,
    sortDir: dir,
  };
};

export const parseIssuesListParams = (
  searchParams: URLSearchParams,
): IssuesListOffsetParams => {
  const pageRaw = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 0 ? pageRaw : 0;

  const perRaw = Number.parseInt(searchParams.get("perPage") ?? "20", 10);
  const limit = [20, 50, 100].includes(perRaw) ? perRaw : 20;
  const offset = page * limit;

  const statusRaw = searchParams.get("status")?.trim();
  const statusId =
    statusRaw && isUuid(statusRaw) ? statusRaw : undefined;

  const assigneeRaw = searchParams.get("assignee")?.trim();
  const assigneeId =
    assigneeRaw && isUuid(assigneeRaw) ? assigneeRaw : undefined;

  const projectRaw = searchParams.get("project")?.trim();
  const projectId =
    projectRaw && isUuid(projectRaw) ? projectRaw : undefined;

  const search = searchParams.get("q")?.trim() || undefined;

  const includeClosed = searchParams.get("closed") === "1";

  const { sortBy, sortDir } = parseSort(searchParams.get("sort"));

  return {
    mode: "offset",
    offset,
    limit,
    projectId,
    statusId,
    assigneeId,
    search,
    sortBy,
    sortDir,
    includeClosed,
  };
};

export const issuesListParamsToSearchParams = (
  params: ListIssuesSchemaInput,
): URLSearchParams => {
  if (params.mode !== "offset") {
    throw new Error("Only offset mode is supported for URL sync");
  }
  const sp = new URLSearchParams();
  const page = Math.floor(params.offset / params.limit);
  if (page > 0) sp.set("page", String(page));
  if (params.limit !== 20) sp.set("perPage", String(params.limit));
  if (params.projectId) sp.set("project", params.projectId);
  if (params.statusId) sp.set("status", params.statusId);
  if (params.assigneeId) sp.set("assignee", params.assigneeId);
  if (params.search?.trim()) sp.set("q", params.search.trim());
  if (params.includeClosed) sp.set("closed", "1");
  const sortBy = params.sortBy ?? "created_at";
  const sortDir = params.sortDir ?? "desc";
  if (sortBy !== "created_at" || sortDir !== "desc") {
    sp.set("sort", `${sortBy}.${sortDir}`);
  }
  return sp;
};

export const patchIssuesListParams = (
  base: IssuesListOffsetParams,
  patch: Partial<{
    projectId: string | undefined;
    statusId: string | undefined;
    assigneeId: string | undefined;
    search: string | undefined;
    limit: number;
    offset: number;
    sortBy: IssuesListSortField;
    sortDir: "asc" | "desc";
    includeClosed: boolean;
  }> & { resetPage?: boolean },
): IssuesListOffsetParams => {
  const { resetPage, ...rest } = patch;
  const next: IssuesListOffsetParams = {
    ...base,
    ...rest,
    mode: "offset",
  };
  if (resetPage) {
    next.offset = 0;
  }
  return next;
};
