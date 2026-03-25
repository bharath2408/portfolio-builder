import { z } from "zod";

import { successResponse, validationErrorResponse, internalErrorResponse, notFoundResponse } from "@/lib/api/response";
import { db } from "@/lib/db";

const contactSchema = z.object({
  portfolioId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  message: z.string().min(1, "Message is required").max(5000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const portfolio = await db.portfolio.findUnique({
      where: { id: parsed.data.portfolioId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!portfolio) return notFoundResponse("Portfolio");

    await db.contactSubmission.create({ data: parsed.data });

    return successResponse({ submitted: true });
  } catch (error) {
    console.error("[POST /api/public/contact]", error);
    return internalErrorResponse();
  }
}
