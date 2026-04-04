import type { AppRole } from "@/lib/auth/types";

export type UserProfileAdminRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
};
