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
import { db } from "@/lib/db";

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

interface SnapshotSection {
  name: string;
  sortOrder: number;
  isVisible: boolean;
  isLocked: boolean;
  styles: Prisma.InputJsonValue;
  blocks: Array<{
    type: string;
    sortOrder: number;
    isVisible: boolean;
    isLocked: boolean;
    content: Prisma.InputJsonValue;
    styles: Prisma.InputJsonValue;
    tabletStyles: Prisma.InputJsonValue;
    mobileStyles: Prisma.InputJsonValue;
  }>;
}

interface SnapshotData {
  sections: SnapshotSection[];
  theme: Record<string, unknown> | null;
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
      select: { id: true, name: true, snapshotData: true },
    });

    if (!template || !template.snapshotData) {
      return notFoundResponse("Template");
    }

    const snapshot = template.snapshotData as unknown as SnapshotData;

    const portfolioCount = await db.portfolio.count({
      where: { userId: user.id },
    });

    if (portfolioCount >= MAX_PORTFOLIOS_PER_USER) {
      return conflictResponse(
        "You've reached the maximum number of portfolios. Delete one to continue.",
      );
    }

    const slug = await uniqueSlug(template.name, user.id);

    const newPortfolio = await db.$transaction(
      async (tx) => {
        const portfolio = await tx.portfolio.create({
          data: {
            userId: user.id,
            title: template.name,
            slug,
            status: "DRAFT",
            sections: {
              create: snapshot.sections.map((s) => ({
                name: s.name,
                sortOrder: s.sortOrder,
                isVisible: s.isVisible,
                isLocked: s.isLocked,
                styles: s.styles,
                blocks: {
                  create: s.blocks.map((b) => ({
                    type: b.type,
                    sortOrder: b.sortOrder,
                    content: b.content,
                    styles: b.styles,
                    tabletStyles: b.tabletStyles,
                    mobileStyles: b.mobileStyles,
                    isVisible: b.isVisible,
                    isLocked: b.isLocked,
                  })),
                },
              })),
            },
          },
        });

        if (snapshot.theme) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, portfolioId: _pid, createdAt: _ca, updatedAt: _ua, ...themeData } =
            snapshot.theme;
          await tx.theme.create({
            data: { ...themeData, portfolioId: portfolio.id } as Prisma.ThemeUncheckedCreateInput,
          });
        }

        await tx.communityTemplate.update({
          where: { id: template.id },
          data: { useCount: { increment: 1 } },
        });

        return portfolio;
      },
      { timeout: 30000 },
    );

    return createdResponse({ portfolioId: newPortfolio.id });
  } catch (error) {
    if (error instanceof AuthRequiredError) return unauthorizedResponse();
    console.error("[community-templates/[id]/use POST]", error);
    return internalErrorResponse();
  }
}
