import { successResponse, unauthorizedResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const submissions = await db.contactSubmission.findMany({
    where: {
      portfolio: { userId: session.user.id },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      portfolio: { select: { title: true, id: true } },
    },
  });

  return successResponse(submissions);
}
