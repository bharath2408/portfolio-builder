"use client";

import { Globe, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { TemplateCard } from "@/components/community/template-card";
import { TemplateGrid } from "@/components/community/template-grid";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError } from "@/lib/api/client";
import {
  cloneCommunityTemplate,
  deleteCommunityTemplate,
  fetchCommunityTemplates,
  type CommunityTemplate,
} from "@/lib/api/community-templates";
import { cn } from "@/lib/utils";

interface Props {
  initialTemplates: CommunityTemplate[];
  initialNextCursor: string | null;
}

type Tab = "global" | "mine";

// ─── My Templates Tab ─────────────────────────────────────────────

function MyTemplatesTab({ onUse }: { onUse: (id: string) => Promise<void> }) {
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchCommunityTemplates({ mine: true, limit: 24 })
      .then((res) => setTemplates(res.templates))
      .catch(() => toast({ title: "Failed to load your templates", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await deleteCommunityTemplate(id);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast({ title: "Template deleted" });
      } catch {
        toast({ title: "Failed to delete template", variant: "destructive" });
      } finally {
        setDeletingId(null);
      }
    },
    [toast],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/50">
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.04) 37%, transparent 63%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.8s ease-in-out infinite",
                  animationDelay: `${i * 200}ms`,
                }}
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted/60" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted/40" style={{ animationDelay: `${i * 150}ms` }} />
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted/30" style={{ animationDelay: `${i * 200}ms` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border/40 bg-muted/20 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm">
          <User className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[15px] font-semibold text-foreground">No templates shared yet</p>
          <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            Publish a portfolio and share it as a community template to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onUse={onUse}
          onDelete={handleDelete}
          deleting={deletingId === template.id}
        />
      ))}
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────

export function CommunityGridClient({ initialTemplates, initialNextCursor }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("global");

  const handleUse = useCallback(
    async (id: string) => {
      try {
        const { portfolioId } = await cloneCommunityTemplate(id);
        router.push(`/dashboard/portfolios/${portfolioId}/edit`);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 409) {
          toast({ title: "Portfolio limit reached", description: (err as ApiClientError).message, variant: "destructive" });
        } else {
          toast({ title: "Something went wrong", description: "Could not clone the template. Please try again.", variant: "destructive" });
        }
      }
    },
    [router, toast],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-border/60 bg-card p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("global")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-150",
            activeTab === "global"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          Global
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mine")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-150",
            activeTab === "mine"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <User className="h-3.5 w-3.5" />
          My Templates
        </button>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      {activeTab === "global" ? (
        <TemplateGrid
          initialTemplates={initialTemplates}
          initialNextCursor={initialNextCursor}
          onUse={handleUse}
          showPreview={true}
        />
      ) : (
        <MyTemplatesTab onUse={handleUse} />
      )}
    </div>
  );
}
