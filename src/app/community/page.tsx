import { ArrowRight, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LandingHeader } from "@/components/common/landing-header";
import { APP_NAME } from "@/config/constants";
import { db } from "@/lib/db";

import { CommunityPageClient } from "./_components/community-page-client";

export const metadata: Metadata = {
  title: "Community Templates",
  description:
    "Browse portfolio templates shared by the community. One click to clone and start building.",
};

const PAGE_LIMIT = 12;

export default async function CommunityPage() {
  const raw = await db.communityTemplate.findMany({
    take: PAGE_LIMIT + 1,
    orderBy: { useCount: "desc" },
    include: {
      user: { select: { username: true, name: true } },
      portfolio: { select: { slug: true } },
    },
  });

  const hasMore = raw.length > PAGE_LIMIT;
  const templates = hasMore ? raw.slice(0, PAGE_LIMIT) : raw;
  const lastTemplate = templates[templates.length - 1];
  const initialNextCursor = hasMore && lastTemplate ? lastTemplate.id : null;

  // Shape to match CommunityTemplate interface
  const initialTemplates = templates.map((t) => ({
    id: t.id,
    portfolioId: t.portfolioId,
    userId: t.userId,
    name: t.name,
    description: t.description,
    category: t.category as "DEVELOPER" | "DESIGNER" | "WRITER" | "OTHER",
    isDark: t.isDark,
    tags: t.tags,
    thumbnail: t.thumbnail,
    useCount: t.useCount,
    createdAt: t.createdAt.toISOString(),
    user: t.user,
    portfolio: t.portfolio,
  }));

  return (
    <div className="relative min-h-screen bg-[#fafaf9] font-sans dark:bg-[#09090b]">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-teal-400/[0.07] via-cyan-300/[0.04] to-transparent blur-[140px]" />
        <div className="absolute -bottom-60 right-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-violet-500/[0.06] via-blue-400/[0.03] to-transparent blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Header */}
      <LandingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/60 px-4 py-1.5 text-[12px] font-semibold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400">
            <Users className="h-3 w-3" />
            Made by the community, for the community
          </div>

          <h1 className="font-display text-[36px] font-extrabold leading-[1.1] tracking-tight text-stone-900 dark:text-white sm:text-[48px] md:text-[56px]">
            Community{" "}
            <span className="bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
              Templates
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-stone-500 dark:text-stone-400 sm:text-[17px]">
            Browse portfolio templates shared by real creators. Clone any template with one click
            and make it yours in minutes.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 px-7 py-3.5 text-[14px] font-bold text-white shadow-xl shadow-teal-500/20 transition-all hover:shadow-2xl hover:shadow-teal-500/30 hover:brightness-110 active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start Building Free
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-stone-300/80 bg-white/80 px-6 py-3.5 text-[14px] font-semibold text-stone-700 shadow-sm backdrop-blur-sm transition-all hover:border-stone-400 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:border-white/20"
            >
              Sign in to clone
            </Link>
          </div>
        </div>
      </section>

      {/* Template Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <CommunityPageClient
          initialTemplates={initialTemplates}
          initialNextCursor={initialNextCursor}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200/60 dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 shadow-sm shadow-teal-500/20 dark:from-white dark:via-white dark:to-white dark:shadow-white/10">
                <Sparkles className="h-3.5 w-3.5 text-white dark:text-stone-900" />
              </div>
              <span className="font-display text-[14px] font-bold text-stone-800 dark:text-stone-200">
                {APP_NAME}
              </span>
            </div>
            <nav className="flex items-center gap-6 text-[12px] font-medium text-stone-400 dark:text-stone-500">
              <Link
                href="/"
                className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
              >
                Home
              </Link>
              <Link
                href="/login"
                className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
