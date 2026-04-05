/** Thrown into TanStack Query when a issues server action returns `{ ok: false }`. */
export class IssuesQueryError extends Error {
  readonly errorKey: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(errorKey: string, fieldErrors?: Record<string, string[]>) {
    super(errorKey);
    this.name = "IssuesQueryError";
    this.errorKey = errorKey;
    this.fieldErrors = fieldErrors;
  }
}

export const isIssuesQueryError = (e: unknown): e is IssuesQueryError =>
  e instanceof IssuesQueryError;
