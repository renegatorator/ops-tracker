import { createClient } from "@/lib/supabase/server";

import { supabaseErrorKey } from "./map-errors";
import type {
  AssignIssueInput,
  CreateIssueInput,
  ListIssuesSchemaInput,
  SoftDeleteIssueInput,
  TransitionIssueStatusInput,
  UpdateIssueInput,
} from "./schemas";
import type {
  IssuesActionResult,
  IssueWithStatus,
  ListIssuesSuccess,
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
  )
`;

const sanitizeSearch = (raw: string): string => raw.trim().replace(/[%_]/g, "");

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

  let q = supabase
    .from("issues")
    .select(issueSelect)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (input.statusId) {
    q = q.eq("status_id", input.statusId);
  }
  if (input.assigneeId) {
    q = q.eq("assignee_id", input.assigneeId);
  }
  if (input.search?.trim()) {
    const safe = sanitizeSearch(input.search);
    if (safe) {
      q = q.ilike("title", `%${safe}%`);
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

export const createIssue = async (
  userId: string,
  input: CreateIssueInput,
): Promise<IssuesActionResult<{ id: string }>> => {
  const statusCheck = await statusExists(input.status_id);
  if (!statusCheck.ok) return statusCheck;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .insert({
      title: input.title,
      description: input.description?.length ? input.description : null,
      status_id: input.status_id,
      reporter_id: userId,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.createFailed"),
    };
  }
  return { ok: true, data: { id: data.id } };
};

export const updateIssue = async (
  input: UpdateIssueInput,
): Promise<IssuesActionResult<{ id: string }>> => {
  const supabase = await createClient();
  const patch: Record<string, string | null> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;

  const { data, error } = await supabase
    .from("issues")
    .update(patch)
    .eq("id", input.issueId)
    .select("id")
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
  return { ok: true, data: { id: data.id } };
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
