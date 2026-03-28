import {
  successResponse,
  noContentResponse,
  notFoundResponse,
  errorResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// DELETE /api/assets/:id — delete an asset
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const asset = await db.asset.findFirst({
    where: { id, userId: user.id },
  });
  if (!asset) return notFoundResponse("Asset");

  await db.asset.delete({ where: { id } });
  return noContentResponse();
});

// PATCH /api/assets/:id — rename an asset
export const PATCH = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const body = await req.json();

  if (!body.name) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Missing required field: name",
      422,
    );
  }

  const asset = await db.asset.findFirst({
    where: { id, userId: user.id },
  });
  if (!asset) return notFoundResponse("Asset");

  const updated = await db.asset.update({
    where: { id },
    data: { name: body.name },
  });

  return successResponse(updated);
});
