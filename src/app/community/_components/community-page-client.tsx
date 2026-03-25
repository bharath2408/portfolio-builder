"use client";

import { Globe, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

interface CommunityPageClientProps {
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
      .catch(() =>
        toast({ title: "Failed to load your templates", variant: "destructive" }),
      )
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-border/60 bg-card"
          />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[14px] font-medium text-foreground">No templates shared yet</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Share a published portfolio as a community template to see it here.
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

export function CommunityPageClient({
  initialTemplates,
  initialNextCursor,
}: CommunityPageClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("global");

  const handleUse = useCallback(
    async (id: string) => {
      if (status === "loading") return;

      if (!session?.user) {
        router.push(`/login?callbackUrl=/community/use/${id}`);
        return;
      }

      try {
        const result = await cloneCommunityTemplate(id);
        router.push(`/dashboard/portfolios/${result.portfolioId}/edit`);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 409) {
          toast({
            title: "Portfolio limit reached",
            description: err.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Something went wrong",
            description: "Could not clone the template. Please try again.",
            variant: "destructive",
          });
        }
      }
    },
    [router, session, status, toast],
  );

  const isLoggedIn = status === "authenticated";

  return (
    <div className="flex flex-col gap-5">
      {/* ── Tabs (only shown when logged in) ───────────────────── */}
      {isLoggedIn && (
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
      )}

      {/* ── Content ────────────────────────────────────────────── */}
      {activeTab === "global" || !isLoggedIn ? (
        <TemplateGrid
          initialTemplates={initialTemplates}
          initialNextCursor={initialNextCursor}
          onUse={handleUse}
        />
      ) : (
        <MyTemplatesTab onUse={handleUse} />
      )}
    </div>
  );
}
