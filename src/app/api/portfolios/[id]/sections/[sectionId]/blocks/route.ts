import { db } from "@/lib/db";
import {
  successResponse, createdResponse, notFoundResponse,
  withErrorHandler, requireAuth,
} from "@/lib/api/response";

// GET /api/portfolios/:id/sections/:sectionId/blocks
export const GET = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id, sectionId } = await ctx.params;

  const section = await db.section.findFirst({
    where: { id: sectionId, portfolioId: id, portfolio: { userId: user.id } },
    include: { blocks: { orderBy: { sortOrder: "asc" } } },
  });

  if (!section) return notFoundResponse("Section");

  return successResponse(section.blocks);
});

// POST /api/portfolios/:id/sections/:sectionId/blocks
export const POST = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id, sectionId } = await ctx.params;
  const body = await req.json();

  // Verify ownership
  const section = await db.section.findFirst({
    where: { id: sectionId, portfolioId: id, portfolio: { userId: user.id } },
  });

  if (!section) return notFoundResponse("Section");

  const block = await db.block.create({
    data: {
      sectionId: sectionId as string,
      type: body.type,
      sortOrder: body.sortOrder ?? 0,
      content: body.content ?? {},
      styles: body.styles ?? {},
    },
  });

  return createdResponse(block);
});
