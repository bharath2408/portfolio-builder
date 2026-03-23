"use client";

import { ArrowLeft, Inbox, Mail } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href={`/dashboard/portfolios`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Contact Submissions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Messages from your portfolio contact form
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No submissions yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            When visitors submit your contact form, their messages will appear
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className={cn(
                "rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20",
              )}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{sub.name}</p>
                  <a
                    href={`mailto:${sub.email}`}
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {sub.email}
                  </a>
                </div>
                <time className="text-[11px] text-muted-foreground">
                  {new Date(sub.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {sub.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
