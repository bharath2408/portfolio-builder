"use client";

import { PDFViewer, pdf } from "@react-pdf/renderer";
import { Download, FileText, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ResumePDF } from "@/components/resume/resume-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolios } from "@/hooks";
import { apiGet } from "@/lib/api";
import { extractResumeData } from "@/lib/utils/extract-resume";
import type { PortfolioWithRelations } from "@/types";

// ─── Page ──────────────────────────────────────────────────────────

export default function ResumePage() {
  const { data: session } = useSession();
  const { portfolios, isLoading: loadingList } = usePortfolios();

  const [selectedId, setSelectedId] = useState<string>("");
  const [portfolio, setPortfolio] = useState<PortfolioWithRelations | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Hydration guard for PDFViewer (iframe-based, client-only)
  useEffect(() => setMounted(true), []);

  // Fetch full portfolio when selection changes
  const fetchPortfolio = useCallback(async (id: string) => {
    if (!id) {
      setPortfolio(null);
      return;
    }
    setLoadingPortfolio(true);
    try {
      const data = await apiGet<PortfolioWithRelations>(`/portfolios/${id}`);
      setPortfolio(data);
      // Use the portfolio theme's primary color as default accent if available
      if (data.theme?.primaryColor) {
        setAccentColor(data.theme.primaryColor);
      }
    } catch {
      setPortfolio(null);
    } finally {
      setLoadingPortfolio(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchPortfolio(selectedId);
    else setPortfolio(null);
  }, [selectedId, fetchPortfolio]);

  // Extract resume data
  const resumeData = useMemo(() => {
    if (!portfolio) return null;
    return extractResumeData(portfolio, {
      name: session?.user?.name,
      email: session?.user?.email,
      bio: (session?.user as Record<string, unknown>)?.bio as string | null ?? null,
    });
  }, [portfolio, session?.user]);

  // Check if the resume has meaningful content
  const hasContent = resumeData
    ? resumeData.experience.length > 0 ||
      resumeData.projects.length > 0 ||
      resumeData.skills.length > 0 ||
      resumeData.technologies.length > 0 ||
      !!resumeData.summary
    : false;

  // Download handler
  const handleDownload = useCallback(async () => {
    if (!resumeData) return;
    setDownloading(true);
    try {
      const blob = await pdf(
        <ResumePDF data={resumeData} accentColor={accentColor} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.name.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setDownloading(false);
    }
  }, [resumeData, accentColor]);

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-emerald-500/5 via-card to-green-500/5 px-8 py-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-green-500/[0.04] blur-3xl" />
        <div className="relative flex items-start gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/5">
            <FileText className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Resume Generator
            </h1>
            <p className="max-w-lg text-[14px] leading-relaxed text-muted-foreground">
              Generate a professional PDF resume from your portfolio data.
              Select a portfolio, customize the accent color, and download.
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Portfolio selector */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="portfolio-select"
            className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Portfolio
          </label>
          {loadingList ? (
            <Skeleton className="h-10 w-64 rounded-lg" />
          ) : (
            <select
              id="portfolio-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-10 w-64 rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            >
              <option value="">Select a portfolio...</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Accent color */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="accent-color"
            className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Accent Color
          </label>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-border/60 bg-background px-2">
            <input
              id="accent-color"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-none bg-transparent"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setAccentColor(v);
              }}
              className="w-20 bg-transparent text-[13px] text-foreground outline-none"
              maxLength={7}
            />
          </div>
        </div>

        {/* Download button */}
        {resumeData && hasContent && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-5 text-[13px] font-semibold text-white shadow-sm shadow-emerald-500/20 transition-all hover:shadow-md hover:shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </button>
        )}
      </div>

      {/* ── Preview / Empty states ──────────────────────────── */}
      <div className="min-h-[600px] overflow-hidden rounded-2xl border border-border/40 bg-card">
        {!selectedId && (
          <div className="flex h-[600px] flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-[14px] font-medium text-muted-foreground">
              Select a portfolio above to generate your resume
            </p>
          </div>
        )}

        {selectedId && loadingPortfolio && (
          <div className="flex h-[600px] flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-[13px] text-muted-foreground">
              Loading portfolio data...
            </p>
          </div>
        )}

        {selectedId && !loadingPortfolio && portfolio && !hasContent && (
          <div className="flex h-[600px] flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-[14px] font-medium text-muted-foreground">
              Add experience, skills, and projects to your portfolio to generate
              a resume
            </p>
          </div>
        )}

        {selectedId &&
          !loadingPortfolio &&
          resumeData &&
          hasContent &&
          mounted && (
            <PDFViewer
              width="100%"
              height={700}
              showToolbar={false}
              style={{ border: "none" }}
            >
              <ResumePDF data={resumeData} accentColor={accentColor} />
            </PDFViewer>
          )}
      </div>
    </div>
  );
}
