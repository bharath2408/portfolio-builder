import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import {
  errorResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";
import { CMS_PRESETS } from "@/components/cms/cms-presets";

// POST /api/cms/init — initialize preset collections for a portfolio (idempotent)
export const POST = withErrorHandler(async (req) => {
  const user = await requireAuth();
  const { portfolioId } = await req.json();

  if (!portfolioId) {
    return errorResponse("VALIDATION_ERROR", "portfolioId is required", 400);
  }

  const portfolio = await db.portfolio.findFirst({
    where: { id: portfolioId, userId: user.id },
  });
  if (!portfolio) {
    return errorResponse("NOT_FOUND", "Portfolio not found", 404);
  }

  // Check existing presets for idempotency
  const existing = await db.contentType.findMany({
    where: { portfolioId, isPreset: true },
  });
  const existingSlugs = new Set(existing.map((t) => t.slug));

  const created = [];
  for (const preset of CMS_PRESETS) {
    if (existingSlugs.has(preset.slug)) continue;
    const ct = await db.contentType.create({
      data: {
        userId: user.id,
        portfolioId,
        name: preset.name,
        slug: preset.slug,
        icon: preset.icon,
        fields: preset.fields as unknown as Prisma.InputJsonValue,
        isPreset: true,
      },
      include: { _count: { select: { entries: true } } },
    });
    created.push(ct);
  }

  return NextResponse.json(
    { success: true, data: created },
    { status: 201 },
  );
});
