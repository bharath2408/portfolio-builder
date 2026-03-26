"use client";

import { Bell, Inbox, Mail, Check } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

interface Notification {
  id: string;
  portfolioId: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  portfolio: { title: string; id: string };
}

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchCount = useCallback(async () => {
    try {
      const res = await apiGet<{ count: number }>("/notifications/unread-count");
      setCount(res.count);
    } catch {}
  }, []);

  // Poll every 60s
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Fetch recent when opened
  const handleOpen = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const res = await apiGet<Notification[]>("/notifications/recent");
      setNotifications(res);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark all as read
  const markAllRead = async () => {
    try {
      await apiPost("/notifications/mark-read", {});
      setCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  // Mark single as read
  const markRead = async (id: string) => {
    try {
      await apiPost("/notifications/mark-read", { ids: [id] });
      setCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-500 px-1 text-[9px] font-bold text-white shadow-sm shadow-teal-500/30">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-[360px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl shadow-black/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <h3 className="text-[13px] font-semibold text-foreground">Notifications</h3>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="space-y-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 border-b border-border/40 px-4 py-3.5">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-32 animate-pulse rounded bg-muted/40" />
                      <div className="h-3 w-48 animate-pulse rounded bg-muted/30" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-[12px] text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/dashboard/portfolios/${n.portfolioId}/submissions`}
                  onClick={() => { if (!n.isRead) markRead(n.id); setOpen(false); }}
                  className="flex gap-3 border-b border-border/40 px-4 py-3.5 transition-colors hover:bg-muted/30"
                >
                  {/* Icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12px] font-semibold text-foreground">
                        {n.name}
                      </span>
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {n.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/60">
                      <span>{n.portfolio.title}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(n.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border/60 px-4 py-2.5">
              <Link
                href="/dashboard/portfolios"
                onClick={() => setOpen(false)}
                className="block text-center text-[11px] font-medium text-primary hover:underline"
              >
                View all submissions
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
