export type Issue = {
  id: string;
  title: string;
  description: string | null;
  status_id: string;
  reporter_id: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type IssueStatusRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_terminal: boolean;
  created_at: string;
};

/** Row shape from `issues` list/detail select with embedded status. */
export type IssueWithStatus = Issue & {
  issue_statuses: IssueStatusRow | null;
};

export type IssueListFilters = {
  statusId?: string;
  assigneeId?: string;
  /** Plain-text fragment; `%` / `_` stripped to avoid LIKE metacharacters. */
  search?: string;
};

export type ListIssuesOffsetPagination = {
  mode: "offset";
  offset: number;
  limit: number;
};

export type ListIssuesCursorPagination = {
  mode: "cursor";
  cursor: string;
  limit: number;
};

export type ListIssuesPagination =
  | ListIssuesOffsetPagination
  | ListIssuesCursorPagination;

export type ListIssuesInput = IssueListFilters & ListIssuesPagination;

export type ListIssuesSuccess = {
  items: IssueWithStatus[];
  pagination:
    | {
        mode: "offset";
        limit: number;
        offset: number;
        hasMore: boolean;
        nextOffset: number | null;
      }
    | {
        mode: "cursor";
        limit: number;
        nextCursor: string | null;
      };
};

export type IssuesActionFailure = {
  ok: false;
  errorKey: string;
  fieldErrors?: Record<string, string[]>;
};

export type IssuesActionSuccess<T> = { ok: true; data: T };

export type IssuesActionResult<T> = IssuesActionFailure | IssuesActionSuccess<T>;
