import { createClient } from "@/lib/supabase/server";

import { supabaseErrorKey } from "./map-errors";
import type {
  AssignIssueInput,
  CreateIssueInput,
  CreateIssueStatusInput,
  DeleteIssueStatusInput,
  GetIssueInput,
  ListIssuesSchemaInput,
  SoftDeleteIssueInput,
  TransitionIssueStatusInput,
  UpdateIssueInput,
  UpdateIssueStatusInput,
} from "./schemas";
import type {
  IssuesActionResult,
  IssueStatusRow,
  IssueWithStatus,
  ListIssuesSuccess,
  UserProfileBrief,
} from "./types";

const issueSelect = `
  *,
  issue_statuses (
    id,
    name,
    slug,
    sort_order,
    is_terminal,
    created_at
  ),
  projects!inner (
    id,
    key,
    name
  ),
  assignee:user_profiles!issues_assignee_id_fkey (
    id,
    email,
    full_name
  )
`;

const sanitizeSearch = (raw: string): string => raw.trim().replace(/[%_,()/]/g, "");

/** Opaque continuation token for `mode: "cursor"` (offset inside JSON + base64url). Keyset pagination can replace this later. */
const encodeListCursor = (offset: number): string =>
  Buffer.from(JSON.stringify({ o: offset }), "utf8").toString("base64url");

const decodeListCursor = (raw: string): number | null => {
  try {
    const o = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      o?: unknown;
    };
    if (typeof o.o !== "number" || !Number.isInteger(o.o) || o.o < 0) {
      return null;
    }
    return o.o;
  } catch {
    return null;
  }
};

const statusExists = async (
  statusId: string,
): Promise<IssuesActionResult<null>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issue_statuses")
    .select("id")
    .eq("id", statusId)
    .maybeSingle();
  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.readFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "errors.statusNotFound" };
  }
  return { ok: true, data: null };
};

export const listIssues = async (
  input: ListIssuesSchemaInput,
): Promise<IssuesActionResult<ListIssuesSuccess>> => {
  const supabase = await createClient();
  const limit = input.limit;

  let offset = 0;
  if (input.mode === "offset") {
    offset = input.offset;
  } else {
    const decoded = decodeListCursor(input.cursor);
    if (decoded == null) {
      return { ok: false, errorKey: "errors.invalidCursor" };
    }
    offset = decoded;
  }

  const sortBy = input.sortBy ?? "created_at";
  const sortDir = input.sortDir ?? "desc";
  const ascending = sortDir === "asc";

  let q = supabase.from("issues").select(issueSelect).is("deleted_at", null);

  if (sortBy === "status") {
    q = q.order("sort_order", {
      ascending,
      referencedTable: "issue_statuses",
    });
  } else {
    q = q.order(sortBy, { ascending });
  }
  q = q.order("id", { ascending });

  if (input.statusId) {
    q = q.eq("status_id", input.statusId);
  }
  if (input.assigneeId) {
    q = q.eq("assignee_id", input.assigneeId);
  }
  if (input.projectId) {
    q = q.eq("project_id", input.projectId);
  }
  if (input.search?.trim()) {
    const safe = sanitizeSearch(input.search);
    if (safe) {
      const pat = `%${safe}%`;
      q = q.or(`title.ilike.${pat},issue_key.ilike.${pat}`);
    }
  }

  const from = offset;
  const to = offset + limit;
  const { data, error } = await q.range(from, to);

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.listFailed"),
    };
  }

  const rows = (data ?? []) as IssueWithStatus[];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  if (input.mode === "offset") {
    return {
      ok: true,
      data: {
        items,
        pagination: {
          mode: "offset",
          limit,
          offset,
          hasMore,
          nextOffset: hasMore ? offset + limit : null,
        },
      },
    };
  }

  return {
    ok: true,
    data: {
      items,
      pagination: {
        mode: "cursor",
        limit,
        nextCursor: hasMore ? encodeListCursor(offset + limit) : null,
      },
    },
  };
};

export const getIssue = async (
  input: GetIssueInput,
): Promise<IssuesActionResult<IssueWithStatus>> => {
  const supabase = await createClient();
  let q = supabase
    .from("issues")
    .select(issueSelect)
    .is("deleted_at", null);

  if ("issueId" in input) {
    q = q.eq("id", input.issueId);
  } else {
    q = q
      .eq("issue_number", input.issueNumber)
      .eq("projects.key", input.projectKey.trim().toUpperCase());
  }

  const { data, error } = await q.maybeSingle();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.readFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "errors.notFound" };
  }
  return { ok: true, data: data as IssueWithStatus };
};

export const createIssue = async (
  userId: string,
  input: CreateIssueInput,
): Promise<
  IssuesActionResult<{
    id: string;
    issue_key: string;
    issue_number: number;
    project_key: string;
  }>
