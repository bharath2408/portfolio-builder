import { Skeleton } from "@/components/ui/skeleton";

export default function EditLoading() {
  return (
    <div className="flex h-screen w-screen flex-col bg-[#f5f3ef] dark:bg-[#09090b]">
      {/* ── Top toolbar (h-12) ──────────────────────────────────── */}
      <div className="flex h-12 items-center justify-between border-b border-black/[0.07] px-3 dark:border-white/[0.06]">
        {/* Left: Back+Logo | divider | File View | divider | Undo Redo */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-3.5 w-3.5 rounded bg-black/[0.06] dark:bg-zinc-800/40" />
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-teal-500/20 to-cyan-500/15">
              <Skeleton className="h-3 w-3 rounded bg-teal-500/30" />
            </div>
          </div>
          <div className="mx-0.5 h-4 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
          <Skeleton className="h-7 w-[30px] rounded-md bg-black/[0.04] dark:bg-zinc-800/30" />
          <Skeleton className="h-7 w-[34px] rounded-md bg-black/[0.04] dark:bg-zinc-800/30" />
          <div className="mx-0.5 h-4 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
          <Skeleton className="h-7 w-7 rounded-md bg-black/[0.04] dark:bg-zinc-800/30" />
          <Skeleton className="h-7 w-7 rounded-md bg-black/[0.04] dark:bg-zinc-800/30" />
        </div>

        {/* Center: Portfolio title + status badge */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-4 w-32 rounded bg-black/[0.05] dark:bg-zinc-800/30" />
            <Skeleton className="h-[18px] w-16 rounded-full bg-teal-500/10" />
          </div>
        </div>

        {/* Right: Devices | divider | theme | divider | SEO Preview Save Publish | divider | avatar */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg bg-black/[0.03] p-0.5 dark:bg-zinc-800/20">
            <Skeleton className="h-7 w-7 rounded-md bg-black/[0.05] dark:bg-zinc-800/40" />
            <Skeleton className="h-7 w-7 rounded-md bg-black/[0.03] dark:bg-zinc-800/25" />
            <Skeleton className="h-7 w-7 rounded-md bg-black/[0.03] dark:bg-zinc-800/25" />
          </div>
          <div className="mx-0.5 h-4 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
          <Skeleton className="h-8 w-8 rounded-lg bg-black/[0.04] dark:bg-zinc-800/30" />
          <div className="h-4 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
          <Skeleton className="h-8 w-[42px] rounded-lg bg-black/[0.04] dark:bg-zinc-800/30" />
          <Skeleton className="h-8 w-[62px] rounded-lg bg-black/[0.04] dark:bg-zinc-800/30" />
          <Skeleton className="h-8 w-[50px] rounded-lg bg-black/[0.04] dark:bg-zinc-800/30" />
          <Skeleton className="h-8 w-[68px] rounded-lg bg-gradient-to-r from-teal-500/15 to-cyan-500/12" />
          <div className="mx-0.5 h-4 w-px bg-black/[0.07] dark:bg-white/[0.06]" />
          <Skeleton className="h-7 w-7 rounded-full bg-black/[0.06] dark:bg-zinc-800/40" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel (w-60) ─────────────────────────────────── */}
        <div className="flex w-60 flex-shrink-0 flex-col border-r border-black/[0.07] bg-white dark:border-white/[0.06] dark:bg-[#0c0c10]">
          {/* Tabs: Layers | Elements */}
          <div className="flex border-b border-black/[0.07] dark:border-white/[0.06]">
            <div className="flex flex-1 items-center justify-center gap-1.5 py-2.5">
              <Skeleton className="h-3 w-3 rounded bg-teal-500/25" />
              <Skeleton className="h-2.5 w-11 rounded bg-teal-500/20" />
            </div>
            <div className="flex flex-1 items-center justify-center gap-1.5 py-2.5">
              <Skeleton className="h-3 w-3 rounded bg-black/[0.05] dark:bg-zinc-800/25" />
              <Skeleton className="h-2.5 w-14 rounded bg-black/[0.04] dark:bg-zinc-800/20" />
            </div>
          </div>
          {/* Layer items */}
          <div className="space-y-px p-2 pt-3">
            {[70, 52, 85, 44, 66].map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md px-2 py-[7px]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <Skeleton className="h-3 w-3 rounded bg-black/[0.05] dark:bg-zinc-800/30" />
                <div className="h-1.5 w-1.5 rounded-full bg-black/[0.06] dark:bg-zinc-700/40" />
                <Skeleton className="h-2.5 rounded bg-black/[0.05] dark:bg-zinc-800/25" style={{ width: w }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Canvas area ──────────────────────────────────────── */}
        <div className="relative flex flex-1 items-center justify-center bg-[#f5f3ef] dark:bg-[#09090b]">
          {/* Frame skeleton */}
          <div className="flex h-[60%] w-[50%] flex-col overflow-hidden rounded-xl border border-black/[0.05] bg-black/[0.015] shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:border-white/[0.04] dark:bg-white/[0.01] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
            {/* Frame label */}
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-stone-300/60 dark:bg-zinc-700/40" />
              <Skeleton className="h-2 w-14 bg-black/[0.04] dark:bg-zinc-800/25" />
            </div>
            {/* Loading spinner */}
            <div className="flex flex-1 flex-col items-center justify-center gap-5">
              <div className="relative h-10 w-10">
                <div
                  className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-teal-500/40"
                  style={{ animationDuration: "1.2s" }}
                />
                <div
                  className="absolute inset-[6px] animate-spin rounded-full border-[1.5px] border-transparent border-b-cyan-400/30"
                  style={{ animationDirection: "reverse", animationDuration: "1.8s" }}
                />
              </div>
              <Skeleton className="h-2.5 w-28 bg-black/[0.04] dark:bg-zinc-800/20" />
            </div>
          </div>

          {/* Zoom controls — bottom left (matches .builder-zoom-controls) */}
          <div
            className="absolute bottom-3 left-3 z-10 flex items-center gap-0.5 rounded-lg px-1 py-0.5"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
          >
            <Skeleton className="h-7 w-7 rounded-md bg-black/[0.05] dark:bg-zinc-800/30" />
            <Skeleton className="h-7 min-w-[52px] rounded-md bg-black/[0.04] dark:bg-zinc-800/25" />
            <Skeleton className="h-7 w-7 rounded-md bg-black/[0.05] dark:bg-zinc-800/30" />
          </div>
        </div>

        {/* ── Right panel (w-72) ───────────────────────────────── */}
        <div className="flex w-72 flex-shrink-0 flex-col items-center justify-center border-l border-black/[0.07] bg-white px-8 dark:border-white/[0.06] dark:bg-[#0c0c10]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-black/[0.05] bg-black/[0.02] dark:border-white/[0.04] dark:bg-white/[0.02]">
            <Skeleton className="h-4 w-4 rounded bg-black/[0.06] dark:bg-zinc-800/30" />
          </div>
          <Skeleton className="h-3 w-28 bg-black/[0.05] dark:bg-zinc-800/25" />
          <Skeleton className="mt-2 h-2.5 w-40 bg-black/[0.04] dark:bg-zinc-800/15" />
        </div>
      </div>
    </div>
  );
}
