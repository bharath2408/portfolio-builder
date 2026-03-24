"use client";

import { useEffect, useRef, useState } from "react";
import { BlockRenderer } from "@/components/builder/block-renderer";
import { MotionBlockWrapper } from "@/components/portfolio/motion-block-wrapper";
import { mergeDeviceStyles, getDeviceType, type DeviceType } from "@/lib/utils/device-styles";
import type {
  PortfolioWithRelations,
  SectionStyles,
  ThemeTokens,
  BlockStyles,
  BlockWithStyles,
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
          className="px-4 py-8 text-center sm:px-6"
          style={{ borderTop: `1px solid ${theme.textColor}10` }}
        >
          <p
            className="text-[12px] opacity-30 sm:text-[13px]"
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

// ─── Section with responsive rendering ──────────────────────────

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
  const hasAbsoluteBlocks = section.blocks.some((b) => {
    const bs = b.styles as BlockStyles;
    return (bs.x !== undefined && bs.x !== 0) || (bs.y !== undefined && bs.y !== 0);
  });
  const isAbsolute = ss.layout === "absolute" || hasAbsoluteBlocks || ss.frameWidth !== undefined;
  const frameWidth = ss.frameWidth ?? 1440;
  const frameHeight = ss.frameHeight ?? 800;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  // Responsive: scale canvas + detect device
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setDeviceType(getDeviceType(w));
      if (isAbsolute && containerRef.current) {
        const viewportWidth = containerRef.current.clientWidth;
        setScale(Math.min(viewportWidth / frameWidth, 1));
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isAbsolute, frameWidth]);

  const bgColor = (ss as Record<string, unknown>).backgroundCustom
    ? (ss.backgroundColor as string)
    : theme.backgroundColor;

  // Responsive padding — reduce on mobile
  const padTop = ss.paddingTop ?? 80;
  const padBottom = ss.paddingBottom ?? 80;
  const padLeft = ss.paddingLeft ?? 24;
  const padRight = ss.paddingRight ?? 24;

  const sectionStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    backgroundColor: bgColor ?? theme.backgroundColor,
    overflow: "clip",
  };

  if (!isAbsolute) {
    sectionStyle.paddingTop = isMobile ? Math.min(padTop, 48) : padTop;
    sectionStyle.paddingBottom = isMobile ? Math.min(padBottom, 48) : padBottom;
    sectionStyle.paddingLeft = isMobile ? Math.min(padLeft, 16) : padLeft;
    sectionStyle.paddingRight = isMobile ? Math.min(padRight, 16) : padRight;
  }

  const visibleBlocks = [...section.blocks]
    .filter((b) => b.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (visibleBlocks.length === 0) return null;

  // Calculate content height for absolute layout
  const contentHeight = isAbsolute ? (() => {
    let maxBottom = 0;
    for (const block of visibleBlocks) {
      const bs = block.styles as BlockStyles;
      const blockY = (bs.y ?? 0);
      let blockH = (bs.h && bs.h > 0) ? bs.h : 150;
      if (block.type === "contact_form") blockH = 350;
      else if (block.type === "project_card") blockH = 250;
      else if (block.type === "text") blockH = 120;
      else if (block.type === "heading") blockH = 80;
      maxBottom = Math.max(maxBottom, blockY + blockH);
    }
    const minHeight = frameHeight * 0.7;
    return Math.min(Math.max(maxBottom + 100, minHeight), frameHeight);
  })() : frameHeight;

  // Determine grid columns — reduce on mobile
  const gridColumns = ss.columns ?? 2;
  const responsiveGridColumns = isMobile ? 1 : gridColumns;

  // Determine flex direction — stack rows vertically on mobile
  const flexDir = ss.layout === "flex-row" ? (isMobile ? "column" : "row") : "column";

  return (
    <section ref={containerRef} id={`section-${section.id}`} style={sectionStyle}>
      {isAbsolute ? (
        // Absolute layout — scale the canvas to fit viewport
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
              const bs = mergeDeviceStyles(block.styles, block.tabletStyles, block.mobileStyles, deviceType);
              const mergedBlock = { ...block, styles: bs } as BlockWithStyles;
              const responsiveClass = [
                bs.hideOnMobile ? "hidden md:block" : "",
                bs.hideOnDesktop ? "md:hidden" : "",
                (bs.hoverScale || bs.hoverOpacity !== undefined || bs.hoverBackgroundColor) ? "block-hover" : "",
              ].filter(Boolean).join(" ") || undefined;
              return (
                <MotionBlockWrapper
                  key={block.id}
                  styles={bs}
                  className={responsiveClass}
                  style={{
                    position: "absolute",
                    left: bs.x ?? 0,
                    top: bs.y ?? 0,
                    width: bs.w ?? "auto",
                    height: bs.h === 0 ? "auto" : (bs.h ?? "auto"),
                    transform: bs.rotation
                      ? `rotate(${bs.rotation}deg)`
                      : undefined,
                  }}
                >
                  <BlockRenderer block={mergedBlock} theme={theme} portfolioId={portfolioId} />
                </MotionBlockWrapper>
              );
            })}
          </div>
        </div>
      ) : (
        // Stacked/flex/grid layout — responsive
        <div
          style={{
            maxWidth: ss.maxWidth ?? "1100px",
            margin: "0 auto",
            display: ss.layout === "grid" ? "grid" : "flex",
            flexDirection: flexDir,
            flexWrap: ss.layout === "flex-row" ? "wrap" : undefined,
            gap: isMobile ? Math.min(ss.gap ?? 16, 12) : (ss.gap ?? 16),
            alignItems:
              ss.alignItems === "center" ? "center" :
              ss.alignItems === "end" ? "flex-end" :
              ss.alignItems === "stretch" ? "stretch" : undefined,
            justifyContent:
              ss.justifyContent === "center" ? "center" :
              ss.justifyContent === "end" ? "flex-end" :
              ss.justifyContent === "between" ? "space-between" : undefined,
            gridTemplateColumns:
              ss.layout === "grid"
                ? `repeat(${responsiveGridColumns}, 1fr)`
                : undefined,
          }}
        >
          {visibleBlocks.map((block) => {
            const bs = mergeDeviceStyles(block.styles, block.tabletStyles, block.mobileStyles, deviceType);
            const mergedBlock = { ...block, styles: bs } as BlockWithStyles;
            const responsiveClass = [
              bs.hideOnMobile ? "hidden md:block" : "",
              bs.hideOnDesktop ? "md:hidden" : "",
              (bs.hoverScale || bs.hoverOpacity !== undefined || bs.hoverBackgroundColor) ? "block-hover" : "",
            ].filter(Boolean).join(" ") || undefined;
            return (
              <MotionBlockWrapper
                key={block.id}
                styles={bs}
                className={responsiveClass}
                style={{ maxWidth: "100%" }}
              >
                <BlockRenderer block={mergedBlock} theme={theme} portfolioId={portfolioId} />
              </MotionBlockWrapper>
            );
          })}
        </div>
      )}
    </section>
  );
}
