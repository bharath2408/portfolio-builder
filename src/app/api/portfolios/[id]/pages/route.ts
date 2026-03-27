import { successResponse, notFoundResponse, withErrorHandler, requireAuth } from "@/lib/api/response";
import { db } from "@/lib/db";

export const GET = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: { id: true },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const pages = await db.page.findMany({
    where: { portfolioId: id },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { sections: true } } },
  });

  return successResponse(pages);
});

export const POST = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const body = await req.json();

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const count = await db.page.count({ where: { portfolioId: id } });

  const page = await db.page.create({
    data: {
      portfolioId: id as string,
      title: body.title ?? "New Page",
      slug: body.slug ?? `page-${count + 1}`,
      sortOrder: count,
      isDefault: count === 0,
    },
  });

  return successResponse(page);
});
