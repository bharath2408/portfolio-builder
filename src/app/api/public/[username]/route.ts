import {
  successResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ username: string }>;
}

// GET /api/public/[username] — public portfolio data
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { username } = await context.params;

    const user = await db.user.findUnique({
      where: { username },
      select: { id: true, name: true, username: true, image: true, bio: true },
    });

    if (!user) return notFoundResponse("User");

    // Find default or first published portfolio
    const portfolio = await db.portfolio.findFirst({
      where: {
        userId: user.id,
        status: "PUBLISHED",
        deletedAt: null,
      },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      include: {
        sections: {
          where: { isVisible: true },
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
        theme: true,
        template: true,
      },
    });

    if (!portfolio) return notFoundResponse("Portfolio");

    // Increment view count
    await db.portfolio.update({
      where: { id: portfolio.id },
      data: { viewCount: { increment: 1 } },
    });

    return successResponse({
      user,
      portfolio,
    });
  } catch (error) {
    console.error("[GET /api/public/[username]]", error);
    return internalErrorResponse();
  }
}
