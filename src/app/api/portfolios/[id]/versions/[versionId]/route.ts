import { successResponse, unauthorizedResponse, notFoundResponse, internalErrorResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/portfolios/:id/versions/:versionId — get full version data
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    const { id, versionId } = await params;

    const portfolio = await db.portfolio.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, title: true, slug: true },
    });
    if (!portfolio) return unauthorizedResponse();

    const version = await db.portfolioVersion.findUnique({
      where: { id: versionId },
      select: { id: true, label: true, data: true, createdAt: true },
    });
    if (!version) return notFoundResponse("Version");

    return successResponse({ ...version, portfolioTitle: portfolio.title });
  } catch (error) {
    console.error("[GET /api/portfolios/[id]/versions/[versionId]]", error);
    return internalErrorResponse();
  }
}
