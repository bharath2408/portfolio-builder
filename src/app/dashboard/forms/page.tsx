"use client";

import {
  ChevronDown,
  Globe,
  Loader2,
  Mail,
  Plus,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { FormWebhook } from "@/types";

// ─── Types ───────────────────────────────────────────────────────

interface PortfolioOption {
  id: string;
  title: string;
}

interface Submission {
  id: string;
  portfolioId: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

type Tab = "submissions" | "webhooks" | "settings";

// ─── Page ────────────────────────────────────────────────────────

export default function FormsPage() {
  const { data: session, status } = useSession();

  // Portfolio state
  const [portfolios, setPortfolios] = useState<PortfolioOption[]>([]);
  const [portfolioId, setPortfolioId] = useState("");
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Tab state
  const [tab, setTab] = useState<Tab>("submissions");

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<FormWebhook[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookSecret, setNewWebhookSecret] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  // ─── Fetch Portfolios ──────────────────────────────────────────

  useEffect(() => {
    if (status !== "authenticated") return;

    (async () => {
      try {
        const data = await apiGet<PortfolioOption[]>("/portfolios");
        setPortfolios(data);
        const first = data[0];
        if (first) setPortfolioId(first.id);
      } catch {
        // silent
      } finally {
        setLoadingPortfolios(false);
      }
    })();
  }, [status]);

  // ─── Fetch Submissions ─────────────────────────────────────────

  const fetchSubmissions = useCallback(async (pid: string) => {
    setLoadingSubmissions(true);
    try {
      const data = await apiGet<Submission[]>(
        `/portfolios/${pid}/submissions`,
      );
      setSubmissions(data);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  // ─── Fetch Webhooks ────────────────────────────────────────────

  const fetchWebhooks = useCallback(async (pid: string) => {
    setLoadingWebhooks(true);
    try {
      const data = await apiGet<FormWebhook[]>(
        `/webhooks?portfolioId=${pid}`,
      );
      setWebhooks(data);
    } catch {
      setWebhooks([]);
    } finally {
      setLoadingWebhooks(false);
    }
  }, []);

  // ─── Load data when portfolio changes ──────────────────────────

  useEffect(() => {
    if (!portfolioId) return;
    fetchSubmissions(portfolioId);
    fetchWebhooks(portfolioId);
  }, [portfolioId, fetchSubmissions, fetchWebhooks]);

  // ─── Submission Actions ────────────────────────────────────────

  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm("Delete this submission?")) return;
    try {
      await apiDelete(`/submissions/${id}`);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      // silent
    }
  };

  const handleToggleRead = async (sub: Submission) => {
    try {
      await apiPatch(`/submissions/${sub.id}`, { isRead: !sub.isRead });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, isRead: !s.isRead } : s)),
      );
    } catch {
      // silent
    }
  };

  // ─── Webhook Actions ──────────────────────────────────────────

  const handleAddWebhook = async () => {
    if (!newWebhookUrl.trim() || !portfolioId) return;
    setSavingWebhook(true);
    try {
      const created = await apiPost<FormWebhook>("/webhooks", {
        portfolioId,
        url: newWebhookUrl.trim(),
        events: ["submission.created"],
        secret: newWebhookSecret.trim() || undefined,
      });
      setWebhooks((prev) => [created, ...prev]);
      setNewWebhookUrl("");
      setNewWebhookSecret("");
      setShowAddWebhook(false);
    } catch {
      // silent
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleToggleWebhook = async (webhook: FormWebhook) => {
    try {
      const updated = await apiPatch<FormWebhook>(`/webhooks/${webhook.id}`, {
        isActive: !webhook.isActive,
      });
      setWebhooks((prev) =>
        prev.map((w) => (w.id === webhook.id ? updated : w)),
      );
    } catch {
      // silent
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!window.confirm("Delete this webhook?")) return;
    try {
      await apiDelete(`/webhooks/${id}`);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch {
      // silent
    }
  };

  // ─── Filtered Submissions ─────────────────────────────────────

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase();
    return submissions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [submissions, searchQuery]);

  // ─── Loading State ─────────────────────────────────────────────

  if (status === "loading" || loadingPortfolios) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
          <Mail className="h-7 w-7 text-primary/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">No portfolios found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a portfolio first to manage forms
          </p>
        </div>
      </div>
    );
  }

  // ─── Tab Config ────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "submissions", label: "Submissions", icon: <Mail className="h-3.5 w-3.5" /> },
    { key: "webhooks", label: "Webhooks", icon: <Globe className="h-3.5 w-3.5" /> },
    { key: "settings", label: "Settings", icon: <Shield className="h-3.5 w-3.5" /> },
  ];

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Forms</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage form submissions, webhooks, and settings
          </p>
        </div>

        {/* Portfolio selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent/50 sm:w-56"
          >
            <span className="truncate">
              {portfolios.find((p) => p.id === portfolioId)?.title ??
                "Select portfolio"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          </button>
          {dropdownOpen && portfolios.length > 1 && (
            <div className="absolute right-0 top-full z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md sm:w-56">
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

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border/40 bg-muted/30 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Submissions Tab ───────────────────────────────────── */}
      {tab === "submissions" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border/60 bg-background py-2 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {loadingSubmissions ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                <Mail className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No submissions match your search" : "No submissions yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/40">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_140px_80px_40px] gap-3 border-b border-border/40 bg-muted/20 px-4 py-2.5">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </span>
                <span />
              </div>

              {/* Table rows */}
              {filteredSubmissions.map((sub) => (
                <div key={sub.id}>
                  <div
                    className={`grid cursor-pointer grid-cols-[1fr_1fr_140px_80px_40px] gap-3 border-b border-border/20 px-4 py-3 transition-colors hover:bg-accent/30 ${
                      !sub.isRead ? "bg-primary/[0.02]" : ""
                    }`}
                    onClick={() =>
                      setExpandedId(expandedId === sub.id ? null : sub.id)
                    }
                  >
                    <span
                      className={`truncate text-sm ${
                        !sub.isRead ? "font-medium" : ""
                      }`}
                    >
                      {sub.name}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {sub.email}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRead(sub);
                      }}
                      className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        sub.isRead
                          ? "bg-muted text-muted-foreground hover:bg-muted/80"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      {sub.isRead ? "Read" : "Unread"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubmission(sub.id);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Expanded row */}
                  {expandedId === sub.id && (
                    <div className="border-b border-border/20 bg-muted/10 px-4 py-4">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Message
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {sub.message}
                      </p>
                      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                        <span>
                          From: {sub.name} &lt;{sub.email}&gt;
                        </span>
                        <span>
                          {new Date(sub.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Webhooks Tab ──────────────────────────────────────── */}
      {tab === "webhooks" && (
        <div className="space-y-4">
          {/* Add webhook button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddWebhook(!showAddWebhook)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Webhook
            </button>
          </div>

          {/* Inline add form */}
          {showAddWebhook && (
            <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Secret (optional)
                </label>
                <input
                  type="text"
                  placeholder="HMAC signing secret"
                  value={newWebhookSecret}
                  onChange={(e) => setNewWebhookSecret(e.target.value)}
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddWebhook}
                  disabled={!newWebhookUrl.trim() || savingWebhook}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingWebhook && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAddWebhook(false);
                    setNewWebhookUrl("");
                    setNewWebhookSecret("");
                  }}
                  className="rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Webhook list */}
          {loadingWebhooks ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                <Globe className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                No webhooks configured
              </p>
              <p className="text-xs text-muted-foreground/70">
                Add a webhook to receive form submission notifications
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center gap-3 rounded-lg border border-border/40 px-4 py-3 transition-colors hover:bg-accent/20"
                >
                  {/* URL */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={webhook.url}>
                      {webhook.url.length > 60
                        ? webhook.url.slice(0, 60) + "..."
                        : webhook.url}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggleWebhook(webhook)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      webhook.isActive
                        ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        webhook.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                      }`}
                    />
                    {webhook.isActive ? "Active" : "Inactive"}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Settings Tab ──────────────────────────────────────── */}
      {tab === "settings" && (
        <div className="space-y-6">
          {/* Notification email */}
          <div className="rounded-lg border border-border/40 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Notification Email</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Form submissions are sent to your account email:
                </p>
                <p className="mt-2 inline-flex items-center rounded-md bg-muted/50 px-3 py-1.5 text-sm font-medium">
                  {session?.user?.email ?? "No email configured"}
                </p>
              </div>
            </div>
          </div>

          {/* Spam protection */}
          <div className="rounded-lg border border-border/40 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Spam Protection</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your forms are protected with multiple layers of spam prevention:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Honeypot fields &mdash; invisible traps that catch automated bots
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Rate limiting &mdash; prevents rapid-fire form submissions
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Input validation &mdash; server-side sanitization of all fields
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
