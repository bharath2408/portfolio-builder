"use client";

import {
  HelpCircle,
  X,
  BookOpen,
  Keyboard,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  Zap,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";

const DOCS_LINKS = [
  { title: "Studio Editor", href: "/docs/studio-editor", description: "Canvas, tools & shortcuts", icon: Zap, color: "from-violet-400 to-purple-500" },
  { title: "Sections & Blocks", href: "/docs/sections-blocks", description: "30+ block types", icon: Sparkles, color: "from-amber-400 to-orange-500" },
  { title: "Styling & Themes", href: "/docs/styling-themes", description: "Colors, fonts & effects", icon: MessageSquare, color: "from-pink-400 to-rose-500" },
  { title: "Introduction", href: "/docs", description: "What is Foliocraft", icon: BookOpen, color: "from-teal-400 to-emerald-500" },
];

const ALL_DOCS = [
  { title: "Create an Account", href: "/docs/create-account" },
  { title: "Your Dashboard", href: "/docs/dashboard" },
  { title: "Create a Portfolio", href: "/docs/create-portfolio" },
  { title: "Preview & Publish", href: "/docs/preview-publish" },
  { title: "SEO & Analytics", href: "/docs/seo-analytics" },
  { title: "Version History", href: "/docs/version-history" },
  { title: "Content Management (CMS)", href: "/docs/cms" },
  { title: "Asset Library & Fonts", href: "/docs/assets-fonts" },
  { title: "Account Settings", href: "/docs/account-settings" },
];

const SHORTCUTS = [
  { keys: ["Ctrl", "S"], label: "Save" },
  { keys: ["Ctrl", "Z"], label: "Undo" },
  { keys: ["Ctrl", "⇧", "Z"], label: "Redo" },
  { keys: ["Ctrl", "C"], label: "Copy block" },
  { keys: ["Ctrl", "X"], label: "Cut block" },
  { keys: ["Ctrl", "V"], label: "Paste block" },
  { keys: ["Ctrl", "D"], label: "Duplicate" },
  { keys: ["Ctrl", "G"], label: "Group" },
  { keys: ["Ctrl", "⇧", "G"], label: "Ungroup" },
  { keys: ["Ctrl", "Alt", "C"], label: "Copy styles" },
  { keys: ["Ctrl", "Alt", "V"], label: "Paste styles" },
  { keys: ["Ctrl", "K"], label: "Command Palette" },
  { keys: ["Ctrl", "P"], label: "Preview" },
  { keys: ["Space"], label: "Pan canvas (hold)" },
  { keys: ["?"], label: "All Shortcuts" },
  { keys: ["Esc"], label: "Deselect" },
];

const CHANGELOG = [
  {
    version: "v2.1",
    date: "March 2026",
    items: [
      { text: "Headless CMS — create collections, manage content entries", tag: "new" },
      { text: "TipTap rich text editor for CMS content", tag: "new" },
      { text: "CMS block — insert dynamic content on canvas", tag: "new" },
      { text: "Gradient editor — visual multi-stop gradient builder", tag: "new" },
      { text: "Asset library — upload once, reuse across blocks", tag: "new" },
      { text: "Custom font upload (.woff2, .woff, .ttf)", tag: "new" },
      { text: "Responsive auto-adapt — generate tablet/mobile layouts", tag: "new" },
      { text: "Content tab in studio for browsing CMS entries", tag: "new" },
      { text: "Library tab in image picker for reusing assets", tag: "new" },
      { text: "4 preset CMS collections — Blog, Project, Testimonial, FAQ", tag: "new" },
      { text: "Schema editor for customizing collection fields", tag: "new" },
      { text: "Studio UX polish — Lucide icons, better transitions", tag: "improvement" },
      { text: "Page switch now auto-centers canvas on visible frames", tag: "improvement" },
    ],
  },
  {
    version: "v2.0",
    date: "March 2026",
    items: [
      { text: "Smart alignment guides — snap to other block edges", tag: "new" },
      { text: "Copy/paste styles (Ctrl+Alt+C/V)", tag: "new" },
      { text: "Frame drag & resize on canvas", tag: "new" },
      { text: "Block grouping (Ctrl+G / Ctrl+Shift+G)", tag: "new" },
      { text: "Background patterns for sections", tag: "new" },
      { text: "Shape presets — dividers, blobs, geometric", tag: "new" },
      { text: "Icon picker with search & categories", tag: "new" },
      { text: "SVG import with sanitization", tag: "new" },
      { text: "Magnetic cursor hover effect", tag: "new" },
      { text: "Canvas rulers toggle", tag: "new" },
      { text: ".folio file export/import", tag: "new" },
      { text: "PDF resume generator", tag: "new" },
      { text: "Live notification bell for contact forms", tag: "new" },
      { text: "Soft delete + Trash with 30-day recovery", tag: "new" },
      { text: "Smart save — 10s idle, page blur, drag end", tag: "improvement" },
      { text: "Undo/redo for all actions (move, resize, styles)", tag: "improvement" },
      { text: "Editor preferences persist across sessions", tag: "improvement" },
    ],
  },
];

export function HelpDrawer() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"docs" | "shortcuts" | "changelog">("docs");
  const [animating, setAnimating] = useState(false);

  const openDrawer = () => {
    setOpen(true);
    requestAnimationFrame(() => setAnimating(true));
  };

  const closeDrawer = () => {
    setAnimating(false);
    setTimeout(() => setOpen(false), 250);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {/* ── Floating trigger ─────────────────────────────────── */}
      <button
        onClick={openDrawer}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-0 overflow-hidden rounded-full shadow-lg shadow-black/10 transition-all duration-300 hover:shadow-xl dark:shadow-black/30"
      >
        {/* Gradient background */}
        <div className="relative flex h-12 items-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 pl-3.5 pr-4 transition-all">
          <div className="absolute inset-0 bg-white/0 transition-all duration-200 group-hover:bg-white/10" />
          <HelpCircle className="h-[18px] w-[18px] text-white transition-transform duration-300 group-hover:rotate-12" />
          <span className="text-[12px] font-semibold tracking-wide text-white/95">
            Help
          </span>
        </div>
      </button>

      {/* ── Drawer ───────────────────────────────────────────── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px] transition-opacity duration-250",
              animating ? "opacity-100" : "opacity-0",
            )}
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-drawer-title"
            className={cn(
              "fixed bottom-4 right-4 z-[201] flex h-[80vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/15 transition-all duration-250 ease-out dark:border-white/[0.08] dark:shadow-black/40",
              animating
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-4 scale-[0.97] opacity-0",
            )}
          >
            {/* ── Header ──────────────────────────────────── */}
            <div className="relative flex-shrink-0">
              {/* Header gradient bg */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/[0.06] via-cyan-500/[0.03] to-transparent" />
              <div className="relative flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 shadow-sm shadow-teal-500/25">
                    <Sparkles className="h-4 w-4 text-white" />
                    <div className="absolute inset-0 rounded-xl bg-white/10" />
                  </div>
                  <div>
                    <h2 id="help-drawer-title" className="font-display text-[15px] font-bold tracking-tight text-foreground">
                      Help Center
                    </h2>
                    <p className="text-[10px] text-muted-foreground/50">
                      Guides, shortcuts & updates
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  aria-label="Close help center"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-all hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Tabs ─────────────────────────────────── */}
              <div className="flex gap-1 px-5 pb-3">
                {[
                  { id: "docs" as const, label: "Guides", icon: BookOpen },
                  { id: "shortcuts" as const, label: "Keys", icon: Keyboard },
                  { id: "changelog" as const, label: "New", icon: Sparkles },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-foreground/[0.07] text-foreground shadow-sm"
                        : "text-muted-foreground/50 hover:text-muted-foreground",
                    )}
                  >
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Content ─────────────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-border/40">
              {/* ─ Docs Tab ─ */}
              {activeTab === "docs" && (
                <div className="p-4">
                  {/* Featured guides */}
                  <div className="grid grid-cols-2 gap-2">
                    {DOCS_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeDrawer}
                        className="group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-card to-muted/20 p-3.5 transition-all duration-200 hover:border-border/60 hover:shadow-sm"
                      >
                        <div className={cn("mb-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm", link.color)}>
                          <link.icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <p className="text-[11.5px] font-semibold text-foreground">
                          {link.title}
                        </p>
                        <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground/50">
                          {link.description}
                        </p>
                        <ArrowUpRight className="absolute right-2.5 top-2.5 h-3 w-3 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/40" />
                      </Link>
                    ))}
                  </div>

                  {/* All guides list */}
                  <div className="mt-4">
                    <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">
                      All Guides
                    </p>
                    <div className="space-y-px">
                      {ALL_DOCS.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={closeDrawer}
                          className="group flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors hover:bg-accent/60"
                        >
                          <span className="text-[11.5px] font-medium text-foreground/70 group-hover:text-foreground">
                            {link.title}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground/50" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Full docs CTA */}
                  <Link
                    href="/docs"
                    onClick={closeDrawer}
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 px-4 py-3 text-[11px] font-semibold text-teal-600 transition-all hover:from-teal-500/15 hover:to-cyan-500/15 dark:text-teal-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open full documentation
                  </Link>
                </div>
              )}

              {/* ─ Shortcuts Tab ─ */}
              {activeTab === "shortcuts" && (
                <div className="p-4">
                  <p className="mb-4 rounded-lg bg-muted/30 px-3 py-2.5 text-[10.5px] leading-relaxed text-muted-foreground/60">
                    Studio Editor shortcuts. Press{" "}
                    <kbd className="rounded border border-border/60 bg-card px-1 py-0.5 font-mono text-[9px] font-semibold text-foreground/70">?</kbd>{" "}
                    inside the editor for the complete list.
                  </p>
                  <div className="space-y-1">
                    {SHORTCUTS.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/40"
                      >
                        <span className="text-[12px] font-medium text-foreground/70">{s.label}</span>
                        <div className="flex items-center gap-1">
                          {s.keys.map((key, i) => (
                            <span key={i} className="flex items-center gap-1">
                              {i > 0 && <span className="text-[8px] text-muted-foreground/30">+</span>}
                              <kbd className="min-w-[24px] rounded-md border border-border/50 bg-gradient-to-b from-card to-muted/40 px-1.5 py-1 text-center font-mono text-[9px] font-semibold text-foreground/80 shadow-[0_1px_0_0] shadow-border/50">
                                {key}
                              </kbd>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─ Changelog Tab ─ */}
              {activeTab === "changelog" && (
                <div className="p-4">
                  {CHANGELOG.map((entry) => (
                    <div key={entry.version}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-md bg-gradient-to-r from-teal-500 to-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {entry.version}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40">{entry.date}</span>
                      </div>
                      <div className="space-y-2">
                        {entry.items.map((item) => (
                          <div
                            key={item.text}
                            className="flex items-start gap-2.5 rounded-lg border border-border/30 bg-card/50 px-3 py-2.5"
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                                item.tag === "new"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                              )}
                            >
                              {item.tag}
                            </span>
                            <span className="text-[11.5px] leading-relaxed text-foreground/70">
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer ─────────────────────────────────── */}
            <div className="flex-shrink-0 border-t border-border/40 px-5 py-3">
              <p className="text-center text-[9px] text-muted-foreground/30">
                Foliocraft &middot; Press <kbd className="font-mono">Esc</kbd> to close
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
