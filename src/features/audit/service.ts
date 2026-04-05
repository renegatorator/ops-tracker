import { supabaseErrorKey } from "@/features/issues/map-errors";
import type { IssuesActionResult } from "@/features/issues/types";
import { createClient } from "@/lib/supabase/server";

import type { ListAuditLogsInput } from "./schemas";
import type {
  AuditLogActorEmbed,
  AuditLogRow,
  ListAuditLogsSuccess,
} from "./types";

const auditSelect = `
  id,
  actor_id,
  action,
  entity_type,
  entity_id,
  metadata,
  created_at,
  actor:user_profiles!audit_log_actor_id_fkey (
    email,
    full_name
  )
`;

const startOfUtcDay = (ymd: string) => `${ymd}T00:00:00.000Z`;
const endOfUtcDay = (ymd: string) => `${ymd}T23:59:59.999Z`;

export const listAuditLogs = async (
  input: ListAuditLogsInput,
): Promise<IssuesActionResult<ListAuditLogsSuccess>> => {
  const supabase = await createClient();

  let countBuilder = supabase
    .from("audit_log")
    .select("id", { count: "exact", head: true });
  let dataBuilder = supabase.from("audit_log").select(auditSelect);

  if (input.actionContains?.length) {
    const p = `%${input.actionContains}%`;
    countBuilder = countBuilder.ilike("action", p);
    dataBuilder = dataBuilder.ilike("action", p);
  }
  if (input.entityType) {
    countBuilder = countBuilder.eq("entity_type", input.entityType);
    dataBuilder = dataBuilder.eq("entity_type", input.entityType);
  }
  if (input.entityId) {
    countBuilder = countBuilder.eq("entity_id", input.entityId);
    dataBuilder = dataBuilder.eq("entity_id", input.entityId);
  }
  if (input.fromDate) {
    const t0 = startOfUtcDay(input.fromDate);
    countBuilder = countBuilder.gte("created_at", t0);
    dataBuilder = dataBuilder.gte("created_at", t0);
  }
  if (input.toDate) {
    const t1 = endOfUtcDay(input.toDate);
    countBuilder = countBuilder.lte("created_at", t1);
    dataBuilder = dataBuilder.lte("created_at", t1);
  }

  const from = input.offset;
  const to = input.offset + input.limit - 1;

  const [{ count, error: countError }, { data, error: dataError }] =
    await Promise.all([
      countBuilder,
      dataBuilder
        .order("created_at", { ascending: false })
        .range(from, to),
    ]);

  if (countError) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(countError, "audit.errors.listFailed"),
    };
  }
  if (dataError) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(dataError, "audit.errors.listFailed"),
    };
  }

  const total = count ?? 0;
  const raw = (data ?? []) as (Omit<AuditLogRow, "actor"> & {
    actor?: AuditLogActorEmbed | AuditLogActorEmbed[] | null;
  })[];
  const items: AuditLogRow[] = raw.map((row) => {
    const a = row.actor;
    const actor = Array.isArray(a) ? (a[0] ?? null) : (a ?? null);
    return { ...row, actor };
  });

  return {
    ok: true,
    data: {
      items,
      total,
      limit: input.limit,
      offset: input.offset,
      hasMore: input.offset + items.length < total,
    },
  };
};
