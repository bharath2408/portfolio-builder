import {
  successResponse,
  notFoundResponse,
  noContentResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// GET /api/components/:id — get a single component with full data
export const GET = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const component = await db.component.findFirst({
    where: { id, userId: user.id },
  });
  if (!component) return notFoundResponse("Component");

  return successResponse(component);
});

// PATCH /api/components/:id — update component (partial)
export const PATCH = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await db.component.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFoundResponse("Component");

  const updated = await db.component.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.masterData !== undefined && { masterData: body.masterData }),
      ...(body.variants !== undefined && { variants: body.variants }),
    },
  });

  return successResponse(updated);
});

// DELETE /api/components/:id — delete a component
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const existing = await db.component.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFoundResponse("Component");

  await db.component.delete({ where: { id } });
  return noContentResponse();
});
