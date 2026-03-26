import { NextResponse } from "next/server";

import { db } from "@/lib/db";

// GET /api/cron/cleanup-trash
// Called daily by Vercel Cron — permanently deletes portfolios trashed 30+ days ago.

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await db.portfolio.deleteMany({
    where: {
      deletedAt: { not: null, lt: thirtyDaysAgo },
    },
  });

  return NextResponse.json({
    deleted: result.count,
    timestamp: new Date().toISOString(),
  });
}
