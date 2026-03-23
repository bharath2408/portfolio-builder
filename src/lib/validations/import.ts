import { z } from "zod";

const blockSchema = z.object({
  type: z.string().min(1),
  sortOrder: z.number().int().min(0).optional().default(0),
  content: z.record(z.unknown()).default({}),
  styles: z.record(z.unknown()).default({}),
  isVisible: z.boolean().optional().default(true),
  isLocked: z.boolean().optional().default(false),
});

const sectionSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).optional().default(0),
  styles: z.record(z.unknown()).default({}),
  isVisible: z.boolean().optional().default(true),
  isLocked: z.boolean().optional().default(false),
  blocks: z.array(blockSchema).default([]),
});

const themeSchema = z.object({
  mode: z.enum(["LIGHT", "DARK", "CUSTOM"]).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  surfaceColor: z.string().optional(),
  textColor: z.string().optional(),
  mutedColor: z.string().optional(),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  fontMono: z.string().optional(),
  borderRadius: z.string().optional(),
}).optional();

export const importPortfolioSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().max(300).optional().default(""),
  theme: themeSchema,
  sections: z.array(sectionSchema).min(0).max(30),
});

export type ImportPortfolioData = z.infer<typeof importPortfolioSchema>;
