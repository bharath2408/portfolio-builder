import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-3.5 w-72" />
      </div>

      {/* Profile section */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        {/* Section header */}
        <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 border-b border-border/40 px-6 py-5">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Fields: Full Name, Username, Bio */}
        <div className="divide-y divide-border/40">
          {/* Full Name */}
          <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-20" />
            <div className="space-y-1.5">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          {/* Username */}
          <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-20" />
            <div className="space-y-1.5">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          {/* Bio */}
          <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-8" />
            <div className="space-y-1.5">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </div>

      {/* Appearance section */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid gap-1.5 sm:grid-cols-[180px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-12" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Account section */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="divide-y divide-border/40">
          {/* Email */}
          <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-12" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          </div>
          {/* Role */}
          <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
          {/* Subdomain */}
          <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
            <Skeleton className="h-3.5 w-16" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-44 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-6 py-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
