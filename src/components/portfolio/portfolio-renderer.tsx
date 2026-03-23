"use client";

import { useEffect, useRef, useState } from "react";
import { BlockRenderer } from "@/components/builder/block-renderer";
import type {
  PortfolioWithRelations,
  SectionStyles,
  ThemeTokens,
  BlockStyles,
} from "@/types";

interface PortfolioRendererProps {
  portfolio: PortfolioWithRelations;
}

const DEFAULT_THEME: ThemeTokens = {
  mode: "DARK",
  primaryColor: "#06b6d4",
  secondaryColor: "#8b5cf6",
  accentColor: "#f43f5e",
  backgroundColor: "#0f172a",
  surfaceColor: "#1e293b",
  textColor: "#f8fafc",
  mutedColor: "#94a3b8",
  fontHeading: "Outfit",
  fontBody: "DM Sans",
  fontMono: "JetBrains Mono",
  borderRadius: "0.5rem",
};

export function PortfolioRenderer({ portfolio }: PortfolioRendererProps) {
  const portfolioId = portfolio.id;
  const t = portfolio.theme;
  const theme: ThemeTokens = t
    ? {
        mode: t.mode,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        accentColor: t.accentColor,
        backgroundColor: t.backgroundColor,
        surfaceColor: t.surfaceColor,
        textColor: t.textColor,
        mutedColor: t.mutedColor,
        fontHeading: t.fontHeading,
        fontBody: t.fontBody,
        fontMono: t.fontMono,
        borderRadius: t.borderRadius,
      }
    : DEFAULT_THEME;

  // Dynamically load Google Fonts for the chosen theme fonts
  useEffect(() => {
    const fonts = [theme.fontHeading, theme.fontBody, theme.fontMono].filter(Boolean);
    const uniqueFonts = [...new Set(fonts)];
    if (uniqueFonts.length === 0) return;

    const fontParam = uniqueFonts.map(f => f.replace(/ /g, '+')).join('&family=');
    const linkId = 'portfolio-google-fonts';

    // Remove existing if any
    const existing = document.getElementById(linkId);
    if (existing) existing.remove();

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontParam}:wght@300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);

    return () => {
      const el = document.getElementById(linkId);
      if (el) el.remove();
    };
  }, [theme.fontHeading, theme.fontBody, theme.fontMono]);

  const visibleSections = [...portfolio.sections]
    .filter((s) => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        scrollBehavior: "smooth",
        fontFamily: theme.fontBody,
      }}
    >
      {visibleSections.length === 0 ? (
        <div
          className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
          style={{ color: theme.mutedColor }}
        >
          <p className="text-lg font-medium" style={{ fontFamily: theme.fontHeading }}>
            This portfolio is empty
          </p>
          <p className="mt-2 text-sm opacity-60">
            The owner hasn&apos;t added any content yet.
          </p>
        </div>
      ) : (
        visibleSections.map((section) => (
          <PortfolioSection
            key={section.id}
            section={section}
            theme={theme}
            portfolioId={portfolioId}
          />
        ))
      )}

      {/* Footer */}
      {visibleSections.length > 0 && (
        <footer
          className="px-6 py-8 text-center"
          style={{ borderTop: `1px solid ${theme.textColor}10` }}
        >
          <p
            className="text-[13px] opacity-30"
            style={{ fontFamily: theme.fontBody }}
          >
            &copy; {new Date().getFullYear()}{" "}
            {portfolio.user.name ?? "Portfolio"}. Built with Foliocraft.
          </p>
        </footer>
      )}
    </div>
  );
}

// ─── Section with responsive scaling ─────────────────────────────

