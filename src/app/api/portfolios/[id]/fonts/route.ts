import {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

const MAX_FONTS_PER_PORTFOLIO = 5;

// GET /api/portfolios/:id/fonts — list all custom fonts for a portfolio
export const GET = withErrorHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const fonts = await db.customFont.findMany({
    where: { portfolioId: id, userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(fonts);
});

// POST /api/portfolios/:id/fonts — create a new custom font
export const POST = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const body = await req.json();
  const { name, url, format } = body;

  if (!name || !url || !format) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Missing required fields: name, url, format",
      422,
    );
  }

  // Check font count limit per portfolio
  const count = await db.customFont.count({
    where: { portfolioId: id },
  });
  if (count >= MAX_FONTS_PER_PORTFOLIO) {
    return errorResponse(
      "CONFLICT",
      `You can add a maximum of ${MAX_FONTS_PER_PORTFOLIO} custom fonts per portfolio`,
      409,
    );
  }

  const font = await db.customFont.create({
    data: {
      userId: user.id,
      portfolioId: portfolio.id,
      name,
      url,
      format,
    },
  });

  return createdResponse(font);
});
