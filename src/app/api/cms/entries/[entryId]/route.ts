import {
  successResponse,
  notFoundResponse,
  noContentResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// GET /api/cms/entries/:entryId — get a single entry
export const GET = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { entryId } = await ctx.params;

  const entry = await db.contentEntry.findFirst({
    where: { id: entryId },
    include: { contentType: true },
  });
  if (!entry) return notFoundResponse("Entry");

  // Verify ownership through content type
  const contentType = await db.contentType.findFirst({
    where: { id: entry.contentTypeId, userId: user.id },
  });
  if (!contentType) return notFoundResponse("Entry");

  return successResponse(entry);
});

// PATCH /api/cms/entries/:entryId — update an entry
export const PATCH = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { entryId } = await ctx.params;
  const body = await req.json();

  const entry = await db.contentEntry.findFirst({
    where: { id: entryId },
    include: { contentType: true },
  });
  if (!entry) return notFoundResponse("Entry");

  // Verify ownership through content type
  const contentType = await db.contentType.findFirst({
    where: { id: entry.contentTypeId, userId: user.id },
  });
  if (!contentType) return notFoundResponse("Entry");

  const updated = await db.contentEntry.update({
    where: { id: entryId },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.slug && { slug: body.slug }),
      ...(body.data && { data: body.data }),
      ...(body.status && {
        status: body.status,
        publishedAt:
          body.status === "PUBLISHED" ? new Date() : entry.publishedAt,
      }),
    },
  });

  return successResponse(updated);
});

// DELETE /api/cms/entries/:entryId — delete an entry
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { entryId } = await ctx.params;

  const entry = await db.contentEntry.findFirst({
    where: { id: entryId },
  });
  if (!entry) return notFoundResponse("Entry");

  // Verify ownership through content type
  const contentType = await db.contentType.findFirst({
    where: { id: entry.contentTypeId, userId: user.id },
  });
  if (!contentType) return notFoundResponse("Entry");

  await db.contentEntry.delete({ where: { id: entryId } });
  return noContentResponse();
});
