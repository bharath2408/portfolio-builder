import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-teal-500/[0.06] via-transparent to-cyan-500/[0.04] p-6 lg:p-8">
        <div className="relative">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-72" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-8 w-14" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Quick Actions */}
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-3 w-24" />
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div className="space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="rounded-xl border border-border/50 bg-card">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-center gap-3.5 px-4 py-3.5 ${i !== 0 ? "border-t border-border/40" : ""}`}
              >
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-4 w-14 rounded-md" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-2.5 w-12" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3.5 w-3.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
