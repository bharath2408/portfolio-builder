"use client";

import {
  ArrowRight, ExternalLink, Github, Linkedin, Twitter, Globe,
  Mail, MapPin, Phone, Quote as QuoteIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState, useEffect } from "react";

import { CounterStat } from "@/components/portfolio/counter-stat";
import { SplitText } from "@/components/portfolio/split-text";
import { getShapeById } from "@/config/shape-presets";
import type { BlockWithStyles, ThemeTokens } from "@/types";

interface BlockRendererProps {
  block: BlockWithStyles;
  theme: ThemeTokens;
  isEditing?: boolean;
  portfolioId?: string;
  counterAnimation?: boolean;
}

// Resolve "primary", "secondary", "accent", "text", "muted", "surface" → real colors
function resolveColor(value: string | undefined, theme: ThemeTokens): string | undefined {
  if (!value) return undefined;
  const map: Record<string, string> = {
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
    accent: theme.accentColor,
    text: theme.textColor,
    muted: theme.mutedColor,
    surface: theme.surfaceColor,
    background: theme.backgroundColor,
  };
  return map[value] ?? value;
}

function resolveFontFamily(family: string | undefined, theme: ThemeTokens): string | undefined {
  if (!family) return undefined;
  const map: Record<string, string> = {
    heading: theme.fontHeading,
    body: theme.fontBody,
    mono: theme.fontMono,
  };
  return map[family] ?? family;
}

function buildInlineStyles(styles: BlockWithStyles["styles"], theme: ThemeTokens): React.CSSProperties {
  // Start with theme defaults so blocks always follow the active theme
  const s: React.CSSProperties = {
    color: theme.textColor,
  };
  if (styles.width) s.width = styles.width;
  if (styles.maxWidth) s.maxWidth = styles.maxWidth;
  if (styles.minHeight) s.minHeight = styles.minHeight;
  if (styles.display) s.display = styles.display;
  if (styles.flexDirection) s.flexDirection = styles.flexDirection;
  if (styles.alignItems) {
    const map: Record<string, string> = { start: "flex-start", end: "flex-end", center: "center", stretch: "stretch", between: "space-between" };
    s.alignItems = map[styles.alignItems] ?? styles.alignItems;
  }
  if (styles.justifyContent) {
    const map: Record<string, string> = { start: "flex-start", end: "flex-end", center: "center", between: "space-between" };
    s.justifyContent = map[styles.justifyContent] ?? styles.justifyContent;
  }
  if (styles.gap) s.gap = styles.gap;
  if (styles.flexWrap) s.flexWrap = styles.flexWrap;
  if (styles.paddingTop) s.paddingTop = styles.paddingTop;
  if (styles.paddingRight) s.paddingRight = styles.paddingRight;
  if (styles.paddingBottom) s.paddingBottom = styles.paddingBottom;
  if (styles.paddingLeft) s.paddingLeft = styles.paddingLeft;
  if (styles.marginTop) s.marginTop = styles.marginTop;
  if (styles.marginRight) s.marginRight = styles.marginRight;
  if (styles.marginBottom) s.marginBottom = styles.marginBottom;
  if (styles.marginLeft) s.marginLeft = styles.marginLeft;
  if (styles.fontSize) s.fontSize = styles.fontSize;
  if (styles.fontWeight) s.fontWeight = styles.fontWeight;
  if (styles.fontFamily) s.fontFamily = resolveFontFamily(styles.fontFamily, theme);
  if (styles.textAlign) s.textAlign = styles.textAlign;
  if (styles.lineHeight) s.lineHeight = styles.lineHeight;
  if (styles.letterSpacing) s.letterSpacing = styles.letterSpacing;
  if (styles.textTransform) s.textTransform = styles.textTransform;
  if (styles.color) s.color = resolveColor(styles.color, theme);
  if (styles.backgroundColor) s.backgroundColor = resolveColor(styles.backgroundColor, theme);
  if (styles.borderWidth) s.borderWidth = styles.borderWidth;
  if (styles.borderColor) s.borderColor = resolveColor(styles.borderColor, theme);
  if (styles.borderRadius) s.borderRadius = styles.borderRadius;
  if (styles.borderStyle) s.borderStyle = styles.borderStyle;
  if (styles.opacity !== undefined) s.opacity = styles.opacity;
  if (styles.overflow) s.overflow = styles.overflow;
  if (styles.cursor) s.cursor = styles.cursor;

  // Box shadow presets
  if (styles.boxShadow && styles.boxShadow !== "none") {
    const shadowMap: Record<string, string> = {
      sm: "0 1px 2px 0 rgba(0,0,0,0.05)",
      md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
      lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
      xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
    };
    s.boxShadow = shadowMap[styles.boxShadow] ?? styles.boxShadow;
  }

  // Background gradient (overrides backgroundColor)
  if (styles.backgroundGradient) {
    s.background = styles.backgroundGradient;
  }

  // Hover effects via CSS custom properties (consumed by wrapper)
  if (styles.hoverScale) (s as Record<string, unknown>)["--hover-scale"] = String(styles.hoverScale);
  if (styles.hoverOpacity !== undefined) (s as Record<string, unknown>)["--hover-opacity"] = String(styles.hoverOpacity);
  if (styles.hoverBackgroundColor) (s as Record<string, unknown>)["--hover-bg"] = resolveColor(styles.hoverBackgroundColor, theme);

  // Parse customCss and merge into the style object
  if (styles.customCss) {
    const cssText = styles.customCss;
    cssText.split(';').forEach(rule => {
      const colonIdx = rule.indexOf(':');
      if (colonIdx === -1) return;
      const prop = rule.slice(0, colonIdx).trim();
      const val = rule.slice(colonIdx + 1).trim();
      if (prop && val) {
        // Convert kebab-case to camelCase
        const camelProp = prop.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
        (s as Record<string, unknown>)[camelProp] = val;
      }
    });
  }

  return s;
}

