import { Users } from "lucide-react";
import { redirect } from "next/navigation";

import type { CommunityTemplate } from "@/lib/api/community-templates";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { CommunityGridClient } from "./community-grid-client";

// ─── Page ─────────────────────────────────────────────────────────

export default async function DashboardCommunityPage() {
  // 1. Auth
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/community");
  }

  // 2. Fetch initial 12 templates sorted by useCount desc
  const PAGE_LIMIT = 12;
  const rows = await db.communityTemplate.findMany({
    take: PAGE_LIMIT + 1,
    orderBy: { useCount: "desc" },
    include: {
      user: { select: { username: true, name: true } },
      portfolio: { select: { slug: true } },
    },
  });

  const hasNext = rows.length > PAGE_LIMIT;
  const items = hasNext ? rows.slice(0, PAGE_LIMIT) : rows;
  const lastItem = items[items.length - 1];
  const nextCursor = hasNext && lastItem ? lastItem.id : null;

  // Serialise dates to strings so the server→client boundary stays clean
  const initialTemplates: CommunityTemplate[] = items.map((t) => ({
    id: t.id,
    portfolioId: t.portfolioId,
    userId: t.userId,
    name: t.name,
    description: t.description,
    category: t.category,
    isDark: t.isDark,
    tags: t.tags,
    thumbnail: t.thumbnail,
    useCount: t.useCount,
    createdAt: t.createdAt.toISOString(),
    user: t.user,
    portfolio: t.portfolio,
  }));

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
          <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-foreground">
            Community Templates
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Browse portfolios shared by the community and use them as a starting point.
          </p>
        </div>
      </div>

      {/* ── Client component handles onUse + TemplateGrid ─────── */}
      <CommunityGridClient
        initialTemplates={initialTemplates}
        initialNextCursor={nextCursor}
      />
    </div>
  );
}
