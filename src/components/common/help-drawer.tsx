"use client";

import {
  HelpCircle,
  X,
  BookOpen,
  Keyboard,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const DOCS_LINKS = [
  { title: "Introduction", href: "/docs", description: "What is Foliocraft" },
  { title: "Create a Portfolio", href: "/docs/create-portfolio", description: "Start building" },
  { title: "Studio Editor", href: "/docs/studio-editor", description: "Visual editing canvas" },
  { title: "Sections & Blocks", href: "/docs/sections-blocks", description: "25+ block types" },
  { title: "Styling & Themes", href: "/docs/styling-themes", description: "Customize everything" },
  { title: "Preview & Publish", href: "/docs/preview-publish", description: "Go live" },
];

const SHORTCUTS = [
  { keys: "Ctrl+S", label: "Save" },
  { keys: "Ctrl+Z", label: "Undo" },
  { keys: "Ctrl+K", label: "Command palette" },
  { keys: "?", label: "All shortcuts" },
];

const CHANGELOG = [
  { version: "Latest", items: ["Version history with preview", "Command palette (Ctrl+K)", "Custom confirm dialogs", "Block property tooltips"] },
];

export function HelpDrawer() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"docs" | "shortcuts" | "changelog">("docs");

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-110 active:scale-95"
        title="Help & Documentation"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 right-0 z-[201] h-[85vh] w-[360px] max-w-[95vw] overflow-hidden rounded-tl-2xl border-l border-t border-border/50 bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[14px] font-bold text-foreground">Help Center</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/50">
              {[
                { id: "docs" as const, label: "Docs", icon: BookOpen },
                { id: "shortcuts" as const, label: "Shortcuts", icon: Keyboard },
                { id: "changelog" as const, label: "What's New", icon: Sparkles },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-teal-500 text-teal-600 dark:text-teal-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "docs" && (
                <div className="space-y-1.5">
                  {DOCS_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
                    >
                      <div>
                        <p className="text-[12px] font-semibold text-foreground">{link.title}</p>
                        <p className="text-[10px] text-muted-foreground/60">{link.description}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                    </Link>
                  ))}
                  <Link
                    href="/docs"
                    onClick={() => setOpen(false)}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-teal-500/10 px-3 py-2.5 text-[11px] font-semibold text-teal-600 transition-colors hover:bg-teal-500/15 dark:text-teal-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View all documentation
                  </Link>
                </div>
              )}

              {activeTab === "shortcuts" && (
                <div>
                  <p className="mb-3 text-[11px] text-muted-foreground/60">
                    Quick reference for the Studio Editor. Press <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">?</kbd> in the editor for the full list.
                  </p>
                  <div className="space-y-1">
                    {SHORTCUTS.map((s) => (
                      <div key={s.keys} className="flex items-center justify-between rounded-lg px-3 py-2">
                        <span className="text-[12px] text-muted-foreground">{s.label}</span>
                        <kbd className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                          {s.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "changelog" && (
                <div>
                  {CHANGELOG.map((entry) => (
                    <div key={entry.version}>
                      <p className="mb-2 text-[12px] font-bold text-foreground">{entry.version}</p>
                      <ul className="space-y-1.5">
                        {entry.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-teal-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
