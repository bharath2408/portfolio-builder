import {
  successResponse,
  noContentResponse,
  notFoundResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// PATCH /api/webhooks/:id — update a webhook
export const PATCH = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const body = await req.json();

  const webhook = await db.formWebhook.findFirst({
    where: { id },
    include: { portfolio: { select: { userId: true } } },
  });
  if (!webhook || webhook.portfolio.userId !== user.id) {
    return notFoundResponse("Webhook");
  }

  const updated = await db.formWebhook.update({
    where: { id },
    data: {
      ...(body.url !== undefined && { url: body.url }),
      ...(body.events !== undefined && { events: body.events }),
      ...(body.secret !== undefined && { secret: body.secret }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return successResponse(updated);
});

// DELETE /api/webhooks/:id — delete a webhook
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const webhook = await db.formWebhook.findFirst({
    where: { id },
    include: { portfolio: { select: { userId: true } } },
  });
  if (!webhook || webhook.portfolio.userId !== user.id) {
    return notFoundResponse("Webhook");
  }

  await db.formWebhook.delete({ where: { id } });
  return noContentResponse();
});
