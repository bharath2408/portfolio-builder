import { Skeleton } from "@/components/ui/skeleton";

export default function PreviewLoading() {
  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Preview body */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto bg-background p-8">
        <div className="w-full max-w-3xl space-y-12">
          {/* Hero section skeleton */}
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Grid section skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-border/50 p-5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* Text section skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
