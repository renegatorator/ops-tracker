import { z } from "zod";

export const updateUserRoleSchema = z.object({
  userId: z.uuid({ message: "validation.userIdInvalid" }),
  role: z.enum(["user", "admin", "super_admin"], {
    message: "validation.roleInvalid",
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
