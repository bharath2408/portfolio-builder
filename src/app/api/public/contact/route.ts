import { z } from "zod";

import { successResponse, validationErrorResponse, internalErrorResponse, notFoundResponse, rateLimitResponse } from "@/lib/api/response";
import { db } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email/resend";
import { checkRateLimit, isHoneypotTriggered } from "@/lib/form/rate-limiter";

const contactSchema = z.object({
  portfolioId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  message: z.string().min(1, "Message is required").max(5000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Spam: honeypot check — silent reject so bots think it succeeded
    if (isHoneypotTriggered(body)) {
      return successResponse({ submitted: true });
    }

    // Spam: rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return rateLimitResponse();
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const portfolio = await db.portfolio.findUnique({
      where: { id: parsed.data.portfolioId, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        user: { select: { email: true, emailNotifications: true } },
      },
    });
    if (!portfolio) return notFoundResponse("Portfolio");

    await db.contactSubmission.create({ data: parsed.data });

    // Fire-and-forget: send notification email to portfolio owner
    if (portfolio.user.emailNotifications && portfolio.user.email) {
      sendNotificationEmail(
        portfolio.user.email,
        parsed.data.name,
        parsed.data.email,
        { message: parsed.data.message },
        portfolio.title,
      ).catch(() => {});
    }

    return successResponse({ submitted: true });
  } catch (error) {
    console.error("[POST /api/public/contact]", error);
    return internalErrorResponse();
  }
}
