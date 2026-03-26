import { successResponse, unauthorizedResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const count = await db.contactSubmission.count({
    where: {
      portfolio: { userId: session.user.id },
      isRead: false,
    },
  });

  return successResponse({ count });
}
