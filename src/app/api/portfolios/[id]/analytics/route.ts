import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;

    const portfolio = await db.portfolio.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true, viewCount: true },
    });
    if (!portfolio) return unauthorizedResponse();

    const url = new URL(request.url);
    const range = parseInt(url.searchParams.get("range") ?? "30", 10);
    const since = new Date();
    since.setDate(since.getDate() - range);

    const [periodViews, dailyViews, referrers, devices] = await Promise.all([
      db.portfolioView.count({
        where: { portfolioId: id, viewedAt: { gte: since } },
      }),
      db.$queryRaw<Array<{ date: string; views: bigint }>>`
        SELECT DATE("viewedAt") as date, COUNT(*) as views
        FROM portfolio_views
        WHERE "portfolioId" = ${id} AND "viewedAt" >= ${since}
        GROUP BY DATE("viewedAt")
        ORDER BY date ASC
      `,
      db.$queryRaw<Array<{ source: string; count: bigint }>>`
        SELECT referrer as source, COUNT(*) as count
        FROM portfolio_views
        WHERE "portfolioId" = ${id} AND "viewedAt" >= ${since} AND referrer IS NOT NULL
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
      `,
      db.$queryRaw<Array<{ device: string; count: bigint }>>`
        SELECT "deviceType" as device, COUNT(*) as count
        FROM portfolio_views
        WHERE "portfolioId" = ${id} AND "viewedAt" >= ${since} AND "deviceType" IS NOT NULL
        GROUP BY "deviceType"
      `,
    ]);

    return successResponse({
      total: portfolio.viewCount,
      period: { views: periodViews, range: `${range}d` },
      daily: dailyViews.map((d) => ({ date: String(d.date), views: Number(d.views) })),
      referrers: referrers.map((r) => ({ source: r.source, count: Number(r.count) })),
      devices: Object.fromEntries(devices.map((d) => [d.device, Number(d.count)])),
    });
  } catch (error) {
    console.error("[GET /api/portfolios/[id]/analytics]", error);
    return internalErrorResponse();
  }
}
