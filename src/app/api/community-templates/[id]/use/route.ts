import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { MAX_PORTFOLIOS_PER_USER } from "@/config/constants";
import {
  requireAuth,
  createdResponse,
  notFoundResponse,
  conflictResponse,
  internalErrorResponse,
  unauthorizedResponse,
  AuthRequiredError,
} from "@/lib/api/response";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string, userId: string): Promise<string> {
  const slug = toSlug(base);
  let candidate = slug;
  let i = 1;
  while (await db.portfolio.findFirst({ where: { userId, slug: candidate } })) {
    candidate = i === 1 ? `${slug}-copy` : `${slug}-copy-${i}`;
    i++;
  }
  return candidate;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const template = await db.communityTemplate.findUnique({
      where: { id },
      include: {
        portfolio: {
          include: {
            sections: { include: { blocks: true } },
            theme: true,
          },
        },
      },
    });

    if (!template) {
      return notFoundResponse("Template");
    }

    const portfolioCount = await db.portfolio.count({
      where: { userId: user.id },
    });

    if (portfolioCount >= MAX_PORTFOLIOS_PER_USER) {
      return conflictResponse(
        "You've reached the maximum number of portfolios. Delete one to continue.",
      );
    }

    const slug = await uniqueSlug(template.name, user.id);

    const newPortfolio = await db.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.create({
        data: {
          userId: user.id,
          title: template.name,
          slug,
          status: "DRAFT",
          sections: {
            create: template.portfolio.sections.map((s) => ({
              name: s.name,
              sortOrder: s.sortOrder,
              isVisible: s.isVisible,
              isLocked: s.isLocked,
              styles: s.styles as Prisma.InputJsonValue,
              blocks: {
                create: s.blocks.map((b) => ({
                  type: b.type,
                  sortOrder: b.sortOrder,
                  content: b.content as Prisma.InputJsonValue,
                  styles: b.styles as Prisma.InputJsonValue,
                  tabletStyles: b.tabletStyles as Prisma.InputJsonValue,
                  mobileStyles: b.mobileStyles as Prisma.InputJsonValue,
                  isVisible: b.isVisible,
                  isLocked: b.isLocked,
                })),
              },
            })),
          },
        },
      });

      if (template.portfolio.theme) {
        const {
          id: _id,
          portfolioId: _pid,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...themeData
        } = template.portfolio.theme;
        await tx.theme.create({
          data: { ...themeData, portfolioId: portfolio.id },
        });
      }

      await tx.communityTemplate.update({
        where: { id: template.id },
        data: { useCount: { increment: 1 } },
      });

      return portfolio;
    });

    return createdResponse({ portfolioId: newPortfolio.id });
  } catch (error) {
    if (error instanceof AuthRequiredError) return unauthorizedResponse();
    console.error("[community-templates/[id]/use POST]", error);
    return internalErrorResponse();
  }
}
