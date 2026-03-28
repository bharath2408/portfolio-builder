import { NextResponse } from "next/server";
import {
  successResponse,
  errorResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

const MAX_TYPES_PER_PORTFOLIO = 10;
const MAX_FIELDS_PER_TYPE = 20;

// GET /api/cms/types?portfolioId=xxx — list content types for a portfolio
export const GET = withErrorHandler(async (req) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get("portfolioId");

  if (!portfolioId) {
    return errorResponse("VALIDATION_ERROR", "portfolioId is required", 400);
  }

  const types = await db.contentType.findMany({
    where: { portfolioId, userId: user.id },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: "asc" },
  });

  return successResponse(types);
});

// POST /api/cms/types — create a new content type
export const POST = withErrorHandler(async (req) => {
  const user = await requireAuth();
  const body = await req.json();
  const { portfolioId, name, slug, icon, fields, isPreset } = body;

  if (!portfolioId || !name || !slug || !fields) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Missing required fields: portfolioId, name, slug, fields",
      422,
    );
  }

  if (Array.isArray(fields) && fields.length > MAX_FIELDS_PER_TYPE) {
    return errorResponse(
      "VALIDATION_ERROR",
      `Max ${MAX_FIELDS_PER_TYPE} fields per content type`,
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

  // Check type count limit
  const count = await db.contentType.count({
    where: { portfolioId, userId: user.id },
  });
  if (count >= MAX_TYPES_PER_PORTFOLIO) {
    return errorResponse(
      "CONFLICT",
      `Max ${MAX_TYPES_PER_PORTFOLIO} content types per portfolio`,
      409,
    );
  }

  const contentType = await db.contentType.create({
    data: {
      userId: user.id,
      portfolioId,
      name,
      slug,
      icon: icon ?? "FileText",
      fields: fields ?? [],
      isPreset: isPreset ?? false,
    },
    include: { _count: { select: { entries: true } } },
  });

  return NextResponse.json(
    { success: true, data: contentType },
    { status: 201 },
  );
});