const socialIconMap: Record<string, React.ComponentType<{className?: string}>> = {
  Github, Linkedin, Twitter, Globe, Mail,
};

function CmsEntryBlock({ entryId, layout, theme, isEditing: _isEditing }: { entryId: string; layout: string; theme: ThemeTokens; isEditing?: boolean }) {
  const [entry, setEntry] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!entryId) return;
    fetch(`/api/cms/entries/${entryId}`)
      .then((r) => r.json())
      .then((d) => setEntry(d?.data ?? d))
      .catch(() => {});
  }, [entryId]);

  if (!entry) {
    return <p style={{ color: resolveColor("muted", theme), fontSize: 12 }}>Loading content...</p>;
  }

  const data = (entry.data as Record<string, unknown>) ?? {};
  const title = (entry.title as string) ?? "Untitled";
  const description = (data.description as string) ?? (data.excerpt as string) ?? "";
  const coverImage = (data.coverImage as string) ?? "";

  if (layout === "compact") {
    return (
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: resolveColor("text", theme) }}>{title}</p>
        {description && <p style={{ fontSize: 12, color: resolveColor("muted", theme), marginTop: 4 }}>{description}</p>}
      </div>
    );
  }

  return (
    <div>
      {coverImage && layout === "card" && (
        <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt={title} loading="lazy" style={{ width: "100%", height: 180, objectFit: "cover" }} />
        </div>
      )}
      <p style={{ fontSize: layout === "full" ? 24 : 16, fontWeight: 700, color: resolveColor("text", theme), fontFamily: theme.fontHeading }}>{title}</p>
      {description && (
        <p style={{ fontSize: 13, color: resolveColor("muted", theme), marginTop: 8, lineHeight: 1.6 }}>{description}</p>
      )}
    </div>
  );
}

