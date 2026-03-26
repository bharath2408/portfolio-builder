"use client";

import {
  BarChart3,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  Globe,
  Mail,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { APP_URL } from "@/config/constants";
import { usePortfolios, usePortfolioMutations } from "@/hooks";
import { formatRelativeTime } from "@/lib/utils";

export default function PortfoliosPage() {
  const { data: session } = useSession();
  const { portfolios, isLoading } = usePortfolios();
  const { deletePortfolio, duplicatePortfolio } = usePortfolioMutations();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const username = session?.user?.username;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePortfolio(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-indigo-500/5 via-card to-teal-500/5 px-8 py-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-500/[0.04] blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 shadow-lg shadow-indigo-500/5">
              <Globe className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Portfolios
              </h1>
              <p className="max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Manage, edit, and publish your portfolio websites. Each portfolio is a unique site.
              </p>
            </div>
          </div>
          <Link href="/dashboard/portfolios/new">
            <button className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-teal-400 to-teal-600 px-5 text-[13px] font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/30 active:scale-[0.97]">
              <Plus className="h-4 w-4" />
              New Portfolio
            </button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-border/40 bg-card"
            >
              <div className="flex items-center gap-4 p-5">
                <div className="h-3 w-3 animate-pulse rounded-full bg-muted/60" style={{ animationDelay: `${i * 150}ms` }} />
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted/50" style={{ animationDelay: `${i * 100}ms` }} />
                    <div className="h-5 w-20 animate-pulse rounded-full bg-muted/40" style={{ animationDelay: `${i * 200}ms` }} />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-3.5 w-16 animate-pulse rounded bg-muted/30" style={{ animationDelay: `${i * 120}ms` }} />
                    <div className="h-3.5 w-20 animate-pulse rounded bg-muted/30" style={{ animationDelay: `${i * 180}ms` }} />
                    <div className="h-3.5 w-14 animate-pulse rounded bg-muted/30" style={{ animationDelay: `${i * 220}ms` }} />
                  </div>
                </div>
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.03) 37%, transparent 63%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.8s ease-in-out infinite",
                  animationDelay: `${i * 200}ms`,
                }}
              />
            </div>
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-border/40 bg-muted/20 py-24">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm">
            <Globe className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-[16px] font-semibold text-foreground">
              No portfolios yet
            </p>
            <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Create your first portfolio to start building your online presence.
            </p>
          </div>
          <Link href="/dashboard/portfolios/new">
            <button className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-teal-400 to-teal-600 px-6 text-[13px] font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/30 active:scale-[0.97]">
              <Plus className="h-4 w-4" />
              Create Portfolio
            </button>
          </Link>
        </div>
      ) : (
        /* Portfolio List */
        <div className="space-y-3">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="group relative rounded-xl border border-border/40 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
            >
              <div className="flex items-center gap-4 p-5">
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      portfolio.status === "PUBLISHED"
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        : portfolio.status === "ARCHIVED"
                          ? "bg-muted-foreground/30"
                          : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="truncate text-[14px] font-semibold text-foreground">
                      {portfolio.title}
                    </h3>
                    {portfolio.isDefault && (
                      <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-600 ring-1 ring-teal-500/20">
                        Default
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        portfolio.status === "PUBLISHED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {portfolio.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {portfolio.viewCount} views
                    </span>
                    <span>
                      {portfolio._count.sections} section
                      {portfolio._count.sections !== 1 ? "s" : ""}
                    </span>
                    <span>{formatRelativeTime(portfolio.updatedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Link href={`/dashboard/portfolios/${portfolio.id}/edit`}>
                    <button
                      className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      title="Open in Studio"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </Link>

                  <Link
                    href={`/dashboard/portfolios/${portfolio.id}/analytics`}
                    className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title="Analytics"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Analytics
                  </Link>

                  <Link
                    href={`/dashboard/portfolios/${portfolio.id}/submissions`}
                    className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title="Form Submissions"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Inbox
                  </Link>

                  <button
                    onClick={async () => {
                      try { await duplicatePortfolio(portfolio.id); } catch {}
                    }}
                    className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </button>

                  {portfolio.status === "PUBLISHED" && username && (
                    <a
                      href={`${APP_URL}/portfolio/${username}/${portfolio.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      title="View live site"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </a>
                  )}

                  <button
                    onClick={() => setConfirmDeleteId(portfolio.id)}
                    disabled={deletingId === portfolio.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Always-visible edit arrow */}
                <Link
                  href={`/dashboard/portfolios/${portfolio.id}/edit`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:text-foreground group-hover:hidden"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) handleDelete(confirmDeleteId); }}
        title="Move to trash?"
        description="This portfolio will be moved to trash. You can restore it within 30 days."
        confirmText="Move to Trash"
        variant="danger"
        loading={!!deletingId}
      />
    </div>
  );
}
