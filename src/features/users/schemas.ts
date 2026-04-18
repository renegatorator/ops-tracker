import { z } from "zod";

import { AppRoleValues } from "@/lib/auth/types";

export const updateUserRoleSchema = z.object({
  userId: z.uuid({ message: "validation.userIdInvalid" }),
  role: z.enum(AppRoleValues, {
    message: "validation.roleInvalid",
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
