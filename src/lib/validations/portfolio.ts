import { z } from "zod";

// ─── Portfolio ────────────────────────────────────────────────────

export const createPortfolioSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug must be less than 60 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  description: z
    .string()
    .max(300, "Description must be less than 300 characters")
    .optional(),
  templateId: z.string().cuid().optional(),
});

export const updatePortfolioSchema = createPortfolioSchema.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isDefault: z.boolean().optional(),
});

// ─── Section ──────────────────────────────────────────────────────

export const sectionTypeEnum = z.enum([
  "HERO",
  "ABOUT",
  "SKILLS",
  "PROJECTS",
  "EXPERIENCE",
  "CONTACT",
  "CUSTOM",
]);

export const sectionConfigSchema = z
  .object({
    layout: z.enum(["default", "centered", "split", "grid"]).optional(),
    showTitle: z.boolean().optional(),
    animation: z.enum(["none", "fade", "slide", "scale"]).optional(),
    padding: z.enum(["sm", "md", "lg"]).optional(),
    background: z.enum(["transparent", "muted", "accent"]).optional(),
  })
  .passthrough();

export const createSectionSchema = z.object({
  type: sectionTypeEnum,
  title: z
    .string()
    .min(1, "Section title is required")
    .max(60, "Section title must be less than 60 characters"),
  sortOrder: z.number().int().min(0).optional(),
  config: sectionConfigSchema.optional(),
  content: z.record(z.unknown()).optional(),
});

export const updateSectionSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(60)
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  config: sectionConfigSchema.optional(),
  content: z.record(z.unknown()).optional(),
});

export const reorderSectionsSchema = z.object({
  sections: z
    .array(
      z.object({
        id: z.string().cuid(),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1),
});

// ─── Project ──────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, "Project title is required")
    .max(100, "Project title must be less than 100 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  liveUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  repoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  techStack: z.array(z.string().max(30)).max(20).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ─── Theme ────────────────────────────────────────────────────────

export const updateThemeSchema = z.object({
  mode: z.enum(["LIGHT", "DARK", "CUSTOM"]).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .optional(),
  fontHeading: z.string().max(60).optional(),
  fontBody: z.string().max(60).optional(),
  borderRadius: z.string().max(20).optional(),
  customCss: z.string().max(5000).optional(),
});

// ─── Type exports ─────────────────────────────────────────────────

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
