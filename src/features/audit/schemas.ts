import { z } from "zod";

const entityTypeEnum = z.enum([
  "issue",
  "issue_status",
  "user_profile",
  "system",
]);

export const listAuditLogsSchema = z.object({
  actionContains: z.string().trim().max(200).optional(),
  entityType: entityTypeEnum.optional(),
  entityId: z.uuid().optional(),
  fromDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  toDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.number().int().min(10).max(100).default(25),
  offset: z.number().int().min(0).max(50_000).default(0),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