export function BlockRenderer({ block, theme, isEditing: _isEditing, portfolioId, counterAnimation }: BlockRendererProps) {
  const c = block.content as Record<string, unknown>;
  const inlineStyles = buildInlineStyles(block.styles, theme);

  switch (block.type) {
    // ── HEADING ──
    case "heading": {
      const rawLevel = c.level;
      const level = typeof rawLevel === "number" ? rawLevel : typeof rawLevel === "string" ? parseInt(rawLevel.replace(/\D/g, ""), 10) || 2 : 2;
      const safeLevel = Math.max(1, Math.min(6, level));
      const Tag = `h${safeLevel}` as keyof React.JSX.IntrinsicElements;
      // Fluid font sizes: scale down on small screens using clamp()
      const fluidSizes: Record<number, string> = {
        1: "clamp(28px, 5vw, 56px)",
        2: "clamp(24px, 4vw, 40px)",
        3: "clamp(20px, 3.5vw, 32px)",
        4: "clamp(18px, 2.5vw, 24px)",
        5: "clamp(16px, 2vw, 20px)",
        6: "clamp(14px, 1.5vw, 16px)",
      };
      const fontSize = inlineStyles.fontSize ?? fluidSizes[level];
      const textAnim = block.styles.textAnimation;
      const hasTextAnim = !_isEditing && textAnim && textAnim !== "none";
      const headingStyle = { ...inlineStyles, width: "100%", height: "100%", fontSize, fontFamily: resolveFontFamily("heading", theme), lineHeight: 1.2, wordBreak: "break-word" as const };

      if (hasTextAnim) {
        return (
          <Tag style={headingStyle}>
            <SplitText
              text={c.text as string}
              animation={textAnim}
              stagger={block.styles.textAnimationStagger ?? 30}
              highlight={c.highlight as string}
              highlightColor={theme.primaryColor}
            />
          </Tag>
        );
      }

      return (
        <Tag style={headingStyle}>
          {(c.highlight as string) ? (
            <>{(c.text as string).replace(c.highlight as string, "")}<span style={{ color: theme.primaryColor }}>{c.highlight as string}</span></>
          ) : (c.text as string)}
        </Tag>
      );
    }

    // ── TEXT ──
    case "text": {
      const txtAnim = block.styles.textAnimation;
      const hasTxtAnim = !_isEditing && txtAnim && txtAnim !== "none" && !c.html;
      if (hasTxtAnim) {
        return (
          <div style={{ ...inlineStyles, width: "100%", height: "100%", fontFamily: resolveFontFamily("body", theme), wordBreak: "break-word", overflowWrap: "anywhere" }}>
            <SplitText
              text={c.text as string}
              animation={txtAnim}
              stagger={block.styles.textAnimationStagger ?? 30}
            />
          </div>
        );
      }
      return c.html ? (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", wordBreak: "break-word", overflowWrap: "anywhere" }} dangerouslySetInnerHTML={{ __html: c.html as string }} />
      ) : (
        <p style={{ ...inlineStyles, width: "100%", height: "100%", fontFamily: resolveFontFamily("body", theme), wordBreak: "break-word", overflowWrap: "anywhere" }}>{c.text as string}</p>
      );
    }

    // ── QUOTE ──
    case "quote":
      return (
        <blockquote style={{ ...inlineStyles, width: "100%", height: "100%", borderLeftColor: resolveColor(inlineStyles.borderColor as string, theme) ?? theme.primaryColor }}>
          <p style={{ fontStyle: "italic", fontSize: inlineStyles.fontSize ?? 18, fontFamily: resolveFontFamily("body", theme) }}>
            &ldquo;{c.text as string}&rdquo;
          </p>
          {(c.author as string) && <cite style={{ fontSize: 14, opacity: 0.6, marginTop: 8, display: "block" }}>— {c.author as string}{(c.role as string) && `, ${c.role as string}`}</cite>}
        </blockquote>
      );

    // ── LIST ──
    case "list": {
      const items = (c.items as string[]) ?? [];
      const Tag = (c.ordered as boolean) ? "ol" : "ul";
      return (
        <Tag style={{ ...inlineStyles, width: "100%", height: "100%", paddingLeft: 20 }}>
          {items.map((item, i) => <li key={i} style={{ marginBottom: 4, fontSize: 14, opacity: 0.8 }}>{item}</li>)}
        </Tag>
      );
    }

    // ── CODE ──
    case "code":
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", padding: 16, backgroundColor: resolveColor("surface", theme), overflow: "auto" }}>
          {(c.filename as string) && <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 8 }}>{c.filename as string}</div>}
          <pre style={{ margin: 0, fontFamily: resolveFontFamily("mono", theme), fontSize: 13, lineHeight: 1.6 }}>
            <code>{c.code as string}</code>
          </pre>
        </div>
      );

    // ── IMAGE ──
    case "image":
      return (
        <figure style={{ ...inlineStyles, overflow: "hidden", maxWidth: "100%" }}>
          {(c.src as string) ? (
            <img src={c.src as string} alt={c.alt as string} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: ((c.objectFit as string) ?? "cover") as React.CSSProperties["objectFit"], display: "block", maxWidth: "100%" }} />
          ) : (
            <div style={{ aspectRatio: (c.aspectRatio as string) ?? "16/9", backgroundColor: resolveColor("surface", theme), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ opacity: 0.3, fontSize: 14 }}>Image placeholder</span>
            </div>
          )}
          {(c.caption as string) && <figcaption style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginTop: 8 }}>{c.caption as string}</figcaption>}
        </figure>
      );

    // ── AVATAR ──
    case "avatar": {
      const sizeMap: Record<string, number> = { sm: 48, md: 64, lg: 96, xl: 128, "2xl": 160 };
      const sz = sizeMap[(c.size as string) ?? "lg"] ?? 96;
      return (
        <div style={{ ...inlineStyles, display: "inline-block" }}>
          <div style={{
            width: sz, height: sz, borderRadius: "50%", overflow: "hidden",
            border: (c.ring as boolean) ? `3px solid ${theme.primaryColor}` : undefined,
            backgroundColor: resolveColor("surface", theme),
          }}>
            {(c.src as string) ? (
              <img src={c.src as string} alt={c.alt as string} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz / 3, opacity: 0.3 }}>?</div>
            )}
          </div>
        </div>
      );
    }

    // ── ICON ──
    case "icon": {
      const iconName = (c.name as string) ?? "Sparkles";
      const iconSize = (c.size as number) ?? 32;
      const iconColor = resolveColor((c.color as string) ?? "primary", theme) ?? theme.primaryColor;
      // Dynamically render a Lucide icon
      const IconComp = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; className?: string }>>)[iconName];
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {IconComp ? <IconComp size={iconSize} color={iconColor} /> : (
            <span style={{ fontSize: 12, opacity: 0.4 }}>{iconName}</span>
          )}
        </div>
      );
    }

    // ── DIVIDER ──
    case "divider":
      return <hr style={{ ...inlineStyles, border: "none", borderTop: `${(c.thickness as number) ?? 1}px ${(c.style as string) ?? "solid"} ${theme.textColor}`, width: "100%" }} />;

    // ── SPACER ──
    case "spacer":
      return <div style={{ ...inlineStyles, width: "100%", height: (c.height as number) ?? 40 }} />;

    // ── BUTTON ──
    case "button": {
      const variant = (c.variant as string) ?? "solid";
      const size = (c.size as string) ?? "md";
      const paddings: Record<string, string> = { sm: "8px 16px", md: "10px 24px", lg: "14px 32px" };
      const btnStyle: React.CSSProperties = {
        ...inlineStyles,
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: paddings[size], borderRadius: theme.borderRadius,
        fontWeight: 600, fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
        textDecoration: "none", transition: "all 0.2s",
        cursor: "pointer",
        borderWidth: 0, borderStyle: "none", borderColor: "transparent",
      };
      if (variant === "solid") { btnStyle.backgroundColor = theme.primaryColor; btnStyle.color = "#fff"; }
      if (variant === "outline") { btnStyle.borderWidth = 2; btnStyle.borderStyle = "solid"; btnStyle.borderColor = theme.primaryColor; btnStyle.color = theme.primaryColor; btnStyle.backgroundColor = "transparent"; }
      if (variant === "ghost") { btnStyle.color = theme.primaryColor; btnStyle.backgroundColor = "transparent"; }
      if (variant === "link") { btnStyle.color = theme.primaryColor; btnStyle.backgroundColor = "transparent"; btnStyle.textDecoration = "underline"; }
      const btnUrl = (c.url as string) ?? "#";
      const isSection = btnUrl.startsWith("#section-");
      return (
        <a
          href={btnUrl}
          target={!isSection && (c.newTab as boolean) ? "_blank" : undefined}
          rel="noopener noreferrer"
          style={btnStyle}
          onClick={isSection ? (e) => {
            e.preventDefault();
            const el = document.getElementById(btnUrl.slice(1));
            el?.scrollIntoView({ behavior: "smooth" });
          } : undefined}
        >
          {c.text as string}{(c.icon as string) && <ArrowRight size={16} />}
        </a>
      );
    }

    // ── LINK ──
    case "link": {
      const linkUrl = (c.url as string) ?? "#";
      const isSection = linkUrl.startsWith("#section-");
      return (
        <a
          href={linkUrl}
          target={!isSection && (c.newTab as boolean) ? "_blank" : undefined}
          rel="noopener noreferrer"
          style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", color: inlineStyles.color ?? theme.primaryColor, textDecoration: "underline", cursor: "pointer" }}
          onClick={isSection ? (e) => {
            e.preventDefault();
            const el = document.getElementById(linkUrl.slice(1));
            el?.scrollIntoView({ behavior: "smooth" });
          } : undefined}
        >
          {c.text as string}
        </a>
      );
    }

    // ── SOCIAL LINKS ──
    case "social_links": {
      const links = (c.links as Array<{platform: string; url: string; icon: string}>) ?? [];
      const variant = (c.variant as string) ?? "ghost";
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", gap: inlineStyles.gap ?? 12 }}>
          {links.map((link, i) => {
            const Icon = socialIconMap[link.icon] ?? Globe;
            const linkStyle: React.CSSProperties = {
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, borderRadius: 8, transition: "all 0.2s",
              textDecoration: "none", color: theme.textColor,
            };
            if (variant === "outline") { linkStyle.border = `1px solid ${theme.surfaceColor}`; }
            if (variant === "filled") { linkStyle.backgroundColor = theme.surfaceColor; }
            return <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={linkStyle}><Icon className="w-5 h-5" /></a>;
          })}
        </div>
      );
    }

    // ── BADGE ──
    case "badge": {
      const variant = (c.variant as string) ?? "subtle";
      const badgeColor = resolveColor((c.color as string) ?? "primary", theme) ?? theme.primaryColor;
      const s: React.CSSProperties = {
        display: "inline-flex", alignItems: "center", padding: "4px 12px",
        borderRadius: 20, fontSize: 12, fontWeight: 600,
      };
      if (variant === "solid") { s.backgroundColor = badgeColor; s.color = "#fff"; }
      if (variant === "outline") { s.border = `1px solid ${badgeColor}`; s.color = badgeColor; }
      if (variant === "subtle") { s.backgroundColor = `${badgeColor}15`; s.color = badgeColor; }
      return <span style={s}>{c.text as string}</span>;
    }

    // ── BADGE GROUP ──
    case "badge_group": {
      const badges = (c.badges as Array<{text: string; color?: string}>) ?? [];
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: inlineStyles.gap ?? 8 }}>
          {badges.map((b, i) => {
            const col = resolveColor(b.color ?? "primary", theme) ?? theme.primaryColor;
            return <span key={i} style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: `${col}15`, color: col }}>{b.text}</span>;
          })}
        </div>
      );
    }

    // ── SKILL BAR ──
    case "skill_bar":
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{c.name as string}</span>
            {(c.showPercentage as boolean) && <span style={{ fontSize: 12, opacity: 0.5 }}>{c.level as number}%</span>}
          </div>
          <div style={{ height: 6, borderRadius: 3, backgroundColor: `${theme.textColor}15`, overflow: "hidden" }}>
            <div style={{ width: `${c.level as number}%`, height: "100%", borderRadius: 3, backgroundColor: theme.primaryColor, transition: "width 0.5s" }} />
          </div>
        </div>
      );

    // ── SKILL GRID ──
    case "skill_grid": {
      const skills = (c.skills as Array<{name: string; level?: number}>) ?? [];
      const cols = (c.columns as number) ?? 3;
      return (
        <div style={{ ...inlineStyles, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
          {skills.map((skill, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 8, border: `1px solid ${theme.surfaceColor}`, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{skill.name}</div>
              {skill.level !== undefined && (
                <div style={{ height: 4, borderRadius: 2, backgroundColor: `${theme.textColor}15`, marginTop: 8 }}>
                  <div style={{ width: `${skill.level}%`, height: "100%", borderRadius: 2, backgroundColor: theme.primaryColor }} />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // ── PROGRESS RING ──
    case "progress_ring": {
      const value = (c.value as number) ?? 0;
      const size = (c.size as number) ?? 80;
      const r = size / 2 - 6;
      const circ = 2 * Math.PI * r;
      const offset = circ - (value / 100) * circ;
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${theme.textColor}15`} strokeWidth={4} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={theme.primaryColor} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s" }} />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, marginTop: -size/2 - 8, position: "relative" }}>{value}%</span>
          <span style={{ fontSize: 12, opacity: 0.6, marginTop: size/2 - 8 }}>{c.label as string}</span>
        </div>
      );
    }

    // ── STAT ──
    case "stat": {
      const statValue = String(c.value ?? "0");
      const statPrefix = (c.prefix as string) ?? "";
      const statSuffix = (c.suffix as string) ?? "";
      const statStyle = { fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, fontFamily: resolveFontFamily("heading", theme), color: theme.primaryColor } as React.CSSProperties;
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%" }}>
          {_isEditing || !counterAnimation ? (
            <div style={statStyle}>{statPrefix}{statValue}{statSuffix}</div>
          ) : (
            <CounterStat value={statValue} prefix={statPrefix} suffix={statSuffix} style={statStyle} />
          )}
          <div style={{ fontSize: "clamp(12px, 1.5vw, 14px)", opacity: 0.6, marginTop: 4 }}>{c.label as string}</div>
        </div>
      );
    }

    // ── PROJECT CARD ──
    case "project_card": {
      const techStack = (c.techStack as string[]) ?? [];
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", overflow: "hidden", borderColor: resolveColor(inlineStyles.borderColor as string, theme) ?? theme.surfaceColor }}>
          {(c.imageUrl as string) && (
            <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
              <img src={c.imageUrl as string} alt={c.title as string} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ padding: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: resolveFontFamily("heading", theme) }}>{c.title as string}</h3>
            {(c.description as string) && <p style={{ fontSize: 14, opacity: 0.7, marginTop: 8, lineHeight: 1.6 }}>{c.description as string}</p>}
            {techStack.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {techStack.map((t) => <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}>{t}</span>)}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {(c.liveUrl as string) && <a href={c.liveUrl as string} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: theme.primaryColor, textDecoration: "none" }}><ExternalLink size={14} />Live</a>}
              {(c.repoUrl as string) && <a href={c.repoUrl as string} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, opacity: 0.6, textDecoration: "none", color: theme.textColor }}><Github size={14} />Source</a>}
            </div>
          </div>
        </div>
      );
    }

    // ── EXPERIENCE ITEM ──
    case "experience_item": {
      const highlights = (c.highlights as string[]) ?? [];
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", borderLeft: `3px solid ${theme.primaryColor}`, position: "relative" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: theme.primaryColor, position: "absolute", left: -7.5, top: 4 }} />
          <h4 style={{ fontSize: 16, fontWeight: 700, fontFamily: resolveFontFamily("heading", theme) }}>{c.role as string}</h4>
          <div style={{ fontSize: 14, color: theme.primaryColor, fontWeight: 600, marginTop: 2 }}>{c.company as string}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
            {c.startDate as string} — {(c.current as boolean) ? "Present" : (c.endDate as string)}
            {(c.location as string) && ` · ${c.location as string}`}
          </div>
          {(c.description as string) && <p style={{ fontSize: 14, opacity: 0.7, marginTop: 8, lineHeight: 1.6 }}>{c.description as string}</p>}
          {highlights.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 16 }}>
              {highlights.map((h, i) => <li key={i} style={{ fontSize: 13, opacity: 0.6, marginBottom: 4 }}>{h}</li>)}
            </ul>
          )}
        </div>
      );
    }

    // ── TESTIMONIAL ──
    case "testimonial":
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%" }}>
          <QuoteIcon size={24} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontSize: 16, lineHeight: 1.7, fontStyle: "italic" }}>{c.quote as string}</p>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            {(c.avatar as string) && <img src={c.avatar as string} loading="lazy" decoding="async" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} alt="" />}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.author as string}</div>
              {(c.role as string) && <div style={{ fontSize: 12, opacity: 0.5 }}>{c.role as string}</div>}
            </div>
          </div>
        </div>
      );

    // ── CONTACT INFO ──
    case "contact_info": {
      const items = (c.items as Array<{type: string; label: string; value: string; icon?: string}>) ?? [];
      const iconMap: Record<string, React.ComponentType<{size?: number}>> = { Mail, MapPin, Phone, Globe };
      return (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((item, i) => {
            const Icon = iconMap[item.icon ?? ""] ?? Mail;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderRadius: 8, border: `1px solid ${theme.surfaceColor}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: `${theme.primaryColor}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, opacity: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // ── CONTACT FORM ──
    case "contact_form": {
      const fields = (c.fields as Array<{name: string; label: string; type: string; placeholder?: string}>) ?? [];
      return (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (_isEditing) return;
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());
            try {
              await fetch("/api/public/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, portfolioId: portfolioId ?? "" }),
              });
              e.currentTarget.reset();
              const btn = e.currentTarget.querySelector("button[type=submit]");
              if (btn) {
                btn.textContent = "Sent!";
                setTimeout(() => { btn.textContent = (c.submitText as string) ?? "Send Message"; }, 2000);
              }
            } catch { /* ignore */ }
          }}
          style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}
        >
          {fields.map((field) => (
            <div key={field.name}>
              <label style={{ display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.6, marginBottom: 6 }}>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea name={field.name} rows={4} placeholder={field.placeholder} style={{ width: "100%", padding: "10px 12px", borderRadius: parseInt(theme.borderRadius) || 6, border: `1px solid ${theme.surfaceColor}`, backgroundColor: "transparent", color: theme.textColor, fontSize: 14, resize: "vertical" }} />
              ) : (
                <input name={field.name} type={field.type} placeholder={field.placeholder} style={{ width: "100%", padding: "10px 12px", borderRadius: parseInt(theme.borderRadius) || 6, border: `1px solid ${theme.surfaceColor}`, backgroundColor: "transparent", color: theme.textColor, fontSize: 14 }} />
              )}
            </div>
          ))}
          <button type="submit" style={{ padding: "12px 24px", borderRadius: parseInt(theme.borderRadius) || 6, backgroundColor: theme.primaryColor, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}>
            {(c.submitText as string) ?? "Send Message"}
          </button>
        </form>
      );
    }

    // ── RECTANGLE ──
    case "rectangle": {
      const fillType = (c.fillType as string) ?? "color";
      const fill = (c.fill as string) || block.styles.backgroundColor || "#6366f1";
      const imageSrc = c.imageSrc as string;
      const objectFit = ((c.objectFit as string) ?? "cover") as React.CSSProperties["objectFit"];
      const bw = (c.borderWidth as number) ?? 0;
      const bc = (c.borderColor as string) || "transparent";
      const radius = block.styles.borderRadius ?? 8;
      return (
        <div style={{
          ...inlineStyles,
          width: "100%",
          height: "100%",
          minHeight: 40,
          backgroundColor: fillType === "image" ? "transparent" : fill,
          border: bw > 0 ? `${bw}px solid ${bc}` : "none",
          borderRadius: radius,
          overflow: "hidden",
          position: "relative",
        }}>
          {fillType === "image" && imageSrc && (
            <img src={imageSrc} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit, display: "block", borderRadius: radius }} />
          )}
        </div>
      );
    }

    // ── CIRCLE ──
    case "circle": {
      const fillType = (c.fillType as string) ?? "color";
      const fill = (c.fill as string) || block.styles.backgroundColor || "#06b6d4";
      const imageSrc = c.imageSrc as string;
      const objectFit = ((c.objectFit as string) ?? "cover") as React.CSSProperties["objectFit"];
      const bw = (c.borderWidth as number) ?? 0;
      const bc = (c.borderColor as string) || "transparent";
      return (
        <div style={{
          ...inlineStyles,
          width: "100%",
          height: "100%",
          minHeight: 40,
          backgroundColor: fillType === "image" ? "transparent" : fill,
          border: bw > 0 ? `${bw}px solid ${bc}` : "none",
          borderRadius: "50%",
          overflow: "hidden",
          position: "relative",
        }}>
          {fillType === "image" && imageSrc && (
            <img src={imageSrc} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit, display: "block", borderRadius: "50%" }} />
          )}
        </div>
      );
    }

    // ── LINE ──
    case "line": {
      const color = (c.color as string) || block.styles.backgroundColor || "#a1a1aa";
      const thickness = (c.thickness as number) ?? 2;
      const dir = (c.direction as string) ?? "horizontal";
      return (
        <div style={{
          ...inlineStyles,
          width: dir === "horizontal" ? "100%" : `${thickness}px`,
          height: dir === "horizontal" ? `${thickness}px` : "100%",
          minHeight: dir === "horizontal" ? thickness : 40,
          backgroundColor: color,
          borderRadius: thickness,
        }} />
      );
    }

    // ── EMBED ──
    case "embed": {
      const embedUrl = (c.url as string) ?? "";
      return embedUrl ? (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", overflow: "hidden" }}>
          <iframe src={embedUrl} width="100%" height="100%" style={{ border: "none", borderRadius: inlineStyles.borderRadius ?? 8 }} allowFullScreen />
        </div>
      ) : (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13, borderWidth: 1, borderStyle: "dashed", borderColor: theme.surfaceColor }}>Paste an embed URL</div>
      );
    }

    // ── YOUTUBE ──
    case "youtube": {
      const ytUrl = (c.url as string) ?? "";
      const ytMatch = ytUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
      const ytId = ytMatch?.[1];
      return ytId ? (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", overflow: "hidden", borderRadius: inlineStyles.borderRadius ?? 12 }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}${(c.autoplay as boolean) ? "?autoplay=1&mute=1" : ""}`}
            width="100%" height="100%"
            style={{ border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13, borderWidth: 1, borderStyle: "dashed", borderColor: theme.surfaceColor, borderRadius: 12 }}>Paste a YouTube URL</div>
      );
    }

    // ── SPOTIFY ──
    case "spotify": {
      const spUrl = (c.url as string) ?? "";
      const spMatch = spUrl.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
      const spType = spMatch?.[1];
      const spId = spMatch?.[2];
      const spCompact = (c.compact as boolean) ?? false;
      return spId ? (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", overflow: "hidden" }}>
          <iframe
            src={`https://open.spotify.com/embed/${spType}/${spId}${spCompact ? "?theme=0" : ""}`}
            width="100%" height="100%"
            style={{ border: "none", borderRadius: 12 }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </div>
      ) : (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13, borderWidth: 1, borderStyle: "dashed", borderColor: theme.surfaceColor, borderRadius: 12 }}>Paste a Spotify URL</div>
      );
    }

    // ── GOOGLE MAP ──
    case "google_map": {
      const mapQuery = (c.query as string) ?? "";
      const mapZoom = (c.zoom as number) ?? 14;
      return mapQuery ? (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", overflow: "hidden", borderRadius: inlineStyles.borderRadius ?? 12 }}>
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${mapZoom}&output=embed`}
            width="100%" height="100%"
            style={{ border: "none" }}
            loading="lazy"
          />
        </div>
      ) : (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13, borderWidth: 1, borderStyle: "dashed", borderColor: theme.surfaceColor, borderRadius: 12 }}>Enter a location</div>
      );
    }

    // ── CALENDLY ──
    case "calendly": {
      const calUrl = (c.url as string) ?? "";
      return calUrl ? (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", overflow: "hidden" }}>
          <iframe
            src={calUrl}
            width="100%" height="100%"
            style={{ border: "none", borderRadius: 12 }}
          />
        </div>
      ) : (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13, borderWidth: 1, borderStyle: "dashed", borderColor: theme.surfaceColor, borderRadius: 12 }}>Paste your Calendly URL</div>
      );
    }

    // ── GITHUB CONTRIBUTIONS ──
    case "github_contrib": {
      const ghUser = (c.username as string) ?? "";
      return ghUser ? (
        <div style={{ ...inlineStyles, width: "100%", height: "100%" }}>
          <img
            src={`https://ghchart.rshah.org/14b8a6/${ghUser}`}
            alt={`${ghUser}'s GitHub contributions`}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }}
          />
        </div>
      ) : (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13, borderWidth: 1, borderStyle: "dashed", borderColor: theme.surfaceColor, borderRadius: 12 }}>Enter a GitHub username</div>
      );
    }

    // ── CUSTOM HTML ──
    case "custom_html": {
      const customHtml = (c.html as string) ?? "";
      return customHtml ? (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", overflow: "hidden" }}>
          <iframe
            srcDoc={customHtml}
            width="100%" height="100%"
            style={{ border: "none", borderRadius: 8 }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : (
        <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13, borderWidth: 1, borderStyle: "dashed", borderColor: theme.surfaceColor, borderRadius: 8 }}>Add custom HTML code</div>
      );
    }

    // ── SHAPE (SVG decorative element) ──
    case "shape": {
      const svgId = (c.svgId as string) ?? "wave";
      const shapeColor = resolveColor((c.color as string) ?? "primary", theme) ?? theme.primaryColor;
      const flipH = (c.flipH as boolean) ?? false;
      const flipV = (c.flipV as boolean) ?? false;
      const shape = getShapeById(svgId);
      if (!shape) {
        return <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13 }}>Unknown shape: {svgId}</div>;
      }
      const transformParts: string[] = [];
      if (flipH) transformParts.push("scaleX(-1)");
      if (flipV) transformParts.push("scaleY(-1)");
      return (
        <div
          style={{
            ...inlineStyles,
            width: "100%",
            height: "100%",
            color: shapeColor,
            transform: transformParts.length > 0 ? transformParts.join(" ") : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: shape.svg }}
        />
      );
    }

    // ── CUSTOM SVG ──
    case "custom_svg": {
      const svgContent = (c.svg as string) ?? "";
      const svgColor = resolveColor((block.styles.color as string) ?? "primary", theme) ?? theme.primaryColor;
      if (!svgContent) {
        return <div style={{ ...inlineStyles, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13, borderWidth: 1, borderStyle: "dashed", borderColor: theme.surfaceColor, borderRadius: 8 }}>Import an SVG</div>;
      }
      return (
        <div
          style={{
            ...inlineStyles,
            width: "100%",
            height: "100%",
            color: svgColor,
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      );
    }

    // ── GROUP ──
    case "group": {
      return (
        <div
          style={{
            ...inlineStyles,
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: inlineStyles.overflow ?? "visible",
          }}
        />
      );
    }

    // ── FAQ ──
    case "faq": {
      const items = (c.items as Array<{ question: string; answer: string }>) ?? [];
      return (
        <div style={inlineStyles}>
          {items.map((item, i) => (
            <details key={i} className="border-b border-current/10 py-3" style={{ color: "inherit" }}>
              <summary className="cursor-pointer font-semibold" style={{ fontSize: block.styles.fontSize ?? 16 }}>
                {item.question}
              </summary>
              <p className="mt-2 opacity-70" style={{ fontSize: (block.styles.fontSize ?? 16) - 2 }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      );
    }

    // ── FEATURE CARD ──
    case "feature_card": {
      const iconName = (c.icon as string) ?? "Zap";
      const title = (c.title as string) ?? "Feature";
      const desc = (c.description as string) ?? "";
      const IconComp = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName];
      const iconColor = resolveColor("primary", theme) ?? theme.primaryColor;
      return (
        <div style={{ ...inlineStyles, textAlign: (block.styles.textAlign as React.CSSProperties["textAlign"]) ?? "left" }}>
          <div style={{ display: "inline-flex", padding: 10, borderRadius: 12, backgroundColor: iconColor + "15", marginBottom: 12 }}>
            {IconComp ? <IconComp size={24} className="" /> : <span>{iconName}</span>}
          </div>
          <h3 style={{ fontSize: block.styles.fontSize ?? 18, fontWeight: 700, marginBottom: 6, color: "inherit" }}>{title}</h3>
          <p style={{ fontSize: (block.styles.fontSize ?? 18) - 4, opacity: 0.7, lineHeight: 1.6, color: "inherit" }}>{desc}</p>
        </div>
      );
    }

    // ── PRODUCT CARD ──
    case "product_card": {
      const title = (c.title as string) ?? "Product";
      const price = (c.price as string) ?? "$0";
      const desc = (c.description as string) ?? "";
      const image = c.image as string;
      const buyUrl = (c.buyUrl as string) ?? "#";
      const buyLabel = (c.buyLabel as string) ?? "Buy Now";
      const accentColor = resolveColor("primary", theme) ?? theme.primaryColor;
      return (
        <div style={{ ...inlineStyles, overflow: "hidden", borderRadius: block.styles.borderRadius ?? 12, border: `1px solid ${theme.mutedColor}30` }}>
          {image && (
            <div style={{ width: "100%", aspectRatio: "4/3", background: `url(${image}) center/cover`, backgroundColor: theme.surfaceColor }} />
          )}
          {!image && (
            <div style={{ width: "100%", aspectRatio: "4/3", backgroundColor: theme.surfaceColor, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3, fontSize: 14 }}>No image</div>
          )}
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <h3 style={{ fontSize: block.styles.fontSize ?? 16, fontWeight: 700, color: "inherit" }}>{title}</h3>
              <span style={{ fontSize: block.styles.fontSize ?? 16, fontWeight: 800, color: accentColor }}>{price}</span>
            </div>
            <p style={{ fontSize: (block.styles.fontSize ?? 16) - 2, opacity: 0.7, lineHeight: 1.5, marginBottom: 12, color: "inherit" }}>{desc}</p>
            <a href={buyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "8px 20px", borderRadius: 8, backgroundColor: accentColor, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              {buyLabel}
            </a>
          </div>
        </div>
      );
    }

    // ── CTA BANNER ──
    case "cta_banner": {
      const heading = (c.heading as string) ?? "Ready to get started?";
      const subtext = (c.subtext as string) ?? "";
      const buttonText = (c.buttonText as string) ?? "Get Started";
      const buttonUrl = (c.buttonUrl as string) ?? "#";
      const accentColor = resolveColor("primary", theme) ?? theme.primaryColor;
      return (
        <div style={{ ...inlineStyles, textAlign: "center", borderRadius: block.styles.borderRadius ?? 16, backgroundColor: block.styles.backgroundColor ? resolveColor(block.styles.backgroundColor as string, theme) ?? block.styles.backgroundColor : theme.surfaceColor, padding: `${block.styles.paddingTop ?? 40}px ${block.styles.paddingRight ?? 32}px ${block.styles.paddingBottom ?? 40}px ${block.styles.paddingLeft ?? 32}px` }}>
          <h2 style={{ fontSize: block.styles.fontSize ?? 28, fontWeight: 800, marginBottom: 8, color: "inherit" }}>{heading}</h2>
          <p style={{ fontSize: (block.styles.fontSize ?? 28) - 10, opacity: 0.7, marginBottom: 20, maxWidth: 500, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6, color: "inherit" }}>{subtext}</p>
          <a href={buttonUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 10, backgroundColor: accentColor, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            {buttonText}
          </a>
        </div>
      );
    }

    // ── CMS ENTRY ──
    case "cms_entry": {
      const entryId = c.entryId as string;
      const layout = (c.layout as string) ?? "card";
      if (!entryId) {
        return (
          <div style={{ ...inlineStyles, padding: 24, textAlign: "center" as const }}>
            <p style={{ color: resolveColor("muted", theme), fontSize: 13 }}>Select a CMS entry</p>
          </div>
        );
      }
      return (
        <div style={{ ...inlineStyles, padding: layout === "compact" ? 12 : 20 }}>
          <CmsEntryBlock entryId={entryId} layout={layout} theme={theme} isEditing={_isEditing} />
        </div>
      );
    }

    // ── FALLBACK ──
    default:
      return (
        <div style={{ ...inlineStyles, padding: 16, borderWidth: 1, borderStyle: "dashed", borderColor: theme.surfaceColor, borderRadius: 8, fontSize: 13, opacity: 0.5 }}>
          Unknown block type: {block.type}
        </div>
      );
  }
}
