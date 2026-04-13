import type { IssueType } from "./types";

/**
 * The canonical values for issue_type as stored in the database.
 * "ticket" is the internal enum value for what the UI calls a "Task".
 */
export const ISSUE_TYPE = {
  BUG: "bug",
  TASK: "ticket",
} as const;

export const isIssueBug = (issueType: IssueType): boolean =>
  issueType === ISSUE_TYPE.BUG;

export const isIssueTask = (issueType: IssueType): boolean =>
  issueType === ISSUE_TYPE.TASK;
