import { successResponse, unauthorizedResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const trashed = await db.portfolio.findMany({
    where: { userId: session.user.id, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      deletedAt: true,
      updatedAt: true,
      _count: { select: { sections: true } },
    },
  });

  return successResponse(trashed);
}
