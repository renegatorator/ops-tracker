import "server-only";

import { createClient } from "@/lib/supabase/server";

export type LogAuditInput = {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Inserts one `audit_log` row as the authenticated actor (RLS: `actor_id` must be `auth.uid()`).
 * Returns false on failure; logs to stderr. Call sites should not fail user mutations solely on audit errors unless policy requires it.
 */
export const logAudit = async (input: LogAuditInput): Promise<boolean> => {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_log").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) {
    console.error("[audit] insert failed", error.message);
    return false;
  }
  return true;
};
