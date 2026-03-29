"use client";

import {
  ChevronDown,
  FileText,
  FolderKanban,
  HelpCircle,
  Loader2,
  MessageSquareQuote,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { EntryEditor } from "@/components/cms/entry-editor";
import { EntryTable } from "@/components/cms/entry-table";
import { SchemaEditor } from "@/components/cms/schema-editor";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { ContentEntry, ContentType } from "@/types";

// ─── Icon Map ────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-4 w-4" />,
  FolderKanban: <FolderKanban className="h-4 w-4" />,
  MessageSquareQuote: <MessageSquareQuote className="h-4 w-4" />,
  HelpCircle: <HelpCircle className="h-4 w-4" />,
};

// ─── Types ───────────────────────────────────────────────────────

interface PortfolioOption {
  id: string;
  title: string;
}

type View = "list" | "edit" | "schema";

// ─── Page ────────────────────────────────────────────────────────

export default function CmsPage() {
  const { status } = useSession();

  // State
  const [portfolios, setPortfolios] = useState<PortfolioOption[]>([]);
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [types, setTypes] = useState<ContentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [view, setView] = useState<View>("list");
  const [editingEntry, setEditingEntry] = useState<ContentEntry | null>(null);

  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedType = types.find((t) => t.id === selectedTypeId) ?? null;

  // ─── Fetch Portfolios ──────────────────────────────────────────

  useEffect(() => {
    if (status !== "authenticated") return;

    (async () => {
      try {
        const data = await apiGet<PortfolioOption[]>("/portfolios");
        setPortfolios(data);
        const first = data[0];
        if (first) {
          setPortfolioId(first.id);
        }
      } catch {
        // silent
      } finally {
        setLoadingPortfolios(false);
      }
    })();
  }, [status]);

  // ─── Fetch Content Types ───────────────────────────────────────

  const fetchTypes = useCallback(async (pid: string) => {
    setLoadingTypes(true);
    try {
      const data = await apiGet<ContentType[]>(
        `/cms/types?portfolioId=${pid}`,
      );
      setTypes(data);
      const first = data[0];
      if (first) {
        setSelectedTypeId(first.id);
      } else {
        setSelectedTypeId("");
        setEntries([]);
      }
    } catch {
      setTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    if (!portfolioId) return;
    fetchTypes(portfolioId);
  }, [portfolioId, fetchTypes]);

  // ─── Fetch Entries ─────────────────────────────────────────────

  const fetchEntries = useCallback(async (typeId: string) => {
    try {
      const data = await apiGet<ContentEntry[]>(
        `/cms/types/${typeId}/entries`,
      );
      setEntries(data);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    if (!selectedTypeId) return;
    setView("list");
    setEditingEntry(null);
    fetchEntries(selectedTypeId);
  }, [selectedTypeId, fetchEntries]);

  // ─── Actions ───────────────────────────────────────────────────

  const handleInitPresets = async () => {
    if (!portfolioId) return;
    setInitializing(true);
    try {
      await apiPost("/cms/init", { portfolioId });
      await fetchTypes(portfolioId);
    } catch {
      // silent
    } finally {
      setInitializing(false);
    }
  };

  const handleNewCollection = async () => {
    const name = window.prompt("Collection name:");
    if (!name?.trim() || !portfolioId) return;

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    try {
      const created = await apiPost<ContentType>("/cms/types", {
        portfolioId,
        name: name.trim(),
        slug,
        fields: [],
        icon: "FileText",
      });
      setTypes((prev) => [...prev, created]);
      setSelectedTypeId(created.id);
    } catch {
      // silent
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await apiDelete(`/cms/entries/${entryId}`);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch {
      // silent
    }
  };

  const handleSaveEntry = (entry: ContentEntry) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      if (exists) {
        return prev.map((e) => (e.id === entry.id ? entry : e));
      }
      return [entry, ...prev];
    });
    setView("list");
    setEditingEntry(null);
  };

  const handleUpdateSchema = (updated: ContentType) => {
    setTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setView("list");
  };

  // ─── Loading State ─────────────────────────────────────────────

  if (status === "loading" || loadingPortfolios) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <p className="text-sm">No portfolios found.</p>
        <p className="mt-1 text-xs">Create a portfolio first to use the CMS.</p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="-mx-5 -mt-5 flex h-[calc(100vh-60px)] lg:-mx-8 lg:-mt-8">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-border/50 bg-card">
        {/* Portfolio selector */}
        <div className="border-b border-border/50 p-3">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex w-full items-center justify-between rounded-md border border-border/60 bg-background px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent/50"
            >
              <span className="truncate">
                {portfolios.find((p) => p.id === portfolioId)?.title ??
                  "Select portfolio"}
              </span>
              <ChevronDown className="ml-2 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            </button>
            {dropdownOpen && portfolios.length > 1 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md">
                {portfolios.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPortfolioId(p.id);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                      p.id === portfolioId
                        ? "bg-primary/10 font-medium text-primary"
                        : ""
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collections list */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
            Collections
          </p>

          {loadingTypes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : types.length === 0 ? (
            <div className="space-y-3 px-2 py-4">
              <p className="text-xs text-muted-foreground">
                No collections yet.
              </p>
              <button
                onClick={handleInitPresets}
                disabled={initializing}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {initializing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Initialize Presets
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {types.map((type) => {
                const isActive = type.id === selectedTypeId;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTypeId(type.id)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    <span className="flex-shrink-0">
                      {ICON_MAP[type.icon] ?? (
                        <FileText className="h-4 w-4" />
                      )}
                    </span>
                    <span className="flex-1 truncate">{type.name}</span>
                    <span
                      className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {type._count?.entries ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* New collection button */}
        <div className="border-t border-border/50 p-3">
          <button
            onClick={handleNewCollection}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            New Collection
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {!selectedType ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
              <FileText className="h-7 w-7 text-primary/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Select a collection</p>
              <p className="mt-1 text-xs text-muted-foreground">Choose a content type from the sidebar to manage entries</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            {/* Toolbar — only show in list view since edit/schema have their own headers */}
            {view === "list" && (
              <div className="flex flex-shrink-0 items-center justify-between border-b border-border/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    {ICON_MAP[selectedType.icon] ?? <FileText className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <h1 className="text-[15px] font-semibold">{selectedType.name}</h1>
                    <p className="text-[11px] text-muted-foreground">
                      {entries.length} {entries.length === 1 ? "entry" : "entries"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setView("schema")}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Schema
                  </button>
                  <button
                    onClick={() => { setEditingEntry(null); setView("edit"); }}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Entry
                  </button>
                </div>
              </div>
            )}

            {/* View Content */}
            <div className="flex-1 overflow-hidden">
              {view === "list" && (
                <EntryTable
                  entries={entries}
                  collectionName={selectedType.name}
                  onEdit={(entry) => { setEditingEntry(entry); setView("edit"); }}
                  onDelete={handleDeleteEntry}
                  onNew={() => { setEditingEntry(null); setView("edit"); }}
                />
              )}

              {view === "edit" && (
                <EntryEditor
                  contentType={selectedType}
                  entry={editingEntry}
                  onSave={handleSaveEntry}
                  onBack={() => { setView("list"); setEditingEntry(null); }}
                />
              )}

              {view === "schema" && (
                <SchemaEditor
                  contentType={selectedType}
                  onUpdate={handleUpdateSchema}
                  onClose={() => setView("list")}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
