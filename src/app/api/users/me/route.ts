import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validations/auth";

// GET /api/users/me
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        bio: true,
        role: true,
        theme: true,
        createdAt: true,
        _count: { select: { portfolios: true } },
      },
    });

    return successResponse(user);
  } catch (error) {
    console.error("[GET /api/users/me]", error);
    return internalErrorResponse();
  }
}

// PATCH /api/users/me
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    // Check username uniqueness
    if (parsed.data.username) {
      const existing = await db.user.findUnique({
        where: { username: parsed.data.username },
      });
      if (existing && existing.id !== session.user.id) {
        return conflictResponse("Username is already taken");
      }
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        bio: true,
        theme: true,
      },
    });

    return successResponse(user);
  } catch (error) {
    console.error("[PATCH /api/users/me]", error);
    return internalErrorResponse();
  }
}
