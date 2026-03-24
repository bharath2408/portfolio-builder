import { ImageResponse } from "next/og";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Use Node runtime since Prisma needs it
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const portfolio = await db.portfolio.findFirst({
    where: { id, userId: session.user.id },
    select: {
      title: true,
      description: true,
      user: { select: { name: true, image: true } },
      theme: {
        select: {
          primaryColor: true,
          backgroundColor: true,
          textColor: true,
          fontHeading: true,
        },
      },
      _count: { select: { sections: true } },
    },
  });

  if (!portfolio) {
    return new Response("Not found", { status: 404 });
  }

  const t = portfolio.theme;
  const bgColor = t?.backgroundColor ?? "#0f172a";
  const textColor = t?.textColor ?? "#f8fafc";
  const primaryColor = t?.primaryColor ?? "#14b8a6";
  const userName = portfolio.user.name ?? "Portfolio";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bgColor,
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Gradient accents */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 16,
            position: "relative",
          }}
        >
          {/* Foliocraft badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              border: `1px solid ${primaryColor}40`,
              backgroundColor: `${primaryColor}10`,
              fontSize: 14,
              color: primaryColor,
              fontWeight: 600,
            }}
          >
            Foliocraft
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.1,
              maxWidth: 800,
              letterSpacing: -1,
            }}
          >
            {portfolio.title}
          </div>

          {/* Description */}
          {portfolio.description && (
            <div
              style={{
                fontSize: 22,
                color: `${textColor}99`,
                maxWidth: 600,
                lineHeight: 1.4,
              }}
            >
              {portfolio.description}
            </div>
          )}

          {/* Author */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 24,
              fontSize: 18,
              color: `${textColor}70`,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: primaryColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            {userName}
          </div>
        </div>

        {/* Bottom border accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}60, ${primaryColor})`,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
