"use client";

import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TrashedPortfolio {
  id: string;
  title: string;
  slug: string;
  status: string;
  deletedAt: string;
  updatedAt: string;
  _count: { sections: number };
}

function getDaysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function TrashPage() {
  const [portfolios, setPortfolios] = useState<TrashedPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [emptying, setEmptying] = useState(false);

  useEffect(() => {
    apiGet<TrashedPortfolio[]>("/trash")
      .then(setPortfolios)
      .catch(() => setPortfolios([]))
      .finally(() => setLoading(false));
  }, []);

  const restore = useCallback(async (id: string) => {
    setRestoringId(id);
    try {
      await apiPost(`/trash/${id}/restore`, {});
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
    } catch {}
    finally { setRestoringId(null); }
  }, []);

  const permanentDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await apiDelete(`/trash/${id}`);
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
    } catch {}
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  }, []);

  const emptyTrash = useCallback(async () => {
    setEmptying(true);
    try {
      await apiPost("/trash/empty", {});
      setPortfolios([]);
    } catch {}
    finally { setEmptying(false); setConfirmEmpty(false); }
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-red-500/5 via-card to-orange-500/5 px-8 py-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-500/[0.04] blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 shadow-lg shadow-red-500/5">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Trash</h1>
              <p className="max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Deleted portfolios are kept for 30 days before permanent removal.
              </p>
            </div>
          </div>
          {portfolios.length > 0 && (
            <button
              onClick={() => setConfirmEmpty(true)}
              className="flex h-9 items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-[12px] font-semibold text-red-500 transition-all hover:bg-red-500/20 active:scale-[0.97]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border border-border/40 bg-card">
              <div className="flex items-center gap-4 p-5">
                <div className="h-3 w-3 animate-pulse rounded-full bg-muted/60" style={{ animationDelay: `${i * 150}ms` }} />
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted/50" style={{ animationDelay: `${i * 100}ms` }} />
                    <div className="h-5 w-20 animate-pulse rounded-full bg-muted/40" style={{ animationDelay: `${i * 200}ms` }} />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-3.5 w-20 animate-pulse rounded bg-muted/30" style={{ animationDelay: `${i * 120}ms` }} />
                    <div className="h-3.5 w-16 animate-pulse rounded bg-muted/30" style={{ animationDelay: `${i * 180}ms` }} />
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.03) 37%, transparent 63%)", backgroundSize: "200% 100%", animation: "shimmer 1.8s ease-in-out infinite", animationDelay: `${i * 200}ms` }} />
            </div>
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border/40 bg-muted/20 py-24">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm">
            <Trash2 className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-[16px] font-semibold text-foreground">Trash is empty</p>
            <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Deleted portfolios will appear here. You can restore them within 30 days.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolios.map((portfolio) => {
            const daysAgo = getDaysAgo(portfolio.deletedAt);
            const daysLeft = Math.max(0, 30 - daysAgo);
            const isUrgent = daysLeft <= 7;

            return (
              <div
                key={portfolio.id}
                className="group rounded-xl border border-border/40 bg-card p-5 transition-all duration-200 hover:border-border/60"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      portfolio.status === "PUBLISHED"
                        ? "bg-emerald-500/40"
                        : "bg-muted-foreground/20",
                    )} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="truncate text-[14px] font-semibold text-foreground/70">{portfolio.title}</h3>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        portfolio.status === "PUBLISHED"
                          ? "bg-emerald-500/10 text-emerald-600/60"
                          : "bg-muted text-muted-foreground/60",
                      )}>
                        {portfolio.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-[12px] text-muted-foreground">
                      <span>{portfolio._count.sections} section{portfolio._count.sections !== 1 ? "s" : ""}</span>
                      <span>Deleted {daysAgo === 0 ? "today" : `${daysAgo}d ago`}</span>
                      <span className={cn(
                        "font-medium",
                        isUrgent ? "text-red-500" : "text-muted-foreground/60",
                      )}>
                        {daysLeft === 0 ? "Expires today" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restore(portfolio.id)}
                      disabled={restoringId === portfolio.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-b from-teal-400 to-teal-600 px-3.5 text-[12px] font-semibold text-white shadow-sm shadow-teal-500/20 transition-all hover:shadow-teal-500/30 active:scale-[0.97] disabled:opacity-60"
                    >
                      {restoringId === portfolio.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      Restore
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(portfolio.id)}
                      disabled={deletingId === portfolio.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 px-3 text-[12px] font-medium text-red-500 transition-all hover:bg-red-500/10 active:scale-[0.97] disabled:opacity-60"
                    >
                      {deletingId === portfolio.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Delete Forever
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm permanent delete */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) permanentDelete(confirmDeleteId); }}
        title="Delete permanently?"
        description="This will permanently delete the portfolio and all its data. This action cannot be undone."
        confirmText="Delete Forever"
        variant="danger"
        loading={!!deletingId}
      />

      {/* Confirm empty trash */}
      <ConfirmDialog
        open={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        onConfirm={emptyTrash}
        title="Empty trash?"
        description="This will permanently delete all portfolios in trash. This action cannot be undone."
        confirmText="Empty Trash"
        variant="danger"
        loading={emptying}
      />
    </div>
  );
}
