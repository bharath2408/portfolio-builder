import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  conflictResponse,
  internalErrorResponse,
  noContentResponse,
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
        emailNotifications: true,
        createdAt: true,
        password: true,
        _count: { select: { portfolios: true } },
        portfolios: {
          select: { id: true, title: true, isDefault: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) return unauthorizedResponse();

    // Don't send password hash, just whether they have one (credentials user)
    const { password, ...rest } = user;
    return successResponse({ ...rest, hasPassword: !!password });
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

    // If setting a default portfolio, verify ownership
    if (parsed.data.defaultPortfolioId) {
      const portfolio = await db.portfolio.findFirst({
        where: {
          id: parsed.data.defaultPortfolioId,
          userId: session.user.id,
        },
      });
      if (!portfolio) {
        return conflictResponse("Portfolio not found");
      }

      // Unset previous default and set new one
      await db.portfolio.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
      await db.portfolio.update({
        where: { id: parsed.data.defaultPortfolioId },
        data: { isDefault: true },
      });
    }

    // Build update data (exclude defaultPortfolioId since we handle it above)
    const { defaultPortfolioId: _defaultPortfolioId, ...updateData } = parsed.data;

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        bio: true,
        theme: true,
        emailNotifications: true,
      },
    });

    return successResponse(user);
  } catch (error) {
    console.error("[PATCH /api/users/me]", error);
    return internalErrorResponse();
  }
}

// DELETE /api/users/me
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    // Cascade delete handles portfolios, sections, blocks, etc.
    await db.user.delete({
      where: { id: session.user.id },
    });

    return noContentResponse();
  } catch (error) {
    console.error("[DELETE /api/users/me]", error);
    return internalErrorResponse();
  }
}
