const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export type EnvName = keyof typeof ENV;

export function env(name: EnvName): string {
  const value = ENV[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing or empty environment variable: ${name}`);
  }
  return value;
}

const parseOptionalBool = (
  raw: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (raw === undefined || raw === "") return defaultValue;
  const v = raw.toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return defaultValue;
};

/**
 * Server-only feature gate for super-admin demo reset.
 * Defaults to enabled outside production; in production set `OPS_DEMO_RESET_ENABLED=true` explicitly.
 */
export const isDemoResetEnabled = (): boolean =>
  parseOptionalBool(
    process.env.OPS_DEMO_RESET_ENABLED,
    process.env.NODE_ENV !== "production",
  );

/** Raw env value for super-admin settings display (may be unset). */
export const getDemoResetEnvRaw = (): string | undefined =>
  process.env.OPS_DEMO_RESET_ENABLED;

/**
 * Optional second flag for UI display only; does not change runtime behaviour unless you wire it elsewhere.
 */
export const isExperimentalUiFlagSet = (): boolean =>
  parseOptionalBool(process.env.OPS_EXPERIMENTAL_UI, false);
