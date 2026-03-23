import { successResponse, internalErrorResponse } from "@/lib/api/response";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const templates = await db.template.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        config: true,
        isPremium: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(templates);
  } catch (error) {
    console.error("[GET /api/templates]", error);
    return internalErrorResponse();
  }
}
