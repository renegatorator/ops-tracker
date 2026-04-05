export type AuditLogActorEmbed = {
  email: string | null;
  full_name: string | null;
};

export type AuditLogRow = {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: AuditLogActorEmbed | null;
};

export type ListAuditLogsSuccess = {
  items: AuditLogRow[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};
