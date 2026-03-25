import {
  successResponse, notFoundResponse, noContentResponse,
  withErrorHandler, requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// PATCH /api/portfolios/:id/sections/:sectionId/blocks/:blockId
export const PATCH = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id, sectionId, blockId } = await ctx.params;
  const body = await req.json();

  const block = await db.block.findFirst({
    where: {
      id: blockId,
      sectionId,
      section: { portfolioId: id, portfolio: { userId: user.id } },
    },
  });

  if (!block) return notFoundResponse("Block");

  const updated = await db.block.update({
    where: { id: blockId },
    data: {
      ...(body.content !== undefined && { content: body.content }),
      ...(body.styles !== undefined && { styles: body.styles }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
      ...(body.isLocked !== undefined && { isLocked: body.isLocked }),
    },
  });

  return successResponse(updated);
});

// DELETE /api/portfolios/:id/sections/:sectionId/blocks/:blockId
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id, sectionId, blockId } = await ctx.params;

  const block = await db.block.findFirst({
    where: {
      id: blockId,
      sectionId,
      section: { portfolioId: id, portfolio: { userId: user.id } },
    },
  });

  if (!block) return notFoundResponse("Block");

  await db.block.delete({ where: { id: blockId } });

  return noContentResponse();
});
