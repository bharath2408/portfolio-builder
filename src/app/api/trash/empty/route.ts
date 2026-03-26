import { successResponse, unauthorizedResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  await db.portfolio.deleteMany({
    where: { userId: session.user.id, deletedAt: { not: null } },
  });

  return successResponse({ emptied: true });
}
