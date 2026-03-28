import {
  successResponse,
  notFoundResponse,
  noContentResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// GET /api/cms/types/:typeId — get a single content type
export const GET = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;

  const contentType = await db.contentType.findFirst({
    where: { id: typeId, userId: user.id },
    include: { _count: { select: { entries: true } } },
  });
  if (!contentType) return notFoundResponse("Content type");

  return successResponse(contentType);
});

// PATCH /api/cms/types/:typeId — update a content type
export const PATCH = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;
  const body = await req.json();

  const existing = await db.contentType.findFirst({
    where: { id: typeId, userId: user.id },
  });
  if (!existing) return notFoundResponse("Content type");

  const updated = await db.contentType.update({
    where: { id: typeId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.slug && { slug: body.slug }),
      ...(body.icon && { icon: body.icon }),
      ...(body.fields && { fields: body.fields }),
    },
    include: { _count: { select: { entries: true } } },
  });

  return successResponse(updated);
});

// DELETE /api/cms/types/:typeId — delete a content type and all its entries
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;

  const existing = await db.contentType.findFirst({
    where: { id: typeId, userId: user.id },
  });
  if (!existing) return notFoundResponse("Content type");

  await db.contentType.delete({ where: { id: typeId } });
  return noContentResponse();
});
