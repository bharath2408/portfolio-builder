import { MAX_PORTFOLIOS_PER_USER } from "@/config/constants";
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
  unauthorizedResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { importPortfolioSchema } from "@/lib/validations/import";
import { createPortfolioSchema } from "@/lib/validations/portfolio";

// GET /api/portfolios — list user's portfolios
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const portfolios = await db.portfolio.findMany({
      where: { userId: session.user.id, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
        updatedAt: true,
        isDefault: true,
        template: { select: { name: true, thumbnail: true } },
        _count: { select: { sections: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return successResponse(portfolios);
  } catch (error) {
    console.error("[GET /api/portfolios]", error);
    return internalErrorResponse();
  }
}

// POST /api/portfolios — create new portfolio
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await request.json();
    const parsed = createPortfolioSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    // Check portfolio limit
    const count = await db.portfolio.count({
      where: { userId: session.user.id },
    });
    if (count >= MAX_PORTFOLIOS_PER_USER) {
      return conflictResponse(
        `You can create a maximum of ${MAX_PORTFOLIOS_PER_USER} portfolios`,
      );
    }

    // Check slug uniqueness for user
    const existingSlug = await db.portfolio.findUnique({
      where: {
        userId_slug: { userId: session.user.id, slug: parsed.data.slug },
      },
    });
    if (existingSlug) {
      return conflictResponse("You already have a portfolio with this slug");
    }

    const isFirst = count === 0;

    // ── Template mode ────────────────────────────────────────────
    if (parsed.data.templateId) {
      const template = await db.template.findUnique({
        where: { id: parsed.data.templateId, isActive: true },
      });

      if (!template) {
        return conflictResponse("Template not found");
      }

      const config = template.config as {
        theme?: Record<string, string>;
        sections?: Array<{
          name: string;
          sortOrder?: number;
          styles?: object;
          blocks?: Array<{ type: string; sortOrder?: number; content?: object; styles?: object }>;
        }>;
      };

      const portfolio = await db.$transaction(async (tx) => {
        const p = await tx.portfolio.create({
          data: {
            userId: session.user.id,
            title: parsed.data.title,
            slug: parsed.data.slug,
            description: parsed.data.description,
            templateId: template.id,
            isDefault: isFirst,
            theme: {
              create: {
                mode: (config.theme?.mode as "LIGHT" | "DARK" | "CUSTOM") ?? "DARK",
                primaryColor: config.theme?.primaryColor ?? "#6366f1",
                secondaryColor: config.theme?.secondaryColor ?? "#8b5cf6",
                accentColor: config.theme?.accentColor ?? "#06b6d4",
                backgroundColor: config.theme?.backgroundColor ?? "#0f172a",
                textColor: config.theme?.textColor ?? "#f8fafc",
                fontHeading: config.theme?.fontHeading ?? "Outfit",
                fontBody: config.theme?.fontBody ?? "DM Sans",
                borderRadius: config.theme?.borderRadius ?? "0.5rem",
              },
            },
          },
        });

        for (const section of config.sections ?? []) {
          const s = await tx.section.create({
            data: {
              portfolioId: p.id,
              name: section.name,
              sortOrder: section.sortOrder ?? 0,
              styles: (section.styles ?? {}) as object,
            },
          });

          const blocks = section.blocks ?? [];
          if (blocks.length > 0) {
            await tx.block.createMany({
              data: blocks.map((block) => ({
                sectionId: s.id,
                type: block.type,
                sortOrder: block.sortOrder ?? 0,
                content: (block.content ?? {}) as object,
                styles: (block.styles ?? {}) as object,
              })),
            });
          }
        }

        return tx.portfolio.findUnique({
          where: { id: p.id },
          select: {
            id: true, title: true, slug: true, status: true,
            viewCount: true, updatedAt: true, isDefault: true,
            template: { select: { name: true, thumbnail: true } },
            _count: { select: { sections: true } },
          },
        });
      });

      return createdResponse(portfolio);
    }

    // ── Import mode ──────────────────────────────────────────────
    if (body.importData) {
      const importParsed = importPortfolioSchema.safeParse(body.importData);
      if (!importParsed.success) return validationErrorResponse(importParsed.error);

      const importData = importParsed.data;

      const portfolio = await db.$transaction(async (tx) => {
        const p = await tx.portfolio.create({
          data: {
            userId: session.user.id,
            title: parsed.data.title,
            slug: parsed.data.slug,
            description: parsed.data.description ?? importData.description,
            isDefault: isFirst,
            theme: {
              create: {
                mode: importData.theme?.mode ?? "DARK",
                primaryColor: importData.theme?.primaryColor ?? "#6366f1",
                secondaryColor: importData.theme?.secondaryColor ?? "#8b5cf6",
                accentColor: importData.theme?.accentColor ?? "#06b6d4",
                backgroundColor: importData.theme?.backgroundColor ?? "#0f172a",
                textColor: importData.theme?.textColor ?? "#f8fafc",
                fontHeading: importData.theme?.fontHeading ?? "Outfit",
                fontBody: importData.theme?.fontBody ?? "DM Sans",
                borderRadius: importData.theme?.borderRadius ?? "0.5rem",
              },
            },
          },
        });

        for (const section of importData.sections) {
          const s = await tx.section.create({
            data: {
              portfolioId: p.id,
              name: section.name,
              sortOrder: section.sortOrder ?? 0,
              styles: section.styles as object,
              isVisible: section.isVisible ?? true,
              isLocked: section.isLocked ?? false,
            },
          });

          if (section.blocks.length > 0) {
            await tx.block.createMany({
              data: section.blocks.map((block) => ({
                sectionId: s.id,
                type: block.type,
                sortOrder: block.sortOrder ?? 0,
                content: block.content as object,
                styles: block.styles as object,
                isVisible: block.isVisible ?? true,
                isLocked: block.isLocked ?? false,
              })),
            });
          }
        }

        return tx.portfolio.findUnique({
          where: { id: p.id },
          select: {
            id: true, title: true, slug: true, status: true,
            viewCount: true, updatedAt: true, isDefault: true,
            template: { select: { name: true, thumbnail: true } },
            _count: { select: { sections: true } },
          },
        });
      });

      return createdResponse(portfolio);
    }

    // Create portfolio with default sections and theme
    const portfolio = await db.portfolio.create({
      data: {
        userId: session.user.id,
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        templateId: parsed.data.templateId,
        isDefault: isFirst,
        theme: {
          create: {
            mode: "DARK",
            primaryColor: "#6366f1",
            secondaryColor: "#8b5cf6",
            accentColor: "#06b6d4",
            backgroundColor: "#0f172a",
            textColor: "#f8fafc",
            fontHeading: "Outfit",
            fontBody: "DM Sans",
            borderRadius: "0.5rem",
          },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
        updatedAt: true,
        isDefault: true,
        template: { select: { name: true, thumbnail: true } },
        _count: { select: { sections: true } },
      },
    });

    return createdResponse(portfolio);
  } catch (error) {
    console.error("[POST /api/portfolios]", error);
    return internalErrorResponse();
  }
}

