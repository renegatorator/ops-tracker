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
