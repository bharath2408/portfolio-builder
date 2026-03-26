import { notFound } from "next/navigation";

import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer";
import { db } from "@/lib/db";
import type { PortfolioWithRelations } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CommunityTemplatePreviewPage({ params }: Props) {
  const { id } = await params;

  const template = await db.communityTemplate.findUnique({
    where: { id },
    select: {
      snapshotData: true,
      portfolio: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          status: true,
          templateId: true,
          isDefault: true,
          viewCount: true,
          seoTitle: true,
          seoDescription: true,
          ogImageUrl: true,
          accessPassword: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        },
      },
    },
  });

  if (!template) notFound();

  // Use frozen snapshot data captured at share time.
  // Fall back to live portfolio data only if snapshot not yet populated.
  const snapshot = template.snapshotData as {
    sections: PortfolioWithRelations["sections"];
    theme: PortfolioWithRelations["theme"];
    user: PortfolioWithRelations["user"];
  } | null;

  if (!snapshot) notFound();

  const portfolio: PortfolioWithRelations = {
    ...template.portfolio,
    sections: snapshot.sections,
    theme: snapshot.theme,
    template: null,
    user: snapshot.user,
  };

  return <PortfolioRenderer portfolio={portfolio} />;
}
