import {
  createdResponse,
  unauthorizedResponse,
  conflictResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_PORTFOLIOS_PER_USER } from "@/config/constants";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;

    const count = await db.portfolio.count({
      where: { userId: session.user.id },
    });
    if (count >= MAX_PORTFOLIOS_PER_USER) {
      return conflictResponse(`Maximum ${MAX_PORTFOLIOS_PER_USER} portfolios allowed`);
    }

    const source = await db.portfolio.findFirst({
      where: { id, userId: session.user.id },
      include: {
        sections: {
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
        theme: true,
      },
    });

    if (!source) return notFoundResponse("Portfolio");

    let slug = `${source.slug}-copy`;
    let counter = 1;
    while (await db.portfolio.findUnique({ where: { userId_slug: { userId: session.user.id, slug } } })) {
      counter++;
      slug = `${source.slug}-copy-${counter}`;
    }

    const portfolio = await db.$transaction(async (tx) => {
      const p = await tx.portfolio.create({
        data: {
          userId: session.user.id,
          title: `${source.title} (Copy)`,
          slug,
          description: source.description,
          status: "DRAFT",
          isDefault: false,
          seoTitle: source.seoTitle,
          seoDescription: source.seoDescription,
          ogImageUrl: source.ogImageUrl,
          theme: source.theme ? {
            create: {
              mode: source.theme.mode,
              primaryColor: source.theme.primaryColor,
              secondaryColor: source.theme.secondaryColor,
              accentColor: source.theme.accentColor,
              backgroundColor: source.theme.backgroundColor,
              surfaceColor: source.theme.surfaceColor,
              textColor: source.theme.textColor,
              mutedColor: source.theme.mutedColor,
              fontHeading: source.theme.fontHeading,
              fontBody: source.theme.fontBody,
              fontMono: source.theme.fontMono,
              borderRadius: source.theme.borderRadius,
            },
          } : undefined,
        },
      });

      for (const section of source.sections) {
        const s = await tx.section.create({
          data: {
            portfolioId: p.id,
            name: section.name,
            sortOrder: section.sortOrder,
            styles: section.styles as object,
            isVisible: section.isVisible,
            isLocked: section.isLocked,
          },
        });

        if (section.blocks.length > 0) {
          await tx.block.createMany({
            data: section.blocks.map((block) => ({
              sectionId: s.id,
              type: block.type,
              sortOrder: block.sortOrder,
              content: block.content as object,
              styles: block.styles as object,
              isVisible: block.isVisible,
              isLocked: block.isLocked,
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
  } catch (error) {
    console.error("[POST /api/portfolios/[id]/duplicate]", error);
    return internalErrorResponse();
  }
}
