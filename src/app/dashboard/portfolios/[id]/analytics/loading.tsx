import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="mt-1 h-4 w-56 rounded" />
          </div>
        </div>
        <Skeleton className="h-9 w-[130px] rounded-lg" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <Skeleton className="mb-4 h-5 w-32 rounded" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>

      {/* Referrers & Devices */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <Skeleton className="mb-4 h-5 w-28 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 rounded" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <Skeleton className="mb-4 h-5 w-20 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
