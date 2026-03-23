import bcrypt from "bcryptjs";

import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  errorResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validations/auth";

// POST /api/users/me/password
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return errorResponse(
        "NO_PASSWORD",
        "Your account uses social login. Set a password by using the forgot password flow.",
        400,
      );
    }

    const isValid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password,
    );
    if (!isValid) {
      return errorResponse(
        "INVALID_PASSWORD",
        "Current password is incorrect",
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return successResponse({ message: "Password changed successfully" });
  } catch (error) {
    console.error("[POST /api/users/me/password]", error);
    return internalErrorResponse();
  }
}
