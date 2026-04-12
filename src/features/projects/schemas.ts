import { z } from "zod";

const projectKey = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
  z
    .string()
    .regex(/^[A-Z][A-Z0-9]{1,9}$/, { message: "validation.projectKeyInvalid" })
    .max(10),
);

export const createProjectSchema = z.object({
  key: projectKey,
  name: z
    .string()
    .trim()
    .min(1, { message: "validation.projectNameRequired" })
    .max(200, { message: "validation.projectNameTooLong" }),
  description: z
    .string()
    .max(10_000, { message: "validation.descriptionTooLong" })
    .optional(),
});

export const updateProjectSchema = z
  .object({
    projectId: z.uuid({ message: "validation.projectIdInvalid" }),
    name: z
      .string()
      .trim()
      .min(1, { message: "validation.projectNameRequired" })
      .max(200, { message: "validation.projectNameTooLong" })
      .optional(),
    description: z
      .union([
        z.string().max(10_000, { message: "validation.descriptionTooLong" }),
        z.null(),
      ])
      .optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.description !== undefined ||
      v.archived !== undefined,
    { message: "validation.noChanges", path: ["root"] },
  );

export const getProjectByKeySchema = z.object({
  key: z.string().trim().min(1).max(10),
});

export const addProjectMemberSchema = z.object({
  projectId: z.uuid({ message: "validation.projectIdInvalid" }),
  userId: z.uuid({ message: "validation.userIdInvalid" }),
  role: z.enum(["lead", "member"]).default("member"),
});

export const removeProjectMemberSchema = z.object({
  projectId: z.uuid({ message: "validation.projectIdInvalid" }),
  userId: z.uuid({ message: "validation.userIdInvalid" }),
});

export const listProjectMembersSchema = z.object({
  projectId: z.uuid({ message: "validation.projectIdInvalid" }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type GetProjectByKeyInput = z.infer<typeof getProjectByKeySchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type RemoveProjectMemberInput = z.infer<
  typeof removeProjectMemberSchema
>;
export type ListProjectMembersInput = z.infer<typeof listProjectMembersSchema>;
