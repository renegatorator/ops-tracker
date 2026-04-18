/**
 * The canonical values for issue_type as stored in the database.
 * "ticket" is the internal enum value for what the UI calls a "Task".
 */
export const IssueTypes = {
  BUG: "bug",
  TASK: "ticket",
} as const;

export type IssueType = (typeof IssueTypes)[keyof typeof IssueTypes];

export const IssueTypeValues = [IssueTypes.BUG, IssueTypes.TASK] as const;

export const isIssueBug = (issueType: IssueType): boolean =>
  issueType === IssueTypes.BUG;

export const isIssueTask = (issueType: IssueType): boolean =>
  issueType === IssueTypes.TASK;
