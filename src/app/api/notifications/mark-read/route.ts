import { successResponse, unauthorizedResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const { ids } = body as { ids?: string[] };

  if (ids && ids.length > 0) {
    // Mark specific submissions as read
    await db.contactSubmission.updateMany({
      where: {
        id: { in: ids },
        portfolio: { userId: session.user.id },
      },
      data: { isRead: true },
    });
  } else {
    // Mark all as read
    await db.contactSubmission.updateMany({
      where: {
        portfolio: { userId: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  return successResponse({ ok: true });
}
