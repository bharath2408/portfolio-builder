import bcrypt from "bcryptjs";

import {
  successResponse,
  validationErrorResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { name, email, password } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return conflictResponse("An account with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const baseUsername = email.split("@")[0]?.replace(/[^a-z0-9]/gi, "") ?? "user";
    let username = baseUsername;
    let counter = 1;
    while (await db.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
      },
    });

    return successResponse(user, 201);
  } catch (error) {
    console.error("[Register Error]", error);
    return internalErrorResponse();
  }
}
