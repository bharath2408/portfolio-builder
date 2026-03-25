import { db } from "@/lib/db";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
  requireAuth,
} from "@/lib/api/response";

const createSchema = z.object({
  portfolioId: z.string().cuid(),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  category: z.enum(["DEVELOPER", "DESIGNER", "WRITER", "OTHER"]),
  isDark: z.boolean(),
  tags: z
    .array(z.string().max(20).regex(/^[a-z0-9-]+$/))
    .max(5)
    .default([]),
});

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { portfolioId, name, description, category, isDark, tags } = parsed.data;

    const portfolio = await db.portfolio.findFirst({
      where: { id: portfolioId, userId: user.id },
      select: { status: true, ogImageUrl: true },
    });

    if (!portfolio) {
      return forbiddenResponse("Portfolio not found or access denied");
    }

    if (portfolio.status !== "PUBLISHED") {
      return errorResponse("BAD_REQUEST", "Portfolio must be published before sharing as a template", 400);
    }

    const template = await db.communityTemplate.upsert({
      where: { portfolioId },
      create: {
        portfolioId,
        userId: user.id,
        name,
        description,
        category,
        isDark,
        tags,
        thumbnail: portfolio.ogImageUrl ?? null,
      },
      update: { name, description, category, isDark, tags, thumbnail: portfolio.ogImageUrl ?? null },
    });

    return successResponse(template);
  } catch (error) {
    console.error("[community-templates POST]", error);
    return internalErrorResponse();
  }
}
