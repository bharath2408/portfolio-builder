import { successResponse, notFoundResponse, noContentResponse, withErrorHandler, requireAuth } from "@/lib/api/response";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const PATCH = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id, pageId } = await ctx.params;
  const body = await req.json();

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const updated = await db.page.update({
    where: { id: pageId },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.slug && { slug: body.slug }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });

  return successResponse(updated);
});

export const DELETE = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id, pageId } = await ctx.params;

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const page = await db.page.findFirst({ where: { id: pageId } });
  if (!page) return notFoundResponse("Page");
  if (page.isDefault) {
    return NextResponse.json({ error: "Cannot delete the default page" }, { status: 400 });
  }

  // Unassign sections from this page (move to default)
  await db.section.updateMany({
    where: { pageId },
    data: { pageId: null },
  });

  await db.page.delete({ where: { id: pageId } });
  return noContentResponse();
});
