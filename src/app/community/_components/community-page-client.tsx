"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

import { TemplateGrid } from "@/components/community/template-grid";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError } from "@/lib/api/client";
import { cloneCommunityTemplate, type CommunityTemplate } from "@/lib/api/community-templates";

interface CommunityPageClientProps {
  initialTemplates: CommunityTemplate[];
  initialNextCursor: string | null;
}

export function CommunityPageClient({
  initialTemplates,
  initialNextCursor,
}: CommunityPageClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

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

  return (
    <TemplateGrid
      initialTemplates={initialTemplates}
      initialNextCursor={initialNextCursor}
      onUse={handleUse}
    />
  );
}
