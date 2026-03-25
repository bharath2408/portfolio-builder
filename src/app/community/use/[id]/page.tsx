import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_PORTFOLIOS_PER_USER } from "@/config/constants";

// ─── Slug helpers ─────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CommunityUseRedirectPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/community/use/${id}`);
  }

  const userId = session.user.id;

  // 2. Find template
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
    redirect("/community?error=not_found");
  }

  // 3. Portfolio limit check
  const portfolioCount = await db.portfolio.count({ where: { userId } });
  if (portfolioCount >= MAX_PORTFOLIOS_PER_USER) {
    redirect("/community?error=limit_reached");
  }

  // 4–6. Generate slug, clone transaction, redirect to editor
  try {
    const slug = await uniqueSlug(template.name, userId);

    const newPortfolio = await db.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.create({
        data: {
          userId,
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

    redirect(`/dashboard/portfolios/${newPortfolio.id}/edit`);
  } catch (error) {
    // next/navigation redirects throw internally; re-throw them so Next.js
    // can handle the redirect response correctly.
    if (
      error instanceof Error &&
      (error as any).digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    redirect("/community?error=clone_failed");
  }
}
