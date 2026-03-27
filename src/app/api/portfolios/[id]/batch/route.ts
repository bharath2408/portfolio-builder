import type { Prisma } from "@prisma/client";

import {
  successResponse,
  notFoundResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { db } from "@/lib/db";

// ─── Batch Save ──────────────────────────────────────────────────
// PUT /api/portfolios/:id/batch
//
// Saves the entire portfolio state (all sections + blocks) in a
// single Prisma transaction. Replaces N individual PATCH calls
// with 1 request. This is the performance-critical save path.

interface BatchBlock {
  id: string;
  type: string;
  sortOrder: number;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  tabletStyles?: Record<string, unknown>;
  mobileStyles?: Record<string, unknown>;
  isVisible?: boolean;
  isLocked?: boolean;
  parentId?: string | null;
}

interface BatchSection {
  id: string;
  name: string;
  sortOrder: number;
  styles: Record<string, unknown>;
  isVisible?: boolean;
  pageId?: string | null;
  blocks: BatchBlock[];
}

interface BatchPayload {
  sections: BatchSection[];
}

export const PUT = withErrorHandler(async (req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  // Verify ownership
  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!portfolio) return notFoundResponse("Portfolio");

  const body: BatchPayload = await req.json();

  if (!body.sections || !Array.isArray(body.sections)) {
    return successResponse({ saved: true });
  }

  // Build all operations for a single transaction
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  // Delete sections NOT in the payload (were removed client-side)
  const sectionIdsInStore = body.sections.map((s) => s.id);
  operations.push(
    db.section.deleteMany({
      where: { portfolioId: id, id: { notIn: sectionIdsInStore } },
    }),
  );

  for (const section of body.sections) {
    const blockIdsInStore = section.blocks.map((b: BatchBlock) => b.id);

    // Upsert section (supports imported/new sections)
    operations.push(
      db.section.upsert({
        where: { id: section.id },
        update: {
          name: section.name,
          sortOrder: section.sortOrder,
          styles: section.styles as Prisma.InputJsonValue,
          isVisible: section.isVisible ?? true,
          pageId: section.pageId ?? null,
        },
        create: {
          id: section.id,
          portfolioId: id as string,
          name: section.name,
          sortOrder: section.sortOrder,
          styles: section.styles as Prisma.InputJsonValue,
          isVisible: section.isVisible ?? true,
          pageId: section.pageId ?? null,
        },
      }),
    );

    // Delete blocks that are NOT in the store (were deleted client-side)
    operations.push(
      db.block.deleteMany({
        where: { sectionId: section.id, id: { notIn: blockIdsInStore } },
      }),
    );

    // Upsert each block (supports client-generated IDs for new blocks)
    for (const block of section.blocks) {
      operations.push(
        db.block.upsert({
          where: { id: block.id },
          update: {
            type: block.type,
            sortOrder: block.sortOrder,
            content: block.content as Prisma.InputJsonValue,
            styles: block.styles as Prisma.InputJsonValue,
            tabletStyles: (block.tabletStyles ?? {}) as Prisma.InputJsonValue,
            mobileStyles: (block.mobileStyles ?? {}) as Prisma.InputJsonValue,
            isVisible: block.isVisible ?? true,
            isLocked: block.isLocked ?? false,
            parentId: block.parentId ?? null,
          },
          create: {
            id: block.id,
            sectionId: section.id,
            type: block.type,
            sortOrder: block.sortOrder,
            content: block.content as Prisma.InputJsonValue,
            styles: block.styles as Prisma.InputJsonValue,
            tabletStyles: (block.tabletStyles ?? {}) as Prisma.InputJsonValue,
            mobileStyles: (block.mobileStyles ?? {}) as Prisma.InputJsonValue,
            isVisible: block.isVisible ?? true,
            isLocked: block.isLocked ?? false,
            parentId: block.parentId ?? null,
          },
        }),
      );
    }
  }

  // Execute everything in a single transaction
  if (operations.length > 0) {
    await db.$transaction(operations);
  }

  return successResponse({
    saved: true,
    sections: body.sections.length,
    blocks: body.sections.reduce((sum, s) => sum + s.blocks.length, 0),
  });
});
