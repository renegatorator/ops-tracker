export type ProjectRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  created_by: string;
  archived_at: string | null;
  last_issue_number: number;
  created_at: string;
  updated_at: string;
};

export type ProjectMemberRole = "lead" | "member";

export type ProjectMemberRow = {
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  created_at: string;
};

export type UserProfileBrief = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export type ProjectMemberWithProfile = ProjectMemberRow & {
  user_profiles: UserProfileBrief | null;
};

export type ProjectsActionFailure = {
  ok: false;
  errorKey: string;
  fieldErrors?: Record<string, string[]>;
};

export type ProjectsActionSuccess<T> = { ok: true; data: T };

export type ProjectsActionResult<T> =
  | ProjectsActionFailure
  | ProjectsActionSuccess<T>;
