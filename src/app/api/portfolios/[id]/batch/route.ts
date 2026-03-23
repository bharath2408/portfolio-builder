import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  successResponse,
  notFoundResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";

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
  isVisible?: boolean;
  isLocked?: boolean;
}

interface BatchSection {
  id: string;
  name: string;
  sortOrder: number;
  styles: Record<string, unknown>;
  isVisible?: boolean;
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

  // Build all upsert operations for a single transaction
  const operations = [];

  for (const section of body.sections) {
    // Upsert section
    operations.push(
      db.section.update({
        where: { id: section.id },
        data: {
          name: section.name,
          sortOrder: section.sortOrder,
          styles: section.styles as Prisma.InputJsonValue,
          isVisible: section.isVisible ?? true,
        },
      }),
    );

    // Upsert each block
    for (const block of section.blocks) {
      operations.push(
        db.block.update({
          where: { id: block.id },
          data: {
            type: block.type,
            sortOrder: block.sortOrder,
            content: block.content as Prisma.InputJsonValue,
            styles: block.styles as Prisma.InputJsonValue,
            isVisible: block.isVisible ?? true,
            isLocked: block.isLocked ?? false,
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
