import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="rounded-xl border bg-card p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <Skeleton className="h-7 w-40 bg-muted" />
        <Skeleton className="h-4 w-56 bg-muted/70" />
      </div>

      {/* OAuth buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-10 rounded-md bg-muted/60" />
        <Skeleton className="h-10 rounded-md bg-muted/60" />
      </div>

      {/* Separator */}
      <div className="relative my-6">
        <Skeleton className="h-px w-full bg-muted/40" />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-12 bg-muted/60" />
          <Skeleton className="h-10 w-full rounded-md bg-muted/40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-16 bg-muted/60" />
          <Skeleton className="h-10 w-full rounded-md bg-muted/40" />
        </div>
        <Skeleton className="h-10 w-full rounded-md bg-muted/70" />
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-center">
        <Skeleton className="h-4 w-52 bg-muted/40" />
      </div>
    </div>
  );
}
