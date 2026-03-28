"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Trash2 } from "lucide-react";

import type { ContentEntry } from "@/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface EntryTableProps {
  entries: ContentEntry[];
  collectionName: string;
  onEdit: (entry: ContentEntry) => void;
  onDelete: (entryId: string) => void;
  onNew: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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

  /* ---- empty state ---- */

  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <Header
          collectionName={collectionName}
          search={search}
          onSearch={setSearch}
          onNew={onNew}
          entryCount={0}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
          <p
            className="text-sm"
            style={{ color: "var(--b-text-2, #57534e)" }}
          >
            No {collectionName.toLowerCase()} yet
          </p>
          <button
            type="button"
            onClick={onNew}
            className="flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--b-accent, #06b6d4)" }}
          >
            <Plus size={13} />
            Create your first entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        collectionName={collectionName}
        search={search}
        onSearch={setSearch}
        onNew={onNew}
        entryCount={entries.length}
      />

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p
              className="text-sm"
              style={{ color: "var(--b-text-2, #57534e)" }}
            >
              No entries matching &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--b-border, rgba(0,0,0,0.07))" }}>
            {filtered.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onEdit(entry)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "transparent",
                }}
              >
                {/* Title */}
                <span
                  className="flex-1 truncate text-[13px] font-medium"
                  style={{ color: "var(--b-text, #1c1917)" }}
                >
                  {entry.title}
                </span>

                {/* Updated date */}
                <span
                  className="shrink-0 text-[11px]"
                  style={{ color: "var(--b-text-3, #a8a29e)" }}
                >
                  {formatDate(entry.updatedAt)}
                </span>

                {/* Status badge */}
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

                {/* Delete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.id);
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors hover:opacity-80"
                  style={{ color: "var(--b-text-3, #a8a29e)" }}
                >
                  <Trash2 size={13} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header sub-component                                               */
/* ------------------------------------------------------------------ */

function Header({
  collectionName,
  search,
  onSearch,
  onNew,
  entryCount,
}: {
  collectionName: string;
  search: string;
  onSearch: (value: string) => void;
  onNew: () => void;
  entryCount: number;
}) {
  return (
    <div
      className="flex shrink-0 flex-col gap-3 border-b px-4 py-3"
      style={{ borderColor: "var(--b-border, rgba(0,0,0,0.07))" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--b-text, #1c1917)" }}
          >
            {collectionName}
          </span>
          {entryCount > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: "var(--b-surface, #f0ede8)",
                color: "var(--b-text-2, #57534e)",
              }}
            >
              {entryCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--b-accent, #06b6d4)" }}
        >
          <Plus size={13} />
          New Entry
        </button>
      </div>

      {/* Search */}
      {entryCount > 0 && (
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--b-text-3, #a8a29e)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search entries…"
            className="h-8 w-full rounded-md border pl-8 pr-2.5 text-[13px] outline-none transition-colors focus:border-primary"
            style={{
              backgroundColor: "var(--b-surface, #f0ede8)",
              borderColor: "var(--b-border, rgba(0,0,0,0.07))",
              color: "var(--b-text, #1c1917)",
            }}
          />
        </div>
      )}
    </div>
  );
}
