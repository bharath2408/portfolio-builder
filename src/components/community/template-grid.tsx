"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  fetchCommunityTemplates,
  type CommunityTemplate,
  type CommunityTemplateCategory,
} from "@/lib/api/community-templates";
import { TemplateCard } from "./template-card";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Constants ───────────────────────────────────────────────────

type SortOption = "most_used" | "newest";
type ThemeFilter = "all" | "light" | "dark";
type CategoryFilter = CommunityTemplateCategory | "ALL";

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DEVELOPER", label: "Developer" },
  { value: "DESIGNER", label: "Designer" },
  { value: "WRITER", label: "Writer" },
  { value: "OTHER", label: "Other" },
];

const THEME_FILTERS: { value: ThemeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const PAGE_LIMIT = 12;

// ─── Skeleton Cards ───────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
        </div>
      </div>
      <div className="flex gap-2 border-t border-border/60 px-4 py-3">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Filter Pills ─────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-150",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────

export interface TemplateGridProps {
  initialTemplates: CommunityTemplate[];
  initialNextCursor: string | null;
  onUse: (id: string) => void | Promise<void>;
  showPreview?: boolean;
}

// ─── Component ───────────────────────────────────────────────────

export function TemplateGrid({
  initialTemplates,
  initialNextCursor,
  onUse,
  showPreview = true,
}: TemplateGridProps) {
  // ── Filter state ──────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");
  const [sort, setSort] = useState<SortOption>("most_used");

  // ── Pagination + data state ───────────────────────────────────
  const [templates, setTemplates] = useState<CommunityTemplate[]>(initialTemplates);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetching, setFetching] = useState(false);

  // ── Loading state per template (for onUse) ────────────────────
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ── Intersection observer ref ─────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Track if filters have changed from initial ────────────────
  const isInitialMount = useRef(true);

  // ── Debounce search ───────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Fire when cleared OR when >= 2 chars
      if (search === "" || search.length >= 2) {
        setDebouncedSearch(search);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // ── Re-fetch when filters change ──────────────────────────────
  useEffect(() => {
    // Skip on initial mount (use server-provided initialTemplates)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setNextCursor(null);
    const controller = new AbortController();

    async function refetch() {
      setFetching(true);
      try {
        const isDark =
          themeFilter === "dark" ? true : themeFilter === "light" ? false : undefined;
        const result = await fetchCommunityTemplates({
          category: category !== "ALL" ? category : undefined,
          isDark,
          sort,
          search: debouncedSearch || undefined,
          limit: PAGE_LIMIT,
        });
        if (!controller.signal.aborted) {
          setTemplates(result.templates);
          setNextCursor(result.nextCursor);
        }
      } catch {
        // silently ignore aborted requests
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    }

    refetch();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, themeFilter, sort, debouncedSearch]);

  // ── Load more ─────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const isDark =
        themeFilter === "dark" ? true : themeFilter === "light" ? false : undefined;
      const result = await fetchCommunityTemplates({
        category: category !== "ALL" ? category : undefined,
        isDark,
        sort,
        search: debouncedSearch || undefined,
        limit: PAGE_LIMIT,
        cursor: nextCursor,
      });
      setTemplates((prev) => [...prev, ...result.templates]);
      setNextCursor(result.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, category, themeFilter, sort, debouncedSearch]);

  // ── Intersection observer for infinite scroll ─────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, loadMore]);

  // ── Handle onUse with loading state ──────────────────────────
  const handleUse = useCallback(
    async (id: string) => {
      setLoadingId(id);
      try {
        await onUse(id);
      } finally {
        setLoadingId(null);
      }
    },
    [onUse],
  );

  // ── Derived state ─────────────────────────────────────────────
  const isEmpty = !fetching && templates.length === 0;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-input bg-background py-2 pl-9 pr-8 text-[13px]",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-1 focus:ring-primary/50",
              "transition-all duration-150",
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Row: category + theme + sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map(({ value, label }) => (
              <FilterPill
                key={value}
                active={category === value}
                onClick={() => setCategory(value)}
              >
                {label}
              </FilterPill>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-1 hidden h-4 w-px bg-border/60 sm:block" />

          {/* Theme toggle */}
          <div className="flex items-center gap-1.5">
            {THEME_FILTERS.map(({ value, label }) => (
              <FilterPill
                key={value}
                active={themeFilter === value}
                onClick={() => setThemeFilter(value)}
              >
                {label}
              </FilterPill>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sort toggle */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setSort(sort === "most_used" ? "newest" : "most_used")}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-150",
                "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {sort === "most_used" ? "Most Used" : "Newest"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────── */}
      {fetching ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-foreground">No templates found</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("ALL");
              setThemeFilter("all");
              setSort("most_used");
            }}
            className="rounded-lg border border-border/80 px-4 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUse}
              showPreview={showPreview}
              loading={loadingId === template.id}
            />
          ))}
        </div>
      )}

      {/* ── Load More / Spinner ─────────────────────────────────── */}
      {nextCursor && !fetching && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {loadingMore ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <button
              type="button"
              onClick={loadMore}
              className={cn(
                "rounded-lg border border-border/80 px-5 py-2 text-[13px] font-medium",
                "text-muted-foreground transition-all duration-150",
                "hover:border-border hover:text-foreground",
              )}
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
