"use client";

import {
  BookOpen,
  ChevronRight,
  FolderKanban,
  Layout,
  Layers,
  Palette,
  PenTool,
  Rocket,
  Search,
  Settings,
  Sparkles,
  UserPlus,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { APP_NAME } from "@/config/constants";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs", icon: BookOpen, description: "What is Foliocraft" },
      { title: "Create an Account", href: "/docs/create-account", icon: UserPlus, description: "Sign up and get started" },
      { title: "Your Dashboard", href: "/docs/dashboard", icon: Layout, description: "Navigate your home base" },
    ],
  },
  {
    title: "Building Portfolios",
    items: [
      { title: "Create a Portfolio", href: "/docs/create-portfolio", icon: FolderKanban, description: "Start from templates or scratch" },
      { title: "The Studio Editor", href: "/docs/studio-editor", icon: PenTool, description: "Your visual editing canvas" },
      { title: "Sections & Blocks", href: "/docs/sections-blocks", icon: Layers, description: "Building units of content" },
      { title: "Styling & Themes", href: "/docs/styling-themes", icon: Palette, description: "Customize every detail" },
    ],
  },
  {
    title: "Publishing & Beyond",
    items: [
      { title: "Preview & Publish", href: "/docs/preview-publish", icon: Rocket, description: "Go live in one click" },
      { title: "SEO & Analytics", href: "/docs/seo-analytics", icon: Search, description: "Get discovered and track visitors" },
      { title: "Version History", href: "/docs/version-history", icon: Sparkles, description: "Time-travel through changes" },
      { title: "Account Settings", href: "/docs/account-settings", icon: Settings, description: "Manage your profile" },
    ],
  },
];

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Find current and next/prev pages for navigation
  const allPages = sections.flatMap((s) => s.items);
  const currentIdx = allPages.findIndex((p) => p.href === pathname);
  const currentPage = allPages[currentIdx];
  const prevPage = currentIdx > 0 ? allPages[currentIdx - 1] : null;
  const nextPage = currentIdx < allPages.length - 1 ? allPages[currentIdx + 1] : null;

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent lg:hidden"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 shadow-sm shadow-teal-500/25">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <div className="absolute inset-0 rounded-lg bg-white/10" />
              </div>
              <span className="font-display text-[14px] font-bold tracking-tight text-foreground">
                {APP_NAME}
              </span>
            </Link>

            <div className="hidden items-center gap-1.5 sm:flex">
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              <Link
                href="/docs"
                className="rounded-md px-2 py-1 text-[12px] font-semibold text-teal-600 transition-colors hover:bg-teal-500/10 dark:text-teal-400"
              >
                Documentation
              </Link>
              {currentPage && pathname !== "/docs" && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                  <span className="text-[12px] text-muted-foreground/70">{currentPage.title}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="hidden items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[11px] font-semibold text-foreground/80 transition-all hover:border-border hover:bg-accent sm:flex"
            >
              Get Started
              <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-teal-500/20 transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <ScrollProgress />
      </header>

      <div className="mx-auto max-w-[1400px] lg:flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[232px] overflow-y-auto bg-background transition-transform duration-300 ease-out lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100vh-56px)] lg:translate-x-0 lg:bg-transparent",
            sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full",
          )}
        >
          <nav className="px-3 py-6 lg:pr-1">
            {sections.map((section, sIdx) => (
              <div key={section.title} className={cn(sIdx > 0 && "mt-5")}>
                <p className="mb-1.5 px-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground/40">
                  {section.title}
                </p>
                <div className="space-y-px">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-2 rounded-lg px-2 py-[7px] transition-all duration-200",
                          isActive
                            ? "bg-teal-500/[0.08] text-foreground"
                            : "text-muted-foreground/70 hover:bg-accent/50 hover:text-foreground",
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-teal-500" />
                        )}
                        <item.icon
                          className={cn(
                            "h-3.5 w-3.5 flex-shrink-0",
                            isActive
                              ? "text-teal-600 dark:text-teal-400"
                              : "text-muted-foreground/40 group-hover:text-muted-foreground/60",
                          )}
                          strokeWidth={isActive ? 2 : 1.75}
                        />
                        <span className={cn("truncate text-[12px]", isActive ? "font-semibold" : "font-medium")}>
                          {item.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quick links */}
            <div className="mt-6 rounded-lg border border-border/40 bg-muted/20 px-3 py-3">
              <p className="text-[10px] font-semibold text-foreground/70">Need help?</p>
              <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground/50">
                Can&apos;t find what you need?
              </p>
              <Link
                href="/"
                className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-teal-600 transition-colors hover:text-teal-500 dark:text-teal-400"
              >
                Visit homepage
                <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </nav>
        </aside>

        {/* ── Main content ────────────────────────────────────── */}
        <main className="min-w-0 flex-1 px-4 py-10 lg:px-16 lg:py-12">
          <article className="mx-auto max-w-[700px]">
            {/* Ambient glow behind content */}
            <div className="pointer-events-none absolute -mt-20 ml-[-200px] h-[400px] w-[600px] rounded-full bg-gradient-to-br from-teal-500/[0.03] via-cyan-500/[0.02] to-transparent blur-[80px]" />

            <div className="relative">{children}</div>

            {/* ── Prev/Next navigation ──────────────────────── */}
            {(prevPage || nextPage) && (
              <div className="mt-16 grid gap-3 border-t border-border/40 pt-8 sm:grid-cols-2">
                {prevPage ? (
                  <Link
                    href={prevPage.href}
                    className="group flex items-start gap-3 rounded-xl border border-border/40 bg-card/50 p-4 transition-all duration-200 hover:border-border/60 hover:bg-card hover:shadow-sm"
                  >
                    <ArrowLeft className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-transform group-hover:-translate-x-0.5 group-hover:text-foreground/60" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                        Previous
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-foreground/80 group-hover:text-foreground">
                        {prevPage.title}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}
                {nextPage ? (
                  <Link
                    href={nextPage.href}
                    className="group flex items-start justify-end gap-3 rounded-xl border border-teal-500/20 bg-teal-500/[0.02] p-4 text-right transition-all duration-200 hover:border-teal-500/30 hover:bg-teal-500/[0.05] hover:shadow-sm hover:shadow-teal-500/5"
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600/50 dark:text-teal-400/50">
                        Next
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-teal-700 group-hover:text-teal-600 dark:text-teal-400 dark:group-hover:text-teal-300">
                        {nextPage.title}
                      </p>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500/40 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500/70" />
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 border-t border-border/30 pt-6">
              <p className="text-[11px] text-muted-foreground/40">
                {APP_NAME} Documentation — Built with Next.js and MDX
              </p>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
