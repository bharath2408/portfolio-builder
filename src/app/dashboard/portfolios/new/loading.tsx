import { Skeleton } from "@/components/ui/skeleton";

export default function NewPortfolioLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <div>
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 flex-shrink-0 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>

      {/* Template gallery */}
      <div>
        <Skeleton className="mb-3 h-3 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
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

        {/* Fields: Title, Slug, Description */}
        <div className="divide-y divide-border/40">
          {/* Title */}
          <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[160px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-10" />
            <div className="space-y-1.5">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          {/* Slug */}
          <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[160px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-16" />
            <div className="space-y-1.5">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          {/* Description */}
          <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[160px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-24" />
            <div className="space-y-1.5">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-44 rounded-md" />
      </div>
    </div>
  );
}
