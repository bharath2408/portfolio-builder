"use client";

import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Plus,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  Search,
  ChevronRight,
  Trash2,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

import { HelpDrawer } from "@/components/common/help-drawer";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { apiPatch } from "@/lib/api";
import { cn, getInitials } from "@/lib/utils";

const navigation = [
  {
    label: "Main",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { name: "Portfolios", href: "/dashboard/portfolios", icon: FolderKanban },
      { name: "Community", href: "/dashboard/community", icon: Users },
      { name: "Resume", href: "/dashboard/resume", icon: FileText },
      { name: "Trash", href: "/dashboard/trash", icon: Trash2 },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/portfolios": "Portfolios",
  "/dashboard/portfolios/new": "New Portfolio",
  "/dashboard/community": "Community",
  "/dashboard/resume": "Resume",
  "/dashboard/trash": "Trash",
  "/dashboard/settings": "Settings",
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = breadcrumbMap[path];
    if (label) {
      crumbs.push({ label, href: path });
    }
  }

  return crumbs;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, update: updateSession } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Re-fetch session when settings page broadcasts an update
  useEffect(() => {
    const handler = () => { updateSession(); };
    window.addEventListener("session-updated", handler);
    return () => window.removeEventListener("session-updated", handler);
  }, [updateSession]);

  const currentTheme = session?.user?.theme ?? "light";
  const isDark = currentTheme === "dark";
  const breadcrumbs = getBreadcrumbs(pathname);

  const toggleTheme = async () => {
    if (switching) return;
    setSwitching(true);

    const newTheme = isDark ? "light" : "dark";

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      await apiPatch("/users/me", { theme: newTheme });
      await updateSession({ theme: newTheme });
    } catch {
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } finally {
      setSwitching(false);
    }
  };

  // Studio/builder mode
  const isStudioMode =
    pathname.includes("/edit") || pathname.includes("/preview");
  if (isStudioMode) {
    return <div className="h-screen w-screen overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-border/50 bg-sidebar transition-transform duration-300 ease-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo bar */}
        <div className="flex h-[60px] items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 shadow-md shadow-teal-500/20">
              <Sparkles className="h-4 w-4 text-white" />
              <div className="absolute inset-0 rounded-xl bg-white/10" />
            </div>
            <span className="font-display text-[15px] font-bold tracking-tight text-sidebar-foreground">
              {APP_NAME}
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New portfolio CTA */}
        <div className="px-4 pb-2">
          <Link href="/dashboard/portfolios/new">
            <button className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-[12.5px] font-semibold text-white shadow-sm shadow-teal-500/20 transition-all hover:shadow-md hover:shadow-teal-500/25 hover:brightness-110 active:scale-[0.98]">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              New Portfolio
            </button>
          </Link>
        </div>

        {/* Navigation sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navigation.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href + "/"));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13px] font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary/8 text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground/50 group-hover:text-foreground/70",
                        )}
                        strokeWidth={isActive ? 2 : 1.75}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="flex h-[60px] flex-shrink-0 items-center justify-between border-b border-border/50 bg-background px-4 lg:px-6">
          {/* Left: mobile menu + breadcrumb */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <nav className="hidden items-center gap-1 text-[13px] sm:flex">
              {breadcrumbs.map((crumb, i) => (
                <div key={crumb.href} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                  )}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-foreground">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile title */}
            <span className="text-[14px] font-bold text-foreground sm:hidden">
              {breadcrumbs[breadcrumbs.length - 1]?.label ?? APP_NAME}
            </span>
          </div>

          {/* Right: search + actions */}
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button className="hidden h-8 items-center gap-2 rounded-lg border border-border/60 bg-accent/30 px-3 text-[12px] text-muted-foreground/60 transition-colors hover:border-border hover:text-muted-foreground sm:flex">
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="ml-4 rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/40">
                /
              </kbd>
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              disabled={switching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* User avatar */}
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "Profile"}
                width={32}
                height={32}
                className="hidden h-8 w-8 rounded-full object-cover ring-1 ring-teal-500/15 lg:block"
                unoptimized
              />
            ) : (
              <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-500/20 text-[10px] font-bold text-teal-600 ring-1 ring-teal-500/15 dark:text-teal-400 lg:flex">
                {getInitials(session?.user?.name)}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto w-full max-w-[1100px] p-5 lg:p-8">
            {children}
          </div>
        </div>
      </main>

      <HelpDrawer />
    </div>
  );
}
