"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, ExternalLink } from "lucide-react";

import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio } from "@/hooks";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default function PreviewPortfolioPage({ params }: PreviewPageProps) {
  const { id } = use(params);
  const { portfolio, isLoading, error } = usePortfolio(id);

  if (isLoading || (!portfolio && !error)) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <p className="text-muted-foreground">{error ?? "Portfolio not found."}</p>
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/dashboard/portfolios"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <span className="text-sm font-semibold">{portfolio.title} — Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={`/dashboard/portfolios/${id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />Edit
            </Link>
          </Button>
          {portfolio.status === "PUBLISHED" && portfolio.user.username && (
            <Button size="sm" className="gap-1.5" asChild>
              <a href={`/portfolio/${portfolio.user.username}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />View Live
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto">
        <PortfolioRenderer portfolio={portfolio} />
      </div>
    </div>
  );
}
