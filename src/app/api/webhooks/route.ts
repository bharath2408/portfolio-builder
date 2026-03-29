import {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

const MAX_WEBHOOKS_PER_PORTFOLIO = 5;

// GET /api/webhooks?portfolioId=xxx — list webhooks for a portfolio
export const GET = withErrorHandler(async (req) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get("portfolioId");

  if (!portfolioId) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Missing required query param: portfolioId",
      422,
    );
  }

  const portfolio = await db.portfolio.findFirst({
    where: { id: portfolioId, userId: user.id },
    select: { id: true },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const webhooks = await db.formWebhook.findMany({
    where: { portfolioId },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(webhooks);
});

// POST /api/webhooks — create a webhook
export const POST = withErrorHandler(async (req) => {
  const user = await requireAuth();
  const body = await req.json();

  const { portfolioId, url, events, secret } = body;

  if (!portfolioId || !url || !events || !Array.isArray(events) || events.length === 0) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Missing required fields: portfolioId, url, events",
      422,
    );
  }

  const portfolio = await db.portfolio.findFirst({
    where: { id: portfolioId, userId: user.id },
    select: { id: true },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const count = await db.formWebhook.count({
    where: { portfolioId },
  });
  if (count >= MAX_WEBHOOKS_PER_PORTFOLIO) {
    return errorResponse(
      "CONFLICT",
      `You can create a maximum of ${MAX_WEBHOOKS_PER_PORTFOLIO} webhooks per portfolio`,
      409,
    );
  }

  const webhook = await db.formWebhook.create({
    data: {
      portfolioId,
      url,
      events,
      secret: secret ?? null,
    },
  });

  return createdResponse(webhook);
});
