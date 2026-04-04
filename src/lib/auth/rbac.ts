import type { AppRole, UserAuthContext } from "./types";

/** Thrown when an authenticated user lacks a required role (Server Actions should map to a safe client response). */
export class ForbiddenError extends Error {
  readonly code = "forbidden" as const;

  constructor(message = "Insufficient permissions") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Enforces that `ctx.role` is one of `allowed`. Use at the start of admin / super_admin Server Actions
 * after `getUserAuthContext()` (or equivalent) so the action cannot run without a server-side role check.
 */
export const assertRole = (
  ctx: UserAuthContext,
  allowed: readonly AppRole[],
): void => {
  if (!allowed.includes(ctx.role)) {
    throw new ForbiddenError();
  }
};

export const hasRole = (
  ctx: UserAuthContext,
  allowed: readonly AppRole[],
): boolean => allowed.includes(ctx.role);
