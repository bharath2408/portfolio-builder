import { NextResponse } from "next/server";

import {
  successResponse,
  notFoundResponse,
  errorResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

const MAX_ENTRIES_PER_TYPE = 100;

// GET /api/cms/types/:typeId/entries — list entries for a content type
export const GET = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const contentType = await db.contentType.findFirst({
    where: { id: typeId, userId: user.id },
  });
  if (!contentType) return notFoundResponse("Content type");

  const entries = await db.contentEntry.findMany({
    where: {
      contentTypeId: typeId,
      ...(status && { status }),
      ...(search && {
        title: { contains: search, mode: "insensitive" as const },
      }),
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(entries);
});

// POST /api/cms/types/:typeId/entries — create a new entry
export const POST = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;
  const body = await req.json();

  const contentType = await db.contentType.findFirst({
    where: { id: typeId, userId: user.id },
  });
  if (!contentType) return notFoundResponse("Content type");

  const entryCount = await db.contentEntry.count({
    where: { contentTypeId: typeId },
  });
  if (entryCount >= MAX_ENTRIES_PER_TYPE) {
    return errorResponse(
      "CONFLICT",
      `Max ${MAX_ENTRIES_PER_TYPE} entries per collection`,
      409,
    );
  }

  const entry = await db.contentEntry.create({
    data: {
      contentTypeId: typeId as string,
      portfolioId: contentType.portfolioId,
      title: body.title ?? "Untitled",
      slug: body.slug ?? crypto.randomUUID().slice(0, 8),
      data: body.data ?? {},
      status: body.status ?? "DRAFT",
      publishedAt: body.status === "PUBLISHED" ? new Date() : null,
    },
  });

  return NextResponse.json(
    { success: true, data: entry },
    { status: 201 },
  );
});
