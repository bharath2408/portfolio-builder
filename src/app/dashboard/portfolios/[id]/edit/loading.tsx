import { Skeleton } from "@/components/ui/skeleton";

export default function EditLoading() {
  return (
    <div className="flex h-screen w-screen flex-col bg-[#f5f3ef] dark:bg-[#09090b]">
      {/* ── Top toolbar ──────────────────────────────────────────── */}
      <div className="flex h-12 items-center justify-between border-b border-black/[0.07] px-3 dark:border-white/[0.06]">
        {/* Left: Back + File + View + divider + Undo/Redo */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8 rounded-lg bg-black/5 dark:bg-zinc-800/50" />
          <div className="mx-0.5 h-4 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
          <Skeleton className="h-7 w-10 rounded-md bg-black/5 dark:bg-zinc-800/40" />
          <Skeleton className="h-7 w-10 rounded-md bg-black/5 dark:bg-zinc-800/40" />
          <div className="mx-0.5 h-4 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
          <Skeleton className="h-8 w-8 rounded-lg bg-black/5 dark:bg-zinc-800/40" />
          <Skeleton className="h-8 w-8 rounded-lg bg-black/5 dark:bg-zinc-800/40" />
        </div>

        {/* Center: Title + Status */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 bg-black/5 dark:bg-zinc-800/40" />
            <Skeleton className="h-5 w-14 rounded-full bg-teal-500/10" />
          </div>
        </div>

        {/* Right: Device toggle + Theme + SEO + Preview + Save + Publish */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-black/[0.07] p-0.5 dark:border-white/[0.06]">
            <Skeleton className="h-7 w-7 rounded-md bg-black/5 dark:bg-zinc-800/40" />
            <Skeleton className="h-7 w-7 rounded-md bg-black/5 dark:bg-zinc-800/40" />
            <Skeleton className="h-7 w-7 rounded-md bg-black/5 dark:bg-zinc-800/40" />
          </div>
          <div className="mx-1 h-4 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
          <Skeleton className="h-8 w-8 rounded-lg bg-black/5 dark:bg-zinc-800/40" />
          <div className="h-4 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
          <Skeleton className="h-8 w-14 rounded-lg bg-black/5 dark:bg-zinc-800/40" />
          <Skeleton className="h-8 w-20 rounded-lg bg-black/5 dark:bg-zinc-800/40" />
          <Skeleton className="h-8 w-16 rounded-lg bg-black/5 dark:bg-zinc-800/40" />
          <Skeleton className="h-8 w-20 rounded-lg bg-gradient-to-r from-teal-500/15 to-cyan-500/15" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel ───────────────────────────────────────────── */}
        <div className="flex w-56 flex-shrink-0 flex-col border-r border-black/[0.07] bg-white dark:border-white/[0.06] dark:bg-[#0c0c10]">
          {/* Tab bar */}
          <div className="flex border-b border-black/[0.07] dark:border-white/[0.06]">
            <div className="flex flex-1 items-center justify-center gap-1.5 py-2.5">
              <Skeleton className="h-3 w-3 rounded bg-teal-500/20" />
              <Skeleton className="h-2.5 w-12 rounded bg-teal-500/20" />
            </div>
            <div className="flex flex-1 items-center justify-center gap-1.5 py-2.5">
              <Skeleton className="h-3 w-3 rounded bg-black/5 dark:bg-zinc-800/30" />
              <Skeleton className="h-2.5 w-16 rounded bg-black/5 dark:bg-zinc-800/30" />
            </div>
          </div>
          {/* Layer items */}
          <div className="space-y-0.5 p-2 pt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md px-2 py-2">
                <Skeleton className="h-3 w-3 rounded bg-black/5 dark:bg-zinc-800/40" />
                <Skeleton className="h-1.5 w-1.5 rounded-full bg-black/5 dark:bg-zinc-800/40" />
                <Skeleton
                  className="h-3 rounded bg-black/5 dark:bg-zinc-800/30"
                  style={{ width: `${60 + i * 15}px` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Canvas area ──────────────────────────────────────────── */}
        <div className="relative flex flex-1 items-center justify-center bg-[#f5f3ef] dark:bg-[#09090b]">
          {/* Frame skeleton */}
          <div className="flex h-[65%] w-[55%] flex-col overflow-hidden rounded-xl border border-black/[0.05] bg-black/[0.02] shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:border-white/[0.04] dark:bg-white/[0.015] dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
            {/* Frame label */}
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-stone-400/40 dark:bg-zinc-700/50" />
              <Skeleton className="h-2 w-16 bg-black/5 dark:bg-zinc-800/30" />
            </div>
            {/* Frame content */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
              <div className="relative h-12 w-12">
                <div
                  className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-teal-500/50"
                  style={{ animationDuration: "1.2s" }}
                />
                <div
                  className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-cyan-400/40"
                  style={{ animationDirection: "reverse", animationDuration: "1.8s" }}
                />
              </div>
              <Skeleton className="h-3 w-32 bg-black/5 dark:bg-zinc-800/30" />
            </div>
          </div>

          {/* Bottom design toolbar skeleton */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-black/[0.07] bg-white px-1.5 py-1 shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:border-white/[0.06] dark:bg-[#18181b]">
            <Skeleton className="h-9 w-9 rounded-lg bg-black/5 dark:bg-zinc-800/40" />
            <div className="mx-0.5 h-5 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
            <Skeleton className="h-9 w-9 rounded-lg bg-black/5 dark:bg-zinc-800/30" />
            <Skeleton className="h-9 w-9 rounded-lg bg-black/5 dark:bg-zinc-800/30" />
            <Skeleton className="h-9 w-9 rounded-lg bg-black/5 dark:bg-zinc-800/30" />
            <div className="mx-0.5 h-5 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
            <Skeleton className="h-9 w-9 rounded-lg bg-black/5 dark:bg-zinc-800/30" />
            <Skeleton className="h-9 w-9 rounded-lg bg-black/5 dark:bg-zinc-800/30" />
            <Skeleton className="h-9 w-9 rounded-lg bg-black/5 dark:bg-zinc-800/30" />
            <Skeleton className="h-9 w-9 rounded-lg bg-black/5 dark:bg-zinc-800/30" />
          </div>
        </div>

        {/* ── Right panel ──────────────────────────────────────────── */}
        <div className="flex w-72 flex-shrink-0 flex-col items-center justify-center border-l border-black/[0.07] bg-white px-8 dark:border-white/[0.06] dark:bg-[#0c0c10]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.05] bg-black/[0.03] dark:border-white/[0.05] dark:bg-white/[0.03]">
            <Skeleton className="h-5 w-5 rounded bg-black/5 dark:bg-zinc-800/40" />
          </div>
          <Skeleton className="h-3.5 w-32 bg-black/5 dark:bg-zinc-800/30" />
          <Skeleton className="mt-2 h-2.5 w-44 bg-black/5 dark:bg-zinc-800/20" />
        </div>
      </div>
    </div>
  );
}
