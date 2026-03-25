"use client";

import { Download, ExternalLink, Loader2, Moon, Sun, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";


import { type CommunityTemplate, getAuthorName } from "@/lib/api/community-templates";
import { cn } from "@/lib/utils";

// ─── Category Config ─────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  DEVELOPER: "Developer",
  DESIGNER: "Designer",
  WRITER: "Writer",
  OTHER: "Other",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DEVELOPER: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  DESIGNER: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/20",
  },
  WRITER: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  OTHER: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
  },
};

// ─── Gradient Thumbnails ─────────────────────────────────────────

const PLACEHOLDER_GRADIENTS: Record<string, string> = {
  DEVELOPER:
    "from-slate-900 via-cyan-950 to-slate-900 [background-image:radial-gradient(ellipse_at_30%_40%,rgba(6,182,212,0.18)_0%,transparent_60%),radial-gradient(ellipse_at_80%_70%,rgba(99,102,241,0.12)_0%,transparent_60%)]",
  DESIGNER:
    "from-slate-900 via-violet-950 to-slate-900 [background-image:radial-gradient(ellipse_at_60%_30%,rgba(139,92,246,0.2)_0%,transparent_60%),radial-gradient(ellipse_at_20%_80%,rgba(236,72,153,0.1)_0%,transparent_60%)]",
  WRITER:
    "from-slate-900 via-amber-950 to-slate-900 [background-image:radial-gradient(ellipse_at_50%_20%,rgba(245,158,11,0.18)_0%,transparent_60%),radial-gradient(ellipse_at_80%_80%,rgba(234,88,12,0.1)_0%,transparent_60%)]",
  OTHER:
    "from-slate-900 via-slate-800 to-slate-900 [background-image:radial-gradient(ellipse_at_40%_50%,rgba(100,116,139,0.2)_0%,transparent_60%)]",
};

// ─── Placeholder Grid Pattern ─────────────────────────────────────

const FALLBACK_COLORS = CATEGORY_COLORS.OTHER!;

function PlaceholderThumbnail({ category }: { category: string }) {
  const gradient = PLACEHOLDER_GRADIENTS[category] ?? PLACEHOLDER_GRADIENTS.OTHER ?? "";
  const catColors = CATEGORY_COLORS[category] ?? FALLBACK_COLORS;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-br",
        gradient,
      )}
    >
      {/* Faint grid lines */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl border",
            catColors.bg,
            catColors.border,
          )}
        >
          <span className={cn("text-xl font-bold", catColors.text)}>
            {(CATEGORY_LABELS[category] ?? "?")[0]}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────

export interface TemplateCardProps {
  template: CommunityTemplate;
  onUse: (id: string) => void;
  showPreview?: boolean;
  loading?: boolean;
}

// ─── Component ───────────────────────────────────────────────────

export function TemplateCard({ template, onUse, showPreview = true, loading = false }: TemplateCardProps) {
  const [imgError, setImgError] = useState(false);

  const author = getAuthorName(template.user);
  const catConfig = CATEGORY_COLORS[template.category] ?? FALLBACK_COLORS;
  const catLabel = CATEGORY_LABELS[template.category] ?? template.category;
  const showImage = !!template.thumbnail && !imgError;

  const previewUrl = `/community/preview/${template.id}`;
  const canPreview = showPreview;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl",
        "border border-border/60 bg-card",
        "transition-all duration-200",
        "hover:border-border hover:shadow-lg hover:shadow-black/20",
        "focus-within:border-primary/50",
      )}
    >
      {/* ── Thumbnail ─────────────────────────────────────────── */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {showImage ? (
          <Image
            src={template.thumbnail!}
            alt={`${template.name} preview`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <PlaceholderThumbnail category={template.category} />
        )}

        {/* Dark/Light theme badge — top-right overlay */}
        <div className="absolute right-2.5 top-2.5">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
              template.isDark
                ? "border-white/10 bg-black/50 text-slate-300"
                : "border-black/10 bg-white/70 text-slate-700",
            )}
          >
            {template.isDark ? (
              <Moon className="h-2.5 w-2.5" />
            ) : (
              <Sun className="h-2.5 w-2.5" />
            )}
            {template.isDark ? "Dark" : "Light"}
          </span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Category + use count */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              catConfig.bg,
              catConfig.text,
              catConfig.border,
            )}
          >
            {catLabel}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Download className="h-3 w-3" />
            <span>{template.useCount.toLocaleString()}</span>
          </span>
        </div>

        {/* Name */}
        <h3 className="line-clamp-1 text-[14px] font-semibold leading-snug text-foreground">
          {template.name}
        </h3>

        {/* Description */}
        {template.description && (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {template.description}
          </p>
        )}

        {/* Author */}
        <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">
            by{" "}
            <span className="font-medium text-foreground/70">{author}</span>
          </span>
        </p>

        {/* Tags (if any) */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Footer Actions ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-t border-border/60 px-4 py-3">
        <button
          type="button"
          onClick={() => onUse(template.id)}
          disabled={loading}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all duration-150",
            "bg-primary text-primary-foreground",
            "hover:opacity-90 active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Applying…</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>Use Template</span>
            </>
          )}
        </button>

        {canPreview && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border border-border/80 px-3 py-2 text-[12px] font-medium",
              "text-muted-foreground transition-all duration-150",
              "hover:border-border hover:text-foreground",
              "active:scale-[0.98]",
            )}
            aria-label={`Preview ${template.name}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Preview</span>
          </a>
        )}
      </div>

    </article>
  );
}
