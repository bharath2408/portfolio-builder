import { NextResponse } from "next/server";

import { unauthorizedResponse, internalErrorResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/users/me/export
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
        updatedAt: true,
        portfolios: {
          include: {
            sections: {
              include: {
                blocks: {
                  orderBy: { sortOrder: "asc" },
                },
              },
              orderBy: { sortOrder: "asc" },
            },
            theme: true,
          },
        },
      },
    });

    if (!user) return unauthorizedResponse();

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      user,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="foliocraft-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/users/me/export]", error);
    return internalErrorResponse();
  }
}
