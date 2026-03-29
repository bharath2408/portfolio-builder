import {
  successResponse,
  createdResponse,
  errorResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

const MAX_COMPONENTS_PER_PORTFOLIO = 50;

// GET /api/components?portfolioId=xxx — list components for a portfolio
export const GET = withErrorHandler(async (req) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get("portfolioId");

  if (!portfolioId) {
    return errorResponse("VALIDATION_ERROR", "portfolioId is required", 400);
  }

  // Verify portfolio ownership
  const portfolio = await db.portfolio.findFirst({
    where: { id: portfolioId, userId: user.id },
  });
  if (!portfolio) {
    return errorResponse("NOT_FOUND", "Portfolio not found", 404);
  }

  const components = await db.component.findMany({
    where: { portfolioId, userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(components);
});

// POST /api/components — create a new component
export const POST = withErrorHandler(async (req) => {
  const user = await requireAuth();
  const body = await req.json();
  const { portfolioId, name, sourceType, masterData, icon } = body;

  if (!portfolioId || !name || !sourceType || !masterData) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Missing required fields: portfolioId, name, sourceType, masterData",
      422,
    );
  }

  // Verify portfolio ownership
  const portfolio = await db.portfolio.findFirst({
    where: { id: portfolioId, userId: user.id },
  });
  if (!portfolio) {
    return errorResponse("NOT_FOUND", "Portfolio not found", 404);
  }

  // Check component count limit
  const count = await db.component.count({
    where: { portfolioId, userId: user.id },
  });
  if (count >= MAX_COMPONENTS_PER_PORTFOLIO) {
    return errorResponse(
      "CONFLICT",
      `Max ${MAX_COMPONENTS_PER_PORTFOLIO} components per portfolio`,
      409,
    );
  }

  const component = await db.component.create({
    data: {
      userId: user.id,
      portfolioId,
      name,
      sourceType,
      masterData,
      icon: icon ?? "Component",
      variants: [{ name: "Default", overrides: {} }],
    },
  });

  return createdResponse(component);
});
