import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PageNav } from "@/components/portfolio/page-nav";
import { PasswordGate } from "@/components/portfolio/password-gate";
import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer";
import { APP_NAME, APP_URL } from "@/config/constants";
import { db } from "@/lib/db";
import type { PortfolioWithRelations } from "@/types";

interface Props {
  params: Promise<{ username: string; slug: string }>;
}

const getPortfolioData = cache(async (
  username: string,
  slug: string,
): Promise<PortfolioWithRelations | null> => {
  // Try by username first, then fall back to userId
  const user = await db.user.findUnique({
    where: { username },
    select: { id: true },
  }) ?? await db.user.findUnique({
    where: { id: username },
    select: { id: true },
  });

  if (!user) return null;

  const portfolio = await db.portfolio.findFirst({
    where: {
      userId: user.id,
      slug,
      status: "PUBLISHED",
    },
    include: {
      sections: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        include: {
          blocks: {
            where: { isVisible: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      pages: { orderBy: { sortOrder: "asc" } },
      theme: true,
      template: true,
      customFonts: true,
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  if (!portfolio) return null;

  return portfolio as PortfolioWithRelations;
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  const portfolio = await getPortfolioData(username, slug);

  if (!portfolio) return { title: "Portfolio Not Found" };

  const title = portfolio.seoTitle ?? `${portfolio.title} — ${portfolio.user.name ?? username}`;
  const description =
    portfolio.seoDescription ??
    portfolio.description ??
    `${portfolio.user.name}'s portfolio: ${portfolio.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${APP_URL}/portfolio/${username}/${slug}`,
      siteName: APP_NAME,
      ...(portfolio.ogImageUrl ? { images: [{ url: portfolio.ogImageUrl }] } : {}),
    },
    twitter: {
      card: portfolio.ogImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(portfolio.ogImageUrl ? { images: [portfolio.ogImageUrl] } : {}),
    },
  };
}

export const revalidate = 60;

export default async function PortfolioBySlugPage({ params }: Props) {
  const { username, slug } = await params;
  const portfolio = await getPortfolioData(username, slug);

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

  const pages = portfolio.pages ?? [];
  const hasPages = pages.length > 0;

  // Filter to home page sections (no pageId) when pages exist
  const homePortfolio = hasPages
    ? { ...portfolio, sections: portfolio.sections.filter((s) => !s.pageId) }
    : portfolio;

  const baseUrl = `/portfolio/${username}/${slug}`;
  const t = portfolio.theme;
  const primaryColor = t?.primaryColor ?? "#06b6d4";
  const textColor = t?.textColor ?? "#f8fafc";
  const surfaceColor = t?.surfaceColor ?? "#1e293b";

  return (
    <>
      {hasPages && (
        <PageNav
          pages={pages}
          baseUrl={baseUrl}
          primaryColor={primaryColor}
          textColor={textColor}
          surfaceColor={surfaceColor}
        />
      )}
      <PortfolioRenderer portfolio={homePortfolio} />
    </>
  );
}
