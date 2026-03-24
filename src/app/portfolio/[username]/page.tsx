import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

import { PasswordGate } from "@/components/portfolio/password-gate";
import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer";
import { APP_NAME, APP_URL } from "@/config/constants";
import { db } from "@/lib/db";
import type { PortfolioWithRelations } from "@/types";

interface PublicPortfolioPageProps {
  params: Promise<{ username: string }>;
}

async function getPublicPortfolioData(username: string): Promise<PortfolioWithRelations | null> {
  const user = await db.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) return null;

  const portfolio = await db.portfolio.findFirst({
    where: {
      userId: user.id,
      status: "PUBLISHED",
      isDefault: true,
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
      theme: true,
      template: true,
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  if (!portfolio) {
    // Fallback: any published portfolio
    const fallback = await db.portfolio.findFirst({
      where: { userId: user.id, status: "PUBLISHED" },
      include: {
        sections: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
          include: { blocks: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
        },
        theme: true,
        template: true,
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    });
    return fallback as PortfolioWithRelations | null;
  }

  return portfolio as PortfolioWithRelations;
}

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
