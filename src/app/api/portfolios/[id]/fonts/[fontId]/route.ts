import {
  noContentResponse,
  notFoundResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// DELETE /api/portfolios/:id/fonts/:fontId — delete a custom font
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id, fontId } = await ctx.params;

  const font = await db.customFont.findFirst({
    where: { id: fontId, userId: user.id, portfolioId: id },
  });
  if (!font) return notFoundResponse("Custom font");

  await db.customFont.delete({ where: { id: fontId } });

  return noContentResponse();
});
