import { successResponse, unauthorizedResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/user/editor-preferences
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { editorPreferences: true },
  });

  return successResponse(user?.editorPreferences ?? {});
}

// PUT /api/user/editor-preferences
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const prefs = await request.json();

  await db.user.update({
    where: { id: session.user.id },
    data: { editorPreferences: prefs },
  });

  return successResponse({ saved: true });
}
