import { createClient } from "@/lib/supabase/server";

import * as issueService from "../issues/service";
import type { IssueStatusRow, IssueWithStatus } from "../issues/types";
import * as projectService from "../projects/service";
import type { ProjectRow } from "../projects/types";

export type DashboardData = {
  projects: ProjectRow[];
  statuses: IssueStatusRow[];
  totalIssues: number;
  openIssues: number;
  myIssues: number;
  recentIssues: IssueWithStatus[];
  myAssignedIssues: IssueWithStatus[];
  hasError: boolean;
};

export const getDashboardData = async (
  userId: string,
): Promise<DashboardData> => {
  const supabase = await createClient();

  const [projectsResult, statusesResult] = await Promise.all([
    projectService.listProjects(),
    issueService.listIssueStatuses(),
  ]);

  const projects = projectsResult.ok ? projectsResult.data : [];
  const statuses = statusesResult.ok ? statusesResult.data : [];
  const openStatusIds = statuses
    .filter((s) => !s.is_terminal)
    .map((s) => s.id);

  // Three count queries + two list queries in parallel
  const [totalResult, openResult, myCountResult, recentResult, mineResult] =
    await Promise.all([
      supabase
        .from("issues")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),

      openStatusIds.length > 0
        ? supabase
            .from("issues")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .in("status_id", openStatusIds)
        : Promise.resolve({ count: 0, error: null }),

      supabase
        .from("issues")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("assignee_id", userId),

      issueService.listIssues({
        mode: "offset",
        offset: 0,
        limit: 8,
        sortBy: "updated_at",
        sortDir: "desc",
      }),

      issueService.listIssues({
        mode: "offset",
        offset: 0,
        limit: 8,
        assigneeId: userId,
        sortBy: "updated_at",
        sortDir: "desc",
      }),
    ]);

  const hasError =
    !projectsResult.ok ||
    !statusesResult.ok ||
    !!totalResult.error ||
    !!openResult.error ||
    !!myCountResult.error ||
    !recentResult.ok ||
    !mineResult.ok;

  return {
    projects,
    statuses,
    totalIssues: totalResult.count ?? 0,
    openIssues: openResult.count ?? 0,
    myIssues: myCountResult.count ?? 0,
    recentIssues: recentResult.ok ? recentResult.data.items : [],
    myAssignedIssues: mineResult.ok ? mineResult.data.items : [],
    hasError,
  };
};
