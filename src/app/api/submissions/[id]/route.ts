import { successResponse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    const { id } = await params;

    const body = await _request.json();
    const { isRead } = body as { isRead?: boolean };

    // Verify ownership via portfolio
    const submission = await db.contactSubmission.findFirst({
      where: { id },
      include: { portfolio: { select: { userId: true } } },
    });
    if (!submission || submission.portfolio.userId !== session.user.id) {
      return unauthorizedResponse();
    }

    const updated = await db.contactSubmission.update({
      where: { id },
      data: { isRead: isRead ?? true },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("[PATCH /api/submissions/[id]]", error);
    return internalErrorResponse();
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    const { id } = await params;

    // Verify ownership via portfolio
    const submission = await db.contactSubmission.findFirst({
      where: { id },
      include: { portfolio: { select: { userId: true } } },
    });
    if (!submission || submission.portfolio.userId !== session.user.id) {
      return unauthorizedResponse();
    }

    await db.contactSubmission.delete({ where: { id } });

    return successResponse({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/submissions/[id]]", error);
    return internalErrorResponse();
  }
}
