import { Skeleton } from "@/components/ui/skeleton";

export default function EditLoading() {
  return (
    <div className="flex h-screen w-screen flex-col bg-[#f5f3ef] dark:bg-[#09090b]">
      {/* Top toolbar */}
      <div
        className="flex h-12 items-center justify-between border-b border-black/5 px-4 dark:border-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-lg bg-black/5 dark:bg-zinc-800/50" />
          <Skeleton className="h-4 w-32 bg-black/5 dark:bg-zinc-800/40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-md bg-black/5 dark:bg-zinc-800/40" />
          <Skeleton className="h-7 w-20 rounded-md bg-black/5 dark:bg-zinc-800/40" />
          <Skeleton className="h-7 w-24 rounded-md bg-teal-500/10" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div
          className="w-[260px] flex-shrink-0 border-r border-black/5 bg-white p-4 dark:border-white/[0.06] dark:bg-[#0c0c10]"
        >
          <Skeleton className="mb-4 h-3 w-20 bg-black/5 dark:bg-zinc-800/40" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2">
                <Skeleton className="h-4 w-4 rounded bg-black/5 dark:bg-zinc-800/40" />
                <Skeleton className="h-3.5 flex-1 bg-black/5 dark:bg-zinc-800/30" />
              </div>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex flex-1 items-center justify-center">
          <div
            className="h-[70%] w-[60%] rounded-xl border border-black/[0.04] bg-black/[0.02] dark:border-white/[0.04] dark:bg-white/[0.02]"
          >
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-teal-500/40" />
                <div className="absolute inset-1.5 animate-spin rounded-full border-2 border-transparent border-b-cyan-400/30" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <Skeleton className="h-3 w-32 bg-black/5 dark:bg-zinc-800/30" />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div
          className="w-[280px] flex-shrink-0 border-l border-black/5 bg-white p-4 dark:border-white/[0.06] dark:bg-[#0c0c10]"
        >
          <Skeleton className="mb-4 h-3 w-24 bg-black/5 dark:bg-zinc-800/40" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16 bg-black/5 dark:bg-zinc-800/30" />
                <Skeleton className="h-8 w-full rounded-md bg-black/5 dark:bg-zinc-800/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
