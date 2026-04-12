import { z } from "zod";

import { APP_ROLE } from "@/lib/auth/types";

export const updateUserRoleSchema = z.object({
  userId: z.uuid({ message: "validation.userIdInvalid" }),
  role: z.enum(
    [APP_ROLE.user, APP_ROLE.admin, APP_ROLE.super_admin],
    {
      message: "validation.roleInvalid",
    },
  ),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
