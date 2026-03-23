import { successResponse, createdResponse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — list versions
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    const { id } = await params;

    const portfolio = await db.portfolio.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
    if (!portfolio) return unauthorizedResponse();

    const versions = await db.portfolioVersion.findMany({
      where: { portfolioId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, label: true, createdAt: true },
    });

    return successResponse(versions);
  } catch (error) {
    console.error("[GET /api/portfolios/[id]/versions]", error);
    return internalErrorResponse();
  }
}

// POST — create version snapshot
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    const { id } = await params;

    const portfolio = await db.portfolio.findFirst({
      where: { id, userId: session.user.id },
      include: {
        sections: { include: { blocks: true }, orderBy: { sortOrder: "asc" } },
        theme: true,
      },
    });
    if (!portfolio) return unauthorizedResponse();

    const body = await request.json().catch(() => ({}));

    const version = await db.portfolioVersion.create({
      data: {
        portfolioId: id,
        label: body.label ?? null,
        data: {
          title: portfolio.title,
          description: portfolio.description,
          sections: portfolio.sections.map(s => ({
            id: s.id, name: s.name, sortOrder: s.sortOrder, styles: s.styles,
            isVisible: s.isVisible, isLocked: s.isLocked,
            blocks: s.blocks.map(b => ({
              id: b.id, type: b.type, sortOrder: b.sortOrder,
              content: b.content, styles: b.styles,
              isVisible: b.isVisible, isLocked: b.isLocked,
            })),
          })),
          theme: portfolio.theme,
        },
      },
      select: { id: true, label: true, createdAt: true },
    });

    // Keep only last 20 versions
    const oldVersions = await db.portfolioVersion.findMany({
      where: { portfolioId: id },
      orderBy: { createdAt: "desc" },
      skip: 20,
      select: { id: true },
    });
    if (oldVersions.length > 0) {
      await db.portfolioVersion.deleteMany({ where: { id: { in: oldVersions.map(v => v.id) } } });
    }

    return createdResponse(version);
  } catch (error) {
    console.error("[POST /api/portfolios/[id]/versions]", error);
    return internalErrorResponse();
  }
}
