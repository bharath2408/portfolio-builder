"use client";

import { useSession } from "next-auth/react";
import { use } from "react";

import { BuilderWorkspace } from "@/components/builder/builder-workspace";
import { usePortfolio } from "@/hooks";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

// ── Full-screen studio skeleton ────────────────────────────────────
function StudioLoader() {
  const { data: session } = useSession();
  const isDark = (session?.user?.theme ?? "light") === "dark";

  // Colors based on theme
  const bg = isDark ? "#09090b" : "#f5f3ef";
  const panelBg = isDark ? "#0c0c10" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const shimmerSoft = isDark ? "bg-zinc-800/40" : "bg-stone-200";
  const shimmerFaint = isDark ? "bg-zinc-800/30" : "bg-stone-200/70";
  const shimmerSubtle = isDark ? "bg-zinc-800/20" : "bg-stone-200/50";
  const textColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)";
  const frameBg = isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.02)";
  const frameBorder = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
  const frameShadow = isDark
    ? "0 2px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)"
    : "0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)";
  const dotColor = isDark ? "bg-zinc-700/50" : "bg-stone-400/40";
  const hintBg = isDark ? "rgba(9,9,11,0.7)" : "rgba(255,255,255,0.85)";
  const hintBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
  const progressTrack = isDark ? "bg-zinc-800/50" : "bg-stone-300/50";
  const canvasGlow1 = isDark ? "rgba(6,182,212,0.025)" : "rgba(13,148,136,0.03)";
  const canvasGlow2 = isDark ? "rgba(139,92,246,0.015)" : "rgba(139,92,246,0.02)";
  const iconBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const iconBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const toolbarItemBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const bottomBarBg = isDark ? "#18181b" : "#ffffff";
  const bottomBarBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const bottomBarShadow = "0 4px 24px rgba(0,0,0,0.25)";

  return (
    <div className="flex h-screen w-screen flex-col" style={{ backgroundColor: bg }}>
      {/* ── Top Toolbar: Back | File, View | Undo, Redo || Title+Status || Device | Theme | SEO, Preview, Save, Publish ── */}
      <div
        className="flex h-12 items-center justify-between px-3"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        {/* Left: Back + divider + File + View + divider + Undo + Redo */}
        <div className="flex items-center gap-1">
          <div className={`h-8 w-8 animate-pulse rounded-lg ${shimmerSoft}`} />
          <div className="mx-0.5 h-4 w-px" style={{ backgroundColor: border }} />
          <div className={`h-7 w-10 animate-pulse rounded-md ${shimmerSoft}`} />
          <div className={`h-7 w-10 animate-pulse rounded-md ${shimmerSoft}`} />
          <div className="mx-0.5 h-4 w-px" style={{ backgroundColor: border }} />
          <div className={`h-8 w-8 animate-pulse rounded-lg ${shimmerFaint}`} />
          <div className={`h-8 w-8 animate-pulse rounded-lg ${shimmerFaint}`} />
        </div>

        {/* Center: Title + Status badge */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
          <div className="flex items-center gap-2">
            <div className={`h-4 w-28 animate-pulse rounded ${shimmerSoft}`} />
            <div className="h-5 w-14 animate-pulse rounded-full bg-teal-500/10" />
          </div>
        </div>

        {/* Right: Device toggle | Theme | divider | SEO | Preview | Save | Publish */}
        <div className="flex items-center gap-2">
          {/* Device preview toggle */}
          <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: toolbarItemBg }}>
            <div className={`h-7 w-7 animate-pulse rounded-md ${shimmerFaint}`} />
            <div className={`h-7 w-7 animate-pulse rounded-md ${shimmerFaint}`} />
            <div className={`h-7 w-7 animate-pulse rounded-md ${shimmerFaint}`} />
          </div>
          <div className="mx-1 h-4 w-px" style={{ backgroundColor: border }} />
          {/* Theme toggle */}
          <div className={`h-8 w-8 animate-pulse rounded-lg ${shimmerFaint}`} />
          <div className="h-4 w-px" style={{ backgroundColor: border }} />
          {/* SEO */}
          <div className={`h-8 w-14 animate-pulse rounded-lg ${shimmerFaint}`} />
          {/* Preview */}
          <div className={`h-8 w-20 animate-pulse rounded-lg ${shimmerSoft}`} />
          {/* Save */}
          <div className={`h-8 w-16 animate-pulse rounded-lg ${shimmerSoft}`} />
          {/* Publish */}
          <div className="h-8 w-20 animate-pulse rounded-lg bg-gradient-to-r from-teal-500/15 to-cyan-500/15" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div
          className="flex w-56 flex-shrink-0 flex-col"
          style={{ backgroundColor: panelBg, borderRight: `1px solid ${border}` }}
        >
          {/* Tab bar */}
          <div className="flex" style={{ borderBottom: `1px solid ${border}` }}>
            <div className="flex flex-1 items-center justify-center gap-1.5 py-2.5">
              <div className="h-3 w-3 animate-pulse rounded bg-teal-500/20" />
              <div className="h-2.5 w-12 animate-pulse rounded bg-teal-500/20" />
            </div>
            <div className="flex flex-1 items-center justify-center gap-1.5 py-2.5">
              <div className={`h-3 w-3 animate-pulse rounded ${shimmerFaint}`} />
              <div className={`h-2.5 w-16 animate-pulse rounded ${shimmerFaint}`} />
            </div>
          </div>
          {/* Layer items */}
          <div className="space-y-0.5 p-2 pt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md px-2 py-2">
                <div className={`h-3 w-3 animate-pulse rounded ${shimmerSoft}`} />
                <div className={`h-1.5 w-1.5 animate-pulse rounded-full ${shimmerSoft}`} />
                <div
                  className={`h-3 animate-pulse rounded ${shimmerFaint}`}
                  style={{ width: `${60 + i * 15}px`, animationDelay: `${i * 150}ms` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div
          className="relative flex flex-1 items-center justify-center"
          style={{
            backgroundColor: bg,
            backgroundImage: `radial-gradient(ellipse at 25% 15%, ${canvasGlow1} 0%, transparent 50%), radial-gradient(ellipse at 75% 85%, ${canvasGlow2} 0%, transparent 50%)`,
          }}
        >
          {/* Frame skeleton */}
          <div
            className="flex h-[65%] w-[55%] flex-col overflow-hidden rounded-xl"
            style={{
              backgroundColor: frameBg,
              border: `1px solid ${frameBorder}`,
              boxShadow: frameShadow,
            }}
          >
            {/* Frame label */}
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
              <div className={`h-2 w-16 animate-pulse rounded ${shimmerFaint}`} />
            </div>

            {/* Frame content */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
              {/* Animated spinner */}
              <div className="relative h-12 w-12">
                <div
                  className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-teal-500/50"
                  style={{ animationDuration: "1.2s" }}
                />
                <div
                  className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-cyan-400/40"
                  style={{ animationDirection: "reverse", animationDuration: "1.8s" }}
                />
                <div
                  className="absolute inset-4 animate-spin rounded-full border border-transparent border-l-violet-400/30"
                  style={{ animationDuration: "2.4s" }}
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <p
                  className="text-[13px] font-medium tracking-wide"
                  style={{ color: textColor }}
                >
                  Loading studio...
                </p>
                {/* Progress bar */}
                <div className={`h-0.5 w-32 overflow-hidden rounded-full ${progressTrack}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500/50 to-cyan-400/50"
                    style={{
                      animation: "studioProgress 2s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom design toolbar skeleton */}
          <div
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-xl px-1.5 py-1"
            style={{
              backgroundColor: bottomBarBg,
              border: `1px solid ${bottomBarBorder}`,
              boxShadow: bottomBarShadow,
            }}
          >
            {/* Cursor tool */}
            <div className={`h-9 w-9 animate-pulse rounded-lg ${shimmerSoft}`} />
            <div className="mx-0.5 h-5 w-px" style={{ backgroundColor: border }} />
            {/* Shape tools: rect, circle, line */}
            <div className={`h-9 w-9 animate-pulse rounded-lg ${shimmerFaint}`} />
            <div className={`h-9 w-9 animate-pulse rounded-lg ${shimmerFaint}`} />
            <div className={`h-9 w-9 animate-pulse rounded-lg ${shimmerFaint}`} />
            <div className="mx-0.5 h-5 w-px" style={{ backgroundColor: border }} />
            {/* Quick-add: H, T, img, btn */}
            <div className={`h-9 w-9 animate-pulse rounded-lg ${shimmerFaint}`} />
            <div className={`h-9 w-9 animate-pulse rounded-lg ${shimmerFaint}`} />
            <div className={`h-9 w-9 animate-pulse rounded-lg ${shimmerFaint}`} />
            <div className={`h-9 w-9 animate-pulse rounded-lg ${shimmerFaint}`} />
          </div>

          {/* Keyboard hints */}
          <div
            className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg px-3 py-1.5"
            style={{
              backgroundColor: hintBg,
              border: `1px solid ${hintBorder}`,
            }}
          >
            {["Scroll", "Ctrl+Scroll", "Space"].map((key) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`h-2.5 animate-pulse rounded ${shimmerSoft}`} style={{ width: `${key.length * 5 + 10}px` }} />
                <div className={`h-2 w-6 animate-pulse rounded ${shimmerSubtle}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div
          className="flex w-72 flex-shrink-0 flex-col items-center justify-center px-8"
          style={{ backgroundColor: panelBg, borderLeft: `1px solid ${border}` }}
        >
          <div
            className="mb-4 flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl"
            style={{ backgroundColor: iconBg, border: `1px solid ${iconBorder}` }}
          >
            <div className={`h-5 w-5 rounded ${shimmerSoft}`} />
          </div>
          <div className={`h-3.5 w-32 animate-pulse rounded ${shimmerFaint}`} />
          <div className={`mt-2 h-2.5 w-44 animate-pulse rounded ${shimmerSubtle}`} />
        </div>
      </div>

      <style jsx>{`
        @keyframes studioProgress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function EditPortfolioPage({ params }: EditPageProps) {
  const { id } = use(params);
  const { portfolio, isLoading, error } = usePortfolio(id);

  if (isLoading || (!portfolio && !error)) {
    return <StudioLoader />;
  }

  if (error || !portfolio) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f5f3ef] dark:bg-[#09090b]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-white">Portfolio not found</h2>
          <p className="mt-1 text-stone-500 dark:text-zinc-500">
            {error ?? "The portfolio you're looking for doesn't exist."}
          </p>
        </div>
      </div>
    );
  }

  return <BuilderWorkspace portfolio={portfolio} />;
}
