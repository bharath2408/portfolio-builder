"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { TemplateGrid } from "@/components/community/template-grid";
import { useCommunityTemplate, type CommunityTemplate } from "@/lib/api/community-templates";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError } from "@/lib/api/client";

interface Props {
  initialTemplates: CommunityTemplate[];
  initialNextCursor: string | null;
}

export function CommunityGridClient({ initialTemplates, initialNextCursor }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const handleUse = useCallback(
    async (id: string) => {
      try {
        const { portfolioId } = await useCommunityTemplate(id);
        router.push(`/dashboard/portfolios/${portfolioId}/edit`);
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
    [router, toast],
  );

  return (
    <TemplateGrid
      initialTemplates={initialTemplates}
      initialNextCursor={initialNextCursor}
      onUse={handleUse}
      showPreview={true}
    />
  );
}
