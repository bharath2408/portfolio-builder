import { Skeleton } from "@/components/ui/skeleton";

export default function NewPortfolioLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <div>
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>

        {/* Fields */}
        <div className="divide-y divide-border/40">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid gap-1.5 px-6 py-5 sm:grid-cols-[160px_1fr] sm:gap-6">
              <Skeleton className="h-3.5 w-16" />
              <div className="space-y-1.5">
                <Skeleton className={`w-full rounded-md ${i === 2 ? "h-20" : "h-10"}`} />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
    </div>
  );
}
