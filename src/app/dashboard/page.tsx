"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  FolderKanban,
  Globe,
  Layers,
  Plus,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolios } from "@/hooks";
import { formatRelativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { portfolios, isLoading } = usePortfolios();

  const totalViews = portfolios.reduce((sum, p) => sum + p.viewCount, 0);
  const publishedCount = portfolios.filter(
    (p) => p.status === "PUBLISHED",
  ).length;
  const draftCount = portfolios.filter((p) => p.status === "DRAFT").length;
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* ── Welcome banner ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-teal-500/[0.06] via-transparent to-cyan-500/[0.04] p-6 lg:p-8">
        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-cyan-500/[0.05] blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-teal-600 dark:text-teal-400">
            <Zap className="h-3.5 w-3.5" />
            Dashboard
          </div>
          <h1 className="mt-2 font-display text-[26px] font-bold tracking-tight text-foreground lg:text-[30px]">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            Here&apos;s an overview of your portfolios and recent activity.
          </p>
        </div>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="mt-4 h-8 w-14" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))
        ) : (
          <>
            {/* Total Portfolios */}
            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Portfolios
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <FolderKanban className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-[28px] font-bold tabular-nums tracking-tight text-foreground">
                {portfolios.length}
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground/70">
                {publishedCount} published, {draftCount} draft
              </p>
              <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-teal-500 to-teal-500/0 transition-transform duration-300 group-hover:scale-x-100" />
            </div>

            {/* Total Views */}
            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Total Views
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-[28px] font-bold tabular-nums tracking-tight text-foreground">
                {totalViews.toLocaleString()}
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground/70">
                Across all portfolios
              </p>
              <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-cyan-500 to-cyan-500/0 transition-transform duration-300 group-hover:scale-x-100" />
            </div>

            {/* Live Status */}
            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Status
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Globe className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2.5">
                <div
                  className={`h-2 w-2 rounded-full ${publishedCount > 0 ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"}`}
                />
                <span className="text-[28px] font-bold tracking-tight text-foreground">
                  {publishedCount > 0 ? "Live" : "Draft"}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground/70">
                {publishedCount > 0
                  ? `${publishedCount} portfolio${publishedCount > 1 ? "s" : ""} live`
                  : "Publish to go live"}
              </p>
              <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-emerald-500 to-emerald-500/0 transition-transform duration-300 group-hover:scale-x-100" />
            </div>

            {/* Sections */}
            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Sections
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-[28px] font-bold tabular-nums tracking-tight text-foreground">
                {portfolios.reduce((sum, p) => sum + (p._count?.sections ?? 0), 0)}
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground/70">
                Total across all portfolios
              </p>
              <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-violet-500 to-violet-500/0 transition-transform duration-300 group-hover:scale-x-100" />
            </div>
          </>
        )}
      </div>

      {/* ── Quick Actions + Recent ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Quick Actions */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">
              Quick Actions
            </h2>
          </div>

          <div className="space-y-2.5">
            <Link href="/dashboard/portfolios/new">
              <div className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-teal-500/30 hover:shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/15 to-cyan-500/10">
                  <Plus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-foreground">
                    Create Portfolio
                  </div>
                  <div className="text-[11.5px] text-muted-foreground/70">
                    Start from a blank canvas
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-teal-500" />
              </div>
            </Link>

            {portfolios.length > 0 && (
              <Link href={`/dashboard/portfolios/${portfolios[0]?.id}/edit`}>
                <div className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-violet-500/30 hover:shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-500/10">
                    <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-foreground">
                      Open Studio
                    </div>
                    <div className="max-w-[180px] truncate text-[11.5px] text-muted-foreground/70">
                      Continue &quot;{portfolios[0]?.title}&quot;
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-violet-500" />
                </div>
              </Link>
            )}

            <Link href="/dashboard/portfolios">
              <div className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-cyan-500/30 hover:shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-foreground">
                    Manage Portfolios
                  </div>
                  <div className="text-[11.5px] text-muted-foreground/70">
                    View, edit, and publish
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-cyan-500" />
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Portfolios */}
        <div className="space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">
              Recent Portfolios
            </h2>
            {portfolios.length > 0 && (
              <Link
                href="/dashboard/portfolios"
                className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                View all
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[60px] rounded-xl" />
              ))}
            </div>
          ) : portfolios.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-14">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                <FolderKanban className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="mt-3 text-[13px] font-medium text-muted-foreground/70">
                No portfolios yet
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground/50">
                Create one to get started
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card">
              {portfolios.slice(0, 5).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/dashboard/portfolios/${p.id}/edit`}
                  className={`group flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-150 hover:bg-accent/40 ${
                    i !== 0 ? "border-t border-border/40" : ""
                  } ${i === 0 ? "rounded-t-xl" : ""} ${i === Math.min(portfolios.length - 1, 4) ? "rounded-b-xl" : ""}`}
                >
                  {/* Status dot */}
                  <div className="flex-shrink-0">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        p.status === "PUBLISHED"
                          ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]"
                          : p.status === "ARCHIVED"
                            ? "bg-muted-foreground/25"
                            : "bg-amber-500/70"
                      }`}
                    />
                  </div>

                  {/* Title + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-foreground/85 group-hover:text-foreground">
                        {p.title}
                      </span>
                      <span
                        className={`flex-shrink-0 rounded-md px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider ${
                          p.status === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground/60"
                        }`}
                      >
                        {p.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground/50">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {p.viewCount}
                      </span>
                      <span>
                        {p._count.sections} section{p._count.sections !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <span className="flex-shrink-0 text-[11px] text-muted-foreground/40">
                    {formatRelativeTime(p.updatedAt)}
                  </span>

                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground/50" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
