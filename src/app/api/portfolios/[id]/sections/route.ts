import {
  successResponse, createdResponse, notFoundResponse, noContentResponse,
  withErrorHandler, requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// GET /api/portfolios/:id/sections
export const GET = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { blocks: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!portfolio) return notFoundResponse("Portfolio");
  return successResponse(portfolio.sections);
});

// POST /api/portfolios/:id/sections
export const POST = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const body = await req.json();

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const section = await db.section.create({
    data: {
      portfolioId: id as string,
      name: body.name ?? "New Section",
      sortOrder: body.sortOrder ?? 0,
      styles: body.styles ?? {},
    },
    include: { blocks: true },
  });

  return createdResponse(section);
});

// PUT /api/portfolios/:id/sections (reorder)
export const PUT = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const body = await req.json();

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  if (body.sections && Array.isArray(body.sections)) {
    await Promise.all(
      body.sections.map((item: { id: string; sortOrder: number }) =>
        db.section.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }

  return successResponse({ reordered: true });
});

// DELETE /api/portfolios/:id/sections?sectionId=xxx
export const DELETE = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");

  if (!sectionId) return notFoundResponse("Section ID required");

  const section = await db.section.findFirst({
    where: { id: sectionId, portfolioId: id, portfolio: { userId: user.id } },
  });
  if (!section) return notFoundResponse("Section");

  await db.section.delete({ where: { id: sectionId } });
  return noContentResponse();
});
