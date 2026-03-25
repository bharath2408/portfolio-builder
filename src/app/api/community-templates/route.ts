import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";
import { generateOgImageBuffer } from "@/lib/server/og-image";

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
    const rawTag = searchParams.get("tag");
    const tag = rawTag && /^[a-z0-9-]{1,20}$/.test(rawTag) ? rawTag : null;
    const rawSort = searchParams.get("sort");
    const sort: "most_used" | "newest" =
      rawSort === "most_used" || rawSort === "newest" ? rawSort : "most_used";
    const search = searchParams.get("search") ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? 12), 24) || 12;
    const cursor = searchParams.get("cursor") ?? undefined;

    const mine = searchParams.get("mine") === "true";
    const cleanSearch = search.replace(/[^a-zA-Z0-9\s-]/g, "").trim();

    const VALID_CATEGORIES = ["DEVELOPER", "DESIGNER", "WRITER", "OTHER"];

    const where: Prisma.CommunityTemplateWhereInput = {};

    // "mine" filter — requires auth
    if (mine) {
      const { auth } = await import("@/lib/auth");
      const session = await auth();
      if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
      where.userId = session.user.id;
    }

    if (category && VALID_CATEGORIES.includes(category)) where.category = category as Prisma.EnumCommunityTemplateCategoryFilter;
    if (isDarkParam === "true" || isDarkParam === "false") where.isDark = isDarkParam === "true";
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
      include: {
        user: { select: { username: true, name: true } },
        portfolio: { select: { slug: true } },
      },
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
      select: {
        status: true,
        ogImageUrl: true,
        title: true,
        description: true,
        user: { select: { name: true, username: true, id: true, image: true } },
        theme: true,
        sections: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
          include: {
            blocks: {
              where: { isVisible: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!portfolio) {
      return forbiddenResponse("Portfolio not found or access denied");
    }

    if (portfolio.status !== "PUBLISHED") {
      return errorResponse("BAD_REQUEST", "Portfolio must be published before sharing as a template", 400);
    }

    // Generate and upload OG image if missing or pointing at the internal route
    let thumbnailUrl = portfolio.ogImageUrl ?? null;
    const needsGeneration = !thumbnailUrl || thumbnailUrl.startsWith("/api/");
    if (needsGeneration) {
      try {
        const buffer = await generateOgImageBuffer({
          title: portfolio.title,
          description: portfolio.description ?? null,
          userName: portfolio.user.name ?? "Portfolio",
          theme: portfolio.theme,
        });

        const base64 = Buffer.from(buffer).toString("base64");
        const form = new FormData();
        form.append("file", `data:image/png;base64,${base64}`);
        form.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "");

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: form },
        );
        const cloudData = await cloudRes.json() as { secure_url?: string };

        if (cloudData.secure_url) {
          thumbnailUrl = cloudData.secure_url;
          await db.portfolio.update({
            where: { id: portfolioId },
            data: { ogImageUrl: thumbnailUrl },
          });
        }
      } catch (err) {
        console.error("[community-templates POST] OG image generation failed:", err);
        thumbnailUrl = null;
      }
    }

    const snapshotData = {
      sections: portfolio.sections,
      theme: portfolio.theme,
      user: portfolio.user,
    };

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
        thumbnail: thumbnailUrl,
        snapshotData,
      },
      update: { name, description, category, isDark, tags, thumbnail: thumbnailUrl, snapshotData },
    });

    return successResponse(template);
  } catch (error) {
    console.error("[community-templates POST]", error);
    return internalErrorResponse();
  }
}
