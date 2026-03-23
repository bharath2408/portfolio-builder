"use client";

import {
  BarChart3,
  Edit,
  ExternalLink,
  Eye,
  Globe,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolios, usePortfolioMutations } from "@/hooks";
import { formatRelativeTime } from "@/lib/utils";
import { APP_URL } from "@/config/constants";

export default function PortfoliosPage() {
  const { data: session } = useSession();
  const { portfolios, isLoading } = usePortfolios();
  const { deletePortfolio } = usePortfolioMutations();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const username = session?.user?.username;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deletePortfolio(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">
            Portfolios
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Manage, edit, and publish your portfolio websites
          </p>
        </div>
        <Link href="/dashboard/portfolios/new">
          <button className="flex h-9 items-center gap-2 rounded-lg bg-gradient-to-b from-teal-400 to-teal-600 px-4 text-[13px] font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/30">
            <Plus className="h-4 w-4" />
            New Portfolio
          </button>
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-[88px] rounded-xl"
            />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
            <Globe className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-foreground">
              No portfolios yet
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Create your first portfolio to get started
            </p>
          </div>
          <Link href="/dashboard/portfolios/new">
            <button className="flex h-9 items-center gap-2 rounded-lg bg-gradient-to-b from-teal-400 to-teal-600 px-5 text-[13px] font-semibold text-white shadow-lg shadow-teal-500/20">
              <Plus className="h-4 w-4" />
              Create Portfolio
            </button>
          </Link>
        </div>
      ) : (
        /* Portfolio List */
        <div className="space-y-2">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="group relative rounded-xl border bg-card transition-all hover:border-primary/20 hover:shadow-sm"
            >
              <div className="flex items-center gap-4 p-4">
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
                    onClick={() => handleDelete(portfolio.id)}
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
    </div>
  );
}
