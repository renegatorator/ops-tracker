"use client";

import { useQuery } from "@tanstack/react-query";

import { IssuesQueryError } from "@/features/issues/issues-query-error";

import { listAuditLogsForAdmin } from "../actions";
import { auditQueryKeys } from "../keys";
import type { ListAuditLogsInput } from "../schemas";

export const useAdminAuditLogList = (
  locale: string,
  params: ListAuditLogsInput,
) =>
  useQuery({
    queryKey: auditQueryKeys.list(locale, params),
    queryFn: async () => {
      const result = await listAuditLogsForAdmin(locale, params);
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data;
    },
  });
