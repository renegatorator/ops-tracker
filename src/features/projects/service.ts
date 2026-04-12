import { supabaseErrorKey } from "@/features/issues/map-errors";
import { createClient } from "@/lib/supabase/server";

import type {
  AddProjectMemberInput,
  CreateProjectInput,
  GetProjectByKeyInput,
  ListProjectMembersInput,
  RemoveProjectMemberInput,
  UpdateProjectInput,
} from "./schemas";
import type {
  ProjectMemberWithProfile,
  ProjectRow,
  ProjectsActionResult,
  UserProfileBrief,
} from "./types";

export const listProjects = async (): Promise<
  ProjectsActionResult<ProjectRow[]>
> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, key, name, description, created_by, archived_at, last_issue_number, created_at, updated_at",
    )
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.readFailed"),
    };
  }
  return { ok: true, data: (data ?? []) as ProjectRow[] };
};

export const getProjectByKey = async (
  input: GetProjectByKeyInput,
): Promise<ProjectsActionResult<ProjectRow>> => {
  const supabase = await createClient();
  const key = input.key.trim().toUpperCase();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, key, name, description, created_by, archived_at, last_issue_number, created_at, updated_at",
    )
    .eq("key", key)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.readFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "projects.errors.notFound" };
  }
  return { ok: true, data: data as ProjectRow };
};

export const createProject = async (
  creatorId: string,
  input: CreateProjectInput,
): Promise<ProjectsActionResult<{ id: string }>> => {
  const supabase = await createClient();
  const { data: created, error: insertErr } = await supabase
    .from("projects")
    .insert({
      key: input.key,
      name: input.name,
      description: input.description?.length ? input.description : null,
      created_by: creatorId,
    })
    .select("id")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return { ok: false, errorKey: "projects.errors.keyTaken" };
    }
    return {
      ok: false,
      errorKey: supabaseErrorKey(insertErr, "projects.errors.createFailed"),
    };
  }

  const { error: memberErr } = await supabase.from("project_members").insert({
    project_id: created.id,
    user_id: creatorId,
    role: "lead",
  });

  if (memberErr) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(memberErr, "projects.errors.createFailed"),
    };
  }

  return { ok: true, data: { id: created.id } };
};

export const updateProject = async (
  input: UpdateProjectInput,
): Promise<ProjectsActionResult<{ id: string; key: string }>> => {
  const supabase = await createClient();
  const patch: Record<string, string | null | boolean | undefined> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) {
    patch.description =
      input.description === null || input.description === ""
        ? null
        : input.description;
  }
  if (input.archived !== undefined) {
    patch.archived_at = input.archived ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", input.projectId)
    .select("id, key")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "projects.errors.updateFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "projects.errors.notFound" };
  }
  return {
    ok: true,
    data: { id: data.id as string, key: data.key as string },
  };
};

export const listProjectMembers = async (
  input: ListProjectMembersInput,
): Promise<ProjectsActionResult<ProjectMemberWithProfile[]>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select(
      `
      project_id,
      user_id,
      role,
      created_at,
      user_profiles (
        id,
        email,
        full_name
      )
    `,
    )
    .eq("project_id", input.projectId)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.readFailed"),
    };
  }

  const rows = (data ?? []) as {
    project_id: string;
    user_id: string;
    role: ProjectMemberWithProfile["role"];
    created_at: string;
    user_profiles: UserProfileBrief | UserProfileBrief[] | null;
  }[];

  const normalized: ProjectMemberWithProfile[] = rows.map((row) => ({
    project_id: row.project_id,
    user_id: row.user_id,
    role: row.role,
    created_at: row.created_at,
    user_profiles: Array.isArray(row.user_profiles)
      ? (row.user_profiles[0] ?? null)
      : row.user_profiles,
  }));

  return { ok: true, data: normalized };
};

export const listProjectMemberProfilesBrief = async (
  projectId: string,
): Promise<ProjectsActionResult<UserProfileBrief[]>> => {
  const supabase = await createClient();
  const { data: members, error: mErr } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  if (mErr) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(mErr, "errors.readFailed"),
    };
  }

  const ids = (members ?? []).map((m) => m.user_id as string);
  if (ids.length === 0) {
    return { ok: true, data: [] };
  }

  const { data: profiles, error: pErr } = await supabase
    .from("user_profiles")
    .select("id, email, full_name")
    .in("id", ids)
    .order("email", { ascending: true });

  if (pErr) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(pErr, "errors.readFailed"),
    };
  }
  return { ok: true, data: (profiles ?? []) as UserProfileBrief[] };
};

export const addProjectMember = async (
  input: AddProjectMemberInput,
): Promise<ProjectsActionResult<null>> => {
  const supabase = await createClient();
  const { error } = await supabase.from("project_members").insert({
    project_id: input.projectId,
    user_id: input.userId,
    role: input.role,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, errorKey: "projects.errors.alreadyMember" };
    }
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "projects.errors.memberAddFailed"),
    };
  }
  return { ok: true, data: null };
};

export const getProjectKeyById = async (
  projectId: string,
): Promise<ProjectsActionResult<{ key: string }>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("key")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "errors.readFailed"),
    };
  }
  if (!data) {
    return { ok: false, errorKey: "projects.errors.notFound" };
  }
  return { ok: true, data: { key: data.key as string } };
};

export const removeProjectMember = async (
  input: RemoveProjectMemberInput,
): Promise<ProjectsActionResult<null>> => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", input.projectId)
    .eq("user_id", input.userId);

  if (error) {
    return {
      ok: false,
      errorKey: supabaseErrorKey(error, "projects.errors.memberRemoveFailed"),
    };
  }
  return { ok: true, data: null };
};
