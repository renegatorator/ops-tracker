import { z } from "zod";

const trimmedTitle = z
  .string()
  .trim()
  .min(1, { message: "validation.titleRequired" })
  .max(500, { message: "validation.titleTooLong" });

export const createIssueSchema = z.object({
  title: trimmedTitle,
  description: z
    .string()
    .max(20_000, { message: "validation.descriptionTooLong" })
    .optional(),
  status_id: z.uuid({ message: "validation.statusInvalid" }),
});

export const updateIssueSchema = z
  .object({
    issueId: z.uuid({ message: "validation.issueIdInvalid" }),
    title: trimmedTitle.optional(),
    description: z
      .union([
        z
          .string()
          .max(20_000, { message: "validation.descriptionTooLong" }),
        z.null(),
      ])
      .optional(),
  })
  .refine((v) => v.title !== undefined || v.description !== undefined, {
    message: "validation.noChanges",
    path: ["root"],
  });

export const transitionIssueStatusSchema = z.object({
  issueId: z.uuid({ message: "validation.issueIdInvalid" }),
  statusId: z.uuid({ message: "validation.statusInvalid" }),
});

export const assignIssueSchema = z.object({
  issueId: z.uuid({ message: "validation.issueIdInvalid" }),
  assigneeId: z.union([
    z.uuid({ message: "validation.assigneeInvalid" }),
    z.null(),
  ]),
});

export const softDeleteIssueSchema = z.object({
  issueId: z.uuid({ message: "validation.issueIdInvalid" }),
});

export const getIssueSchema = z.object({
  issueId: z.uuid({ message: "validation.issueIdInvalid" }),
});

const filterFields = {
  statusId: z.uuid({ message: "validation.statusInvalid" }).optional(),
  assigneeId: z
    .uuid({ message: "validation.assigneeInvalid" })
    .optional(),
  search: z
    .string()
    .max(200, { message: "validation.searchTooLong" })
    .optional(),
};

export const listIssuesSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("offset"),
    offset: z.number().int().min(0).max(1_000_000),
    limit: z.number().int().min(1).max(100).default(20),
    ...filterFields,
  }),
  z.object({
    mode: z.literal("cursor"),
    cursor: z.string().min(1, { message: "validation.cursorInvalid" }),
    limit: z.number().int().min(1).max(100).default(20),
    ...filterFields,
  }),
]);

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type TransitionIssueStatusInput = z.infer<
  typeof transitionIssueStatusSchema
>;
export type AssignIssueInput = z.infer<typeof assignIssueSchema>;
export type SoftDeleteIssueInput = z.infer<typeof softDeleteIssueSchema>;
export type ListIssuesSchemaInput = z.infer<typeof listIssuesSchema>;
export type GetIssueInput = z.infer<typeof getIssueSchema>;
