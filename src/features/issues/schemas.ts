import { z } from "zod";

const trimmedTitle = z
  .string()
  .trim()
  .min(1, { message: "validation.titleRequired" })
  .max(500, { message: "validation.titleTooLong" });

export const issueTypeSchema = z.enum(["bug", "ticket"], {
  message: "validation.issueTypeInvalid",
});

export const createIssueSchema = z
  .object({
    project_id: z.uuid({ message: "validation.projectIdInvalid" }),
    title: trimmedTitle,
    description: z
      .string()
      .max(20_000, { message: "validation.descriptionTooLong" })
      .optional(),
    status_id: z.uuid({ message: "validation.statusInvalid" }),
    issue_type: issueTypeSchema.default("ticket"),
    assignee_id: z
      .uuid({ message: "validation.assigneeInvalid" })
      .optional()
      .nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.issue_type === "ticket" && !val.description?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "validation.descriptionRequiredForTicket",
      });
    }
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
    issue_type: issueTypeSchema.optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.issue_type !== undefined,
    {
      message: "validation.noChanges",
      path: ["root"],
    },
  );

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

export const getIssueSchema = z
  .object({
    issueId: z.uuid({ message: "validation.issueIdInvalid" }).optional(),
    projectKey: z.string().trim().min(1).max(10).optional(),
    issueNumber: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (x) =>
      Boolean(x.issueId) ||
      (Boolean(x.projectKey?.trim()) && x.issueNumber != null),
    { message: "validation.issueLookupInvalid", path: ["root"] },
  );

const statusSlug = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]*$/, { message: "validation.slugInvalid" })
  .max(80, { message: "validation.slugTooLong" });

export const createIssueStatusSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "validation.statusNameRequired" })
    .max(120, { message: "validation.statusNameTooLong" }),
  slug: statusSlug,
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_terminal: z.boolean().default(false),
});

export const updateIssueStatusSchema = z
  .object({
    statusId: z.uuid({ message: "validation.statusInvalid" }),
    name: z
      .string()
      .trim()
      .min(1, { message: "validation.statusNameRequired" })
      .max(120, { message: "validation.statusNameTooLong" })
      .optional(),
    slug: statusSlug.optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
    is_terminal: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.slug !== undefined ||
      v.sort_order !== undefined ||
      v.is_terminal !== undefined,
    { message: "validation.noChanges", path: ["root"] },
  );

export const deleteIssueStatusSchema = z.object({
  statusId: z.uuid({ message: "validation.statusInvalid" }),
});

const filterFields = {
  projectId: z.uuid({ message: "validation.projectIdInvalid" }).optional(),
  statusId: z.uuid({ message: "validation.statusInvalid" }).optional(),
  assigneeId: z
    .uuid({ message: "validation.assigneeInvalid" })
    .optional(),
  search: z
    .string()
    .max(200, { message: "validation.searchTooLong" })
    .optional(),
  sortBy: z
    .enum(["created_at", "title", "updated_at", "status"], {
      message: "validation.sortInvalid",
    })
    .optional(),
  sortDir: z
    .enum(["asc", "desc"], { message: "validation.sortDirInvalid" })
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

export type IssueType = z.infer<typeof issueTypeSchema>;
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type TransitionIssueStatusInput = z.infer<
  typeof transitionIssueStatusSchema
>;
export type AssignIssueInput = z.infer<typeof assignIssueSchema>;
export type SoftDeleteIssueInput = z.infer<typeof softDeleteIssueSchema>;
export type ListIssuesSchemaInput = z.infer<typeof listIssuesSchema>;

export type GetIssueInput =
  | { issueId: string }
  | { projectKey: string; issueNumber: number };

export const listAssigneeFiltersSchema = z.object({
  projectId: z.uuid({ message: "validation.projectIdInvalid" }).optional(),
});

export type ListAssigneeFiltersInput = z.infer<typeof listAssigneeFiltersSchema>;
export type CreateIssueStatusInput = z.infer<typeof createIssueStatusSchema>;
export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>;
export type DeleteIssueStatusInput = z.infer<typeof deleteIssueStatusSchema>;