function PortfolioSection({
  section,
  theme,
  portfolioId,
}: {
  section: PortfolioWithRelations["sections"][number];
  theme: ThemeTokens;
  portfolioId: string;
}) {
  const ss = section.styles as SectionStyles;
  // Detect absolute layout: if any block has explicit x/y coordinates, or if frameWidth is set, use absolute positioning
  const hasAbsoluteBlocks = section.blocks.some((b) => {
    const bs = b.styles as BlockStyles;
    return (bs.x !== undefined && bs.x !== 0) || (bs.y !== undefined && bs.y !== 0);
  });
  const isAbsolute = ss.layout === "absolute" || hasAbsoluteBlocks || ss.frameWidth !== undefined;
  const frameWidth = ss.frameWidth ?? 1440;
  const frameHeight = ss.frameHeight ?? 800;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Responsive: scale the absolute-positioned canvas to fit viewport width
  useEffect(() => {
    if (!isAbsolute) return;

    const updateScale = () => {
      if (containerRef.current) {
        const viewportWidth = containerRef.current.clientWidth;
        setScale(Math.min(viewportWidth / frameWidth, 1));
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [isAbsolute, frameWidth]);

  const bgColor = (ss as Record<string, unknown>).backgroundCustom
    ? (ss.backgroundColor as string)
    : theme.backgroundColor;

  const sectionStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    backgroundColor: bgColor ?? theme.backgroundColor,
    overflow: "hidden",
  };

  if (!isAbsolute) {
    sectionStyle.paddingTop = ss.paddingTop ?? 80;
    sectionStyle.paddingBottom = ss.paddingBottom ?? 80;
    sectionStyle.paddingLeft = ss.paddingLeft ?? 24;
    sectionStyle.paddingRight = ss.paddingRight ?? 24;
  }

  const visibleBlocks = [...section.blocks]
    .filter((b) => b.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (visibleBlocks.length === 0) return null;

  // Calculate content height: use the lowest block's y + estimated height
  // Keep at least 70% of frame height to avoid sections being too short
  const contentHeight = isAbsolute ? (() => {
    let maxBottom = 0;
    for (const block of visibleBlocks) {
      const bs = block.styles as BlockStyles;
      const blockY = (bs.y ?? 0);
      // Auto-height blocks (h=0): estimate based on type
      let blockH = (bs.h && bs.h > 0) ? bs.h : 150;
      if (block.type === "contact_form") blockH = 350;
      else if (block.type === "project_card") blockH = 250;
      else if (block.type === "text") blockH = 120;
      else if (block.type === "heading") blockH = 80;
      maxBottom = Math.max(maxBottom, blockY + blockH);
    }
    // Add padding, keep at least 70% of frame, cap at frame height
    const minHeight = frameHeight * 0.7;
    return Math.min(Math.max(maxBottom + 100, minHeight), frameHeight);
  })() : frameHeight;

  return (
    <section ref={containerRef} id={`section-${section.id}`} style={sectionStyle}>
      {isAbsolute ? (
        // Absolute layout — scale the 1440px canvas to fit viewport
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            width: "100%",
            maxWidth: frameWidth,
            height: contentHeight * scale,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: frameWidth,
              height: contentHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {visibleBlocks.map((block) => {
              const bs = block.styles as BlockStyles;
              const responsiveClass = [
                "absolute",
                bs.hideOnMobile ? "hidden md:block" : "",
                bs.hideOnDesktop ? "md:hidden" : "",
                (bs.hoverScale || bs.hoverOpacity !== undefined || bs.hoverBackgroundColor) ? "block-hover" : "",
              ].filter(Boolean).join(" ");
              return (
                <div
                  key={block.id}
                  className={responsiveClass}
                  data-animation={bs.animation && bs.animation !== "none" ? bs.animation : undefined}
                  style={{
                    left: bs.x ?? 0,
                    top: bs.y ?? 0,
                    width: bs.w ?? "auto",
                    height: bs.h === 0 ? "auto" : (bs.h ?? "auto"),
                    transform: bs.rotation
                      ? `rotate(${bs.rotation}deg)`
                      : undefined,
                    animationDelay: bs.animationDelay ? `${bs.animationDelay}ms` : undefined,
                    transition: "transform 0.2s, opacity 0.2s, background-color 0.2s",
                  }}
                >
                  <BlockRenderer block={block} theme={theme} portfolioId={portfolioId} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Stacked/flex layout
        <div
          style={{
            maxWidth: ss.maxWidth ?? "1100px",
            margin: "0 auto",
            display: ss.layout === "grid" ? "grid" : "flex",
            flexDirection:
              ss.layout === "flex-row" ? "row" : "column",
            gap: ss.gap ?? 16,
            alignItems:
              ss.alignItems === "center" ? "center" : undefined,
            justifyContent:
              ss.justifyContent === "center" ? "center" : undefined,
            gridTemplateColumns:
              ss.layout === "grid"
                ? `repeat(${ss.columns ?? 2}, 1fr)`
                : undefined,
          }}
        >
          {visibleBlocks.map((block) => {
            const bs = block.styles as BlockStyles;
            const responsiveClass = [
              bs.hideOnMobile ? "hidden md:block" : "",
              bs.hideOnDesktop ? "md:hidden" : "",
              (bs.hoverScale || bs.hoverOpacity !== undefined || bs.hoverBackgroundColor) ? "block-hover" : "",
            ].filter(Boolean).join(" ") || undefined;
            return (
              <div
                key={block.id}
                className={responsiveClass}
                data-animation={bs.animation && bs.animation !== "none" ? bs.animation : undefined}
                style={{
                  animationDelay: bs.animationDelay ? `${bs.animationDelay}ms` : undefined,
                  transition: "transform 0.2s, opacity 0.2s, background-color 0.2s",
                }}
              >
                <BlockRenderer block={block} theme={theme} portfolioId={portfolioId} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
