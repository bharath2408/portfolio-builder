import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isDarkParam = searchParams.get("isDark");
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") ?? "most_used";
    const search = searchParams.get("search") ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? 12), 24);
    const cursor = searchParams.get("cursor") ?? undefined;

    const cleanSearch = search.replace(/[^a-zA-Z0-9\s-]/g, "").trim();

    const where: Prisma.CommunityTemplateWhereInput = {};
    if (category) where.category = category as Prisma.EnumCommunityTemplateCategoryFilter;
    if (isDarkParam !== null) where.isDark = isDarkParam === "true";
    if (tag) where.tags = { has: tag };
    if (cleanSearch.length >= 2) {
      where.OR = [
        { name: { contains: cleanSearch, mode: "insensitive" } },
        { description: { contains: cleanSearch, mode: "insensitive" } },
      ];
    }

    const templates = await db.communityTemplate.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: sort === "newest" ? { createdAt: "desc" } : { useCount: "desc" },
      include: { user: { select: { username: true, name: true } } },
    });

    const hasNext = templates.length > limit;
    const items = hasNext ? templates.slice(0, limit) : templates;
    const lastItem = items[items.length - 1];
    const nextCursor = hasNext && lastItem ? lastItem.id : null;

    return successResponse({ templates: items, nextCursor });
  } catch (error) {
    console.error("[community-templates GET]", error);
    return internalErrorResponse();
  }
}

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
