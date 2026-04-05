import type { PostgrestError } from "@supabase/supabase-js";
import type { ZodError } from "zod";

export const zodToFieldErrors = (err: ZodError): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.length ? issue.path.join(".") : "root";
    if (!out[path]) out[path] = [];
    out[path].push(issue.message);
  }
  return out;
};

export const supabaseErrorKey = (
  error: PostgrestError | null,
  fallbackKey: string,
): string => {
  if (!error) return fallbackKey;
  if (error.code === "23503") return "errors.referenceInvalid";
  if (error.code === "PGRST116") return "errors.notFound";
  const msg = error.message.toLowerCase();
  if (
    msg.includes("row-level security") ||
    msg.includes("violates row-level security") ||
    msg.includes("policy")
  ) {
    return "errors.forbidden";
  }
  return fallbackKey;
};
