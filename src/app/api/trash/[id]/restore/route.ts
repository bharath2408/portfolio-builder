import { successResponse, unauthorizedResponse, notFoundResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const { id } = await params;

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: session.user.id, deletedAt: { not: null } },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  await db.portfolio.update({
    where: { id },
    data: { deletedAt: null },
  });

  return successResponse({ restored: true });
}