> => {
  const statusCheck = await statusExists(input.status_id);
  if (!statusCheck.ok) return statusCheck;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .insert({
      project_id: input.project_id,
      title: input.title,
      description: input.description?.length ? input.description : null,
      status_id: input.status_id,
      issue_type: input.issue_type ?? "ticket",
      assignee_id: input.assignee_id ?? null,
      reporter_id: userId,
    })
    .select(
      `
      id,
      issue_key,
      issue_number,
      projects!inner (
        key
      )
    `,
    )
    .single();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.createFailed"),
    };
  }
  const row = data as unknown as {
    id: string;
    issue_key: string;
    issue_number: number;
    projects: { key: string } | { key: string }[];
  };
  const proj = Array.isArray(row.projects) ? row.projects[0] : row.projects;
  return {
    ok: true,
    data: {
      id: row.id,
      issue_key: row.issue_key,
      issue_number: row.issue_number,
      project_key: proj.key,
    },
  };
};

export const updateIssue = async (
  input: UpdateIssueInput,
): Promise<IssuesActionResult<{ id: string; project_key: string }>> => {
  const supabase = await createClient();
  const patch: Record<string, string | null> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.issue_type !== undefined) patch.issue_type = input.issue_type;

  const { data, error } = await supabase
    .from("issues")
    .update(patch)
    .eq("id", input.issueId)
    .select("id, projects!inner(key)")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.updateFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "errors.notFound" };
  }
  const proj = (data.projects as unknown) as { key: string } | null;
  return { ok: true, data: { id: data.id, project_key: proj?.key ?? "" } };
};

export const transitionIssueStatus = async (
  input: TransitionIssueStatusInput,
): Promise<IssuesActionResult<{ id: string }>> => {
  const statusCheck = await statusExists(input.statusId);
  if (!statusCheck.ok) return statusCheck;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .update({ status_id: input.statusId })
    .eq("id", input.issueId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.transitionFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "errors.notFound" };
  }
  return { ok: true, data: { id: data.id } };
};

export const assignIssue = async (
  input: AssignIssueInput,
): Promise<IssuesActionResult<{ id: string }>> => {
  const supabase = await createClient();

  if (input.assigneeId) {
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", input.assigneeId)
      .maybeSingle();
    if (profileError) {
      return {
        ok: false,
        errorKey: supabaseErrorKey(profileError, "errors.readFailed"),
      };
    }
    if (!profile) {
      return { ok: false, errorKey: "errors.assigneeNotFound" };
    }
  }

  const { data, error } = await supabase
    .from("issues")
    .update({ assignee_id: input.assigneeId })
    .eq("id", input.issueId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.assignFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "errors.notFound" };
  }
  return { ok: true, data: { id: data.id } };
};

export const softDeleteIssue = async (
  input: SoftDeleteIssueInput,
): Promise<IssuesActionResult<{ id: string }>> => {
  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("issues")
    .update({ deleted_at: deletedAt })
    .eq("id", input.issueId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.deleteFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "errors.notFound" };
  }
  return { ok: true, data: { id: data.id } };
};

export const listIssueStatuses = async (): Promise<
  IssuesActionResult<IssueStatusRow[]>
> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issue_statuses")
    .select("id, name, slug, sort_order, is_terminal, created_at")
    .order("sort_order", { ascending: true });

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.readFailed"),
    };
  }
  return { ok: true, data: (data ?? []) as IssueStatusRow[] };
};

export const listUserProfilesBrief = async (): Promise<
  IssuesActionResult<UserProfileBrief[]>
> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, email, full_name")
    .order("email", { ascending: true });

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.readFailed"),
    };
  }
  return { ok: true, data: (data ?? []) as UserProfileBrief[] };
};

export const createIssueStatus = async (
  input: CreateIssueStatusInput,
): Promise<IssuesActionResult<{ id: string }>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issue_statuses")
    .insert({
      name: input.name,
      slug: input.slug,
      sort_order: input.sort_order,
      is_terminal: input.is_terminal,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, errorKey: "statuses.slugTaken" };
    }
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "statuses.createFailed"),
    };
  }
  return { ok: true, data: { id: data.id } };
};

export const updateIssueStatus = async (
  input: UpdateIssueStatusInput,
): Promise<IssuesActionResult<{ id: string }>> => {
  const supabase = await createClient();
  const patch: Record<string, string | number | boolean> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_terminal !== undefined) patch.is_terminal = input.is_terminal;

  const { data, error } = await supabase
    .from("issue_statuses")
    .update(patch)
    .eq("id", input.statusId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, errorKey: "statuses.slugTaken" };
    }
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "statuses.updateFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "errors.statusNotFound" };
  }
  return { ok: true, data: { id: data.id } };
};

export const deleteIssueStatus = async (
  input: DeleteIssueStatusInput,
): Promise<IssuesActionResult<{ id: string }>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issue_statuses")
    .delete()
    .eq("id", input.statusId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23503") {
      return { ok: false, errorKey: "statuses.deleteInUse" };
    }
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "statuses.deleteFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "errors.statusNotFound" };
  }
  return { ok: true, data: { id: data.id } };
};
