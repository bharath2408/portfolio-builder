import {
  successResponse, notFoundResponse, noContentResponse,
  withErrorHandler, requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// GET /api/portfolios/:id
export const GET = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { blocks: { orderBy: { sortOrder: "asc" } } },
      },
      pages: { orderBy: { sortOrder: "asc" } },
      theme: true,
      template: true,
      customFonts: true,
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  if (!portfolio) return notFoundResponse("Portfolio");
  return successResponse(portfolio);
});

// PATCH /api/portfolios/:id
export const PATCH = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const body = await req.json();

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const updated = await db.portfolio.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.slug && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status && { status: body.status }),
      ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      ...(body.templateId !== undefined && { templateId: body.templateId }),
      ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle || null }),
      ...(body.seoDescription !== undefined && { seoDescription: body.seoDescription || null }),
      ...(body.ogImageUrl !== undefined && { ogImageUrl: body.ogImageUrl || null }),
      ...(body.accessPassword !== undefined && { accessPassword: body.accessPassword || null }),
    },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { blocks: { orderBy: { sortOrder: "asc" } } },
      },
      pages: { orderBy: { sortOrder: "asc" } },
      theme: true,
      template: true,
      customFonts: true,
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  return successResponse(updated);
});

// DELETE /api/portfolios/:id
export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  await db.portfolio.update({ where: { id }, data: { deletedAt: new Date() } });
  return noContentResponse();
});
