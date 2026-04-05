"use client";

import { useQuery } from "@tanstack/react-query";

import { IssuesQueryError } from "@/features/issues/issues-query-error";

import { listAuditLogsForAdmin } from "../actions";
import { auditQueryKeys } from "../keys";

const ISSUE_AUDIT_LIMIT = 40;

export const useIssueAuditActivity = (locale: string, issueId: string) =>
  useQuery({
    queryKey: auditQueryKeys.issueActivity(locale, issueId),
    queryFn: async () => {
      const result = await listAuditLogsForAdmin(locale, {
        entityType: "issue",
        entityId: issueId,
        limit: ISSUE_AUDIT_LIMIT,
        offset: 0,
      });
      if (!result.ok) {
        throw new IssuesQueryError(result.errorKey, result.fieldErrors);
      }
      return result.data.items;
    },
  });
