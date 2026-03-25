import type { ThemeMode } from "@prisma/client";

import { successResponse, unauthorizedResponse, notFoundResponse, internalErrorResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    const { id, versionId } = await params;

    const portfolio = await db.portfolio.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
    if (!portfolio) return unauthorizedResponse();

    const version = await db.portfolioVersion.findUnique({ where: { id: versionId }, select: { data: true } });
    if (!version) return notFoundResponse("Version");

    const data = version.data as Record<string, unknown>;

    // Delete existing sections/blocks and recreate from version
    await db.$transaction(async (tx) => {
      await tx.section.deleteMany({ where: { portfolioId: id } });

      const sections = (data.sections ?? []) as Array<Record<string, unknown>>;
      for (const section of sections) {
        const s = await tx.section.create({
          data: {
            portfolioId: id,
            name: section.name as string,
            sortOrder: (section.sortOrder as number) ?? 0,
            styles: (section.styles as object) ?? {},
            isVisible: (section.isVisible as boolean) ?? true,
            isLocked: (section.isLocked as boolean) ?? false,
          },
        });

        const blocks = (section.blocks ?? []) as Array<Record<string, unknown>>;
        if (blocks.length > 0) {
          await tx.block.createMany({
            data: blocks.map((b) => ({
              sectionId: s.id,
              type: b.type as string,
              sortOrder: (b.sortOrder as number) ?? 0,
              content: (b.content as object) ?? {},
              styles: (b.styles as object) ?? {},
              tabletStyles: (b.tabletStyles as object) ?? {},
              mobileStyles: (b.mobileStyles as object) ?? {},
              isVisible: (b.isVisible as boolean) ?? true,
              isLocked: (b.isLocked as boolean) ?? false,
            })),
          });
        }
      }

      // Restore theme if present
      const themeData = data.theme as Record<string, unknown> | null;
      if (themeData) {
        await tx.theme.updateMany({
          where: { portfolioId: id },
          data: {
            mode: themeData.mode as ThemeMode | undefined,
            primaryColor: themeData.primaryColor as string | undefined,
            secondaryColor: themeData.secondaryColor as string | undefined,
            accentColor: themeData.accentColor as string | undefined,
            backgroundColor: themeData.backgroundColor as string | undefined,
            textColor: themeData.textColor as string | undefined,
            fontHeading: themeData.fontHeading as string | undefined,
            fontBody: themeData.fontBody as string | undefined,
            borderRadius: themeData.borderRadius as string | undefined,
          },
        });
      }
    });

    return successResponse({ restored: true });
  } catch (error) {
    console.error("[POST /api/portfolios/[id]/versions/[versionId]/restore]", error);
    return internalErrorResponse();
  }
}
