"use client";

import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";

import type { ContentEntry } from "@/types";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface EntryTableProps {
  entries: ContentEntry[];
  collectionName: string;
  onEdit: (entry: ContentEntry) => void;
  onDelete: (entryId: string) => void;
  onNew: () => void;
}

export function EntryTable({
  entries,
  collectionName,
  onEdit,
  onDelete,
  onNew,
}: EntryTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) => e.title.toLowerCase().includes(q));
  }, [entries, search]);

  /* ── Empty state ─────────────────────────────────────────────── */
  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
          <FileText className="h-7 w-7 text-primary/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            No {collectionName.toLowerCase()} yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first entry to get started
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus size={14} />
          Create {collectionName}
        </button>
      </div>
    );
  }

  /* ── List view ───────────────────────────────────────────────── */
  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="flex-shrink-0 px-6 py-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${collectionName.toLowerCase()}...`}
            className="h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              No entries matching &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                role="button"
                tabIndex={0}
                onClick={() => onEdit(entry)}
                onKeyDown={(e) => { if (e.key === "Enter") onEdit(entry); }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
              >
                <span className="flex-1 truncate text-[13px] font-medium">
                  {entry.title}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDate(entry.updatedAt)}
                </span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor:
                      entry.status === "PUBLISHED"
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(245,158,11,0.1)",
                    color:
                      entry.status === "PUBLISHED"
                        ? "rgb(34,197,94)"
                        : "rgb(245,158,11)",
                  }}
                >
                  {entry.status === "PUBLISHED" ? "Published" : "Draft"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.id);
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:text-destructive"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
