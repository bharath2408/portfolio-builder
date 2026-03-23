import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer";
import type { PortfolioWithRelations } from "@/types";

interface PortfolioPreviewProps {
  portfolio: PortfolioWithRelations;
}

export function PortfolioPreview({ portfolio }: PortfolioPreviewProps) {
  return <PortfolioRenderer portfolio={portfolio} />;
}
