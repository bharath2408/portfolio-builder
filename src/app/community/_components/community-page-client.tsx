"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { TemplateGrid } from "@/components/community/template-grid";
import { useCommunityTemplate, type CommunityTemplate } from "@/lib/api/community-templates";

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

  const handleUse = async (id: string) => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push(`/login?callbackUrl=/community/use/${id}`);
      return;
    }

    const result = await useCommunityTemplate(id);
    router.push(`/dashboard/portfolios/${result.portfolioId}/edit`);
  };

  return (
    <TemplateGrid
      initialTemplates={initialTemplates}
      initialNextCursor={initialNextCursor}
      onUse={handleUse}
    />
  );
}
