import {
  successResponse,
  createdResponse,
  errorResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

const MAX_ASSETS_PER_USER = 100;

// GET /api/assets — list all assets for authenticated user
export const GET = withErrorHandler(async () => {
  const user = await requireAuth();

  const assets = await db.asset.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(assets);
});

// POST /api/assets — create a new asset record
export const POST = withErrorHandler(async (req) => {
  const user = await requireAuth();
  const body = await req.json();

  const { name, url, thumbnailUrl, type, size, width, height } = body;

  // Validate required fields
  if (!name || !url || !type) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Missing required fields: name, url, type",
      422,
    );
  }

  // Check asset count limit
  const count = await db.asset.count({
    where: { userId: user.id },
  });
  if (count >= MAX_ASSETS_PER_USER) {
    return errorResponse(
      "CONFLICT",
      `You can upload a maximum of ${MAX_ASSETS_PER_USER} assets`,
      409,
    );
  }

  const asset = await db.asset.create({
    data: {
      userId: user.id,
      name,
      url,
      thumbnailUrl: thumbnailUrl ?? null,
      type,
      size: size ?? 0,
      width: width ?? null,
      height: height ?? null,
    },
  });

  return createdResponse(asset);
});
