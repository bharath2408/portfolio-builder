import { Skeleton } from "@/components/ui/skeleton";

export default function PortfoliosLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-1.5 h-3.5 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Portfolio list */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-2.5 w-2.5 flex-shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
              <Skeleton className="h-3.5 w-3.5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
