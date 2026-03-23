import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateThemeSchema } from "@/lib/validations/portfolio";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/portfolios/[id]/theme
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id: portfolioId } = await context.params;

    const portfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
      select: { userId: true },
    });
    if (!portfolio) return notFoundResponse("Portfolio");
    if (portfolio.userId !== session.user.id) return forbiddenResponse();

    const body = await request.json();
    const parsed = updateThemeSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const theme = await db.theme.upsert({
      where: { portfolioId },
      update: parsed.data,
      create: {
        portfolioId,
        mode: parsed.data.mode ?? "DARK",
        primaryColor: parsed.data.primaryColor ?? "#6366f1",
        secondaryColor: parsed.data.secondaryColor ?? "#8b5cf6",
        accentColor: parsed.data.accentColor ?? "#06b6d4",
        backgroundColor: parsed.data.backgroundColor ?? "#0f172a",
        textColor: parsed.data.textColor ?? "#f8fafc",
        fontHeading: parsed.data.fontHeading ?? "Space Grotesk",
        fontBody: parsed.data.fontBody ?? "Inter",
        borderRadius: parsed.data.borderRadius ?? "0.5rem",
        ...parsed.data,
      },
    });

    return successResponse(theme);
  } catch (error) {
    console.error("[PATCH theme]", error);
    return internalErrorResponse();
  }
}
