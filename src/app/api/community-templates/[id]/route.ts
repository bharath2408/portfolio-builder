import {
  requireAuth,
  successResponse,
  notFoundResponse,
  forbiddenResponse,
  withErrorHandler,
} from "@/lib/api/response";
import { db } from "@/lib/db";

export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const template = await db.communityTemplate.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!template) return notFoundResponse("Template");
  if (template.userId !== user.id) return forbiddenResponse("Not your template");

  await db.communityTemplate.delete({ where: { id } });

  return successResponse({ deleted: true });
});
