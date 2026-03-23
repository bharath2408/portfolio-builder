import { successResponse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    const { id } = await params;

    const portfolio = await db.portfolio.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!portfolio) return unauthorizedResponse();

    const submissions = await db.contactSubmission.findMany({
      where: { portfolioId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return successResponse(submissions);
  } catch (error) {
    console.error("[GET /api/portfolios/[id]/submissions]", error);
    return internalErrorResponse();
  }
}
