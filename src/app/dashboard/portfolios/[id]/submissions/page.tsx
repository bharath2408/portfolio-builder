"use client";

import { ArrowLeft, Check, Inbox, Mail, User } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<Submission[]>(`/portfolios/${id}/submissions`)
      .then((res) => {
        if (!cancelled) setSubmissions(res);
      })
      .catch(() => {
        if (!cancelled) setSubmissions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const markAllRead = useCallback(async () => {
    try {
      await apiPost("/notifications/mark-read", {});
      setSubmissions((prev) => prev.map((s) => ({ ...s, isRead: true })));
    } catch {}
  }, []);

  const unreadCount = submissions.filter((s) => !s.isRead).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-rose-500/5 via-card to-orange-500/5 px-8 py-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-500/[0.04] blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-start gap-5">
            <Link
              href="/dashboard/portfolios"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 shadow-lg shadow-rose-500/5 transition-colors hover:bg-rose-500/15"
            >
              <Mail className="h-6 w-6 text-rose-400" />
            </Link>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Contact Submissions
                </h1>
                {unreadCount > 0 && (
                  <span className="flex h-6 items-center rounded-full bg-teal-500/10 px-2.5 text-[11px] font-bold text-teal-500 ring-1 ring-teal-500/20">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Messages from visitors who reached out through your portfolio contact form.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-card px-4 text-[12px] font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.97]"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            <Link
              href="/dashboard/portfolios"
              className="flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-card px-4 text-[12px] font-medium text-muted-foreground shadow-sm transition-all hover:text-foreground active:scale-[0.97]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-border/40 bg-card p-6"
            >
              <div className="flex gap-4">
                <div
                  className="h-10 w-10 animate-pulse rounded-full bg-muted/50"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-28 animate-pulse rounded bg-muted/50"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                      <div
                        className="h-3.5 w-36 animate-pulse rounded bg-muted/30"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    </div>
                    <div
                      className="h-3.5 w-20 animate-pulse rounded bg-muted/30"
                      style={{ animationDelay: `${i * 180}ms` }}
                    />
                  </div>
                  <div
                    className="h-4 w-4/5 animate-pulse rounded bg-muted/30"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                  <div
                    className="h-4 w-3/5 animate-pulse rounded bg-muted/20"
                    style={{ animationDelay: `${i * 160}ms` }}
                  />
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.03) 37%, transparent 63%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.8s ease-in-out infinite",
                  animationDelay: `${i * 200}ms`,
                }}
              />
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border/40 bg-muted/20 py-24">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm">
            <Inbox className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-[16px] font-semibold text-foreground">
              No submissions yet
            </p>
            <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              When visitors submit your contact form, their messages will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className={cn(
                "group rounded-xl border bg-card p-6 transition-all duration-200",
                sub.isRead
                  ? "border-border/40 hover:border-border/60"
                  : "border-primary/20 bg-primary/[0.02] hover:border-primary/30",
              )}
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    sub.isRead
                      ? "bg-muted/60 text-muted-foreground/60"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <User className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-[14px]",
                            sub.isRead
                              ? "font-medium text-foreground/80"
                              : "font-semibold text-foreground",
                          )}
                        >
                          {sub.name}
                        </p>
                        {!sub.isRead && (
                          <span className="h-2 w-2 rounded-full bg-teal-500 shadow-sm shadow-teal-500/40" />
                        )}
                      </div>
                      <a
                        href={`mailto:${sub.email}`}
                        className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-primary/80 transition-colors hover:text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {sub.email}
                      </a>
                    </div>
                    <time className="shrink-0 text-[11px] font-medium text-muted-foreground/60">
                      {formatRelativeTime(sub.createdAt)}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                    {sub.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
