import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PasswordGate } from "@/components/portfolio/password-gate";
import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer";
import { APP_NAME, APP_URL } from "@/config/constants";
import { db } from "@/lib/db";
import type { PortfolioWithRelations } from "@/types";

interface PublicPortfolioPageProps {
  params: Promise<{ username: string }>;
}

const portfolioInclude = {
  sections: {
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" as const },
    include: {
      blocks: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" as const },
      },
    },
  },
  theme: true,
  template: true,
  customFonts: true,
  user: { select: { id: true, name: true, username: true, image: true } },
};

// React cache deduplicates calls within the same request (metadata + page)
const getPublicPortfolioData = cache(async (username: string): Promise<PortfolioWithRelations | null> => {
  // Try by username first, then fall back to userId
  const portfolios = await db.portfolio.findMany({
    where: {
      user: { username },
      status: "PUBLISHED",
    },
    include: portfolioInclude,
    orderBy: { isDefault: "desc" },
    take: 1,
  });

  if (portfolios[0]) return portfolios[0] as PortfolioWithRelations;

  // Fallback: try treating the param as a userId
  const byId = await db.portfolio.findMany({
    where: {
      userId: username,
      status: "PUBLISHED",
    },
    include: portfolioInclude,
    orderBy: { isDefault: "desc" },
    take: 1,
  });

  return (byId[0] as PortfolioWithRelations) ?? null;
});

function parseDeviceType(userAgent: string | null): string {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/mobile|iphone|android.*mobile/.test(ua)) return "mobile";
  if (/tablet|ipad|android(?!.*mobile)/.test(ua)) return "tablet";
  return "desktop";
}

function parseReferrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname;
  } catch {
    return null;
  }
}

function trackView(portfolioId: string, headersList: Headers) {
  const userAgent = headersList.get("user-agent");
  const referrer = headersList.get("referer");

  Promise.all([
    db.portfolioView.create({
      data: {
        portfolioId,
        deviceType: parseDeviceType(userAgent),
        referrer: parseReferrerHost(referrer),
      },
    }),
    db.portfolio.update({
      where: { id: portfolioId },
      data: { viewCount: { increment: 1 } },
    }),
  ]).catch(() => {});
}

export async function generateMetadata({ params }: PublicPortfolioPageProps): Promise<Metadata> {
  const { username } = await params;
  const portfolio = await getPublicPortfolioData(username);

  if (!portfolio) return { title: "Portfolio Not Found" };

  const title = portfolio.seoTitle ?? `${portfolio.user.name ?? username} — Portfolio`;
  const description = portfolio.seoDescription ?? portfolio.description ?? `${portfolio.user.name}'s professional portfolio`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${APP_URL}/portfolio/${username}`,
      siteName: APP_NAME,
      ...(portfolio.ogImageUrl ? { images: [{ url: portfolio.ogImageUrl }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Revalidate public portfolio pages every 60 seconds (ISR)
export const revalidate = 60;

export default async function PublicPortfolioPage({ params }: PublicPortfolioPageProps) {
  const { username } = await params;
  const portfolio = await getPublicPortfolioData(username);

  if (!portfolio) notFound();

  // Password protection check
  if (portfolio.accessPassword) {
    const cookieStore = await cookies();
    const accessCookie = cookieStore.get(`portfolio-access-${portfolio.id}`);
    if (accessCookie?.value !== "granted") {
      return <PasswordGate portfolioId={portfolio.id} title={portfolio.title} />;
    }
  }

  const headersList = await headers();
  trackView(portfolio.id, headersList);

  return <PortfolioRenderer portfolio={portfolio} />;
}
