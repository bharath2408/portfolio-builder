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
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-teal-500/5 via-card to-cyan-500/5 px-8 py-8">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-500/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-cyan-500/[0.04] blur-3xl" />
        <div className="relative flex items-start gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 shadow-lg shadow-teal-500/5">
            <Users className="h-6 w-6 text-teal-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Community Templates
            </h1>
            <p className="max-w-lg text-[14px] leading-relaxed text-muted-foreground">
              Discover portfolios crafted by the community. Use any template as your starting point and make it yours.
            </p>
          </div>
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
