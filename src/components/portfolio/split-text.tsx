"use client";

import { useEffect, useRef } from "react";

type TextAnimationType =
  | "char-fade"
  | "char-wave"
  | "char-blur"
  | "word-slide"
  | "word-fade"
  | "word-scale"
  | "line-slide"
  | "line-fade";

interface SplitTextProps {
  text: string;
  animation: TextAnimationType;
  stagger?: number; // ms between each unit, default 30
  duration?: number; // seconds per unit, default 0.5
  style?: React.CSSProperties;
  className?: string;
  /** Optional highlighted word that gets colored differently */
  highlight?: string;
  highlightColor?: string;
}

/** Find nearest scrollable ancestor for IntersectionObserver root */
function getScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    const { overflowY, overflow } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll" || overflow === "auto" || overflow === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/** Get GSAP animation props for each split type */
function getAnimationProps(animation: TextAnimationType): { from: Record<string, unknown> } {
  switch (animation) {
    case "char-fade":
      return { from: { opacity: 0 } };
    case "char-wave":
      return { from: { opacity: 0, y: 20 } };
    case "char-blur":
      return { from: { opacity: 0, filter: "blur(8px)" } };
    case "word-slide":
      return { from: { opacity: 0, y: 30 } };
    case "word-fade":
      return { from: { opacity: 0 } };
    case "word-scale":
      return { from: { opacity: 0, scale: 0.5 } };
    case "line-slide":
      return { from: { opacity: 0, y: 40 } };
    case "line-fade":
      return { from: { opacity: 0 } };
    default:
      return { from: { opacity: 0 } };
  }
}

function getSplitMode(animation: TextAnimationType): "char" | "word" | "line" {
  if (animation.startsWith("char")) return "char";
  if (animation.startsWith("word")) return "word";
  return "line";
}

export function SplitText({
  text,
  animation,
  stagger = 30,
  duration = 0.5,
  style,
  className,
  highlight,
  highlightColor,
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const splitMode = getSplitMode(animation);

  // Split text into units
  const units: { text: string; isHighlight: boolean; isSpace: boolean }[] = [];

  if (splitMode === "char") {
    for (const char of text) {
      const isHL = !!(highlight && highlight.includes(char));
      units.push({ text: char, isHighlight: isHL, isSpace: char === " " });
    }
    // Smarter highlight: mark characters that are part of the highlight substring
    if (highlight) {
      const idx = text.indexOf(highlight);
      if (idx !== -1) {
        units.forEach((u, i) => {
          u.isHighlight = i >= idx && i < idx + highlight.length;
        });
      }
    }
  } else if (splitMode === "word") {
    text.split(/(\s+)/).forEach((part) => {
      if (/^\s+$/.test(part)) {
        units.push({ text: part, isHighlight: false, isSpace: true });
      } else {
        const isHL = !!(highlight && part.includes(highlight));
        units.push({ text: part, isHighlight: isHL, isSpace: false });
      }
    });
  } else {
    // Line mode — split on newlines, or treat whole text as one line
    const lines = text.includes("\n") ? text.split("\n") : [text];
    lines.forEach((line) => {
      const isHL = !!(highlight && line.includes(highlight));
      units.push({ text: line, isHighlight: isHL, isSpace: false });
    });
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAnimated.current) return;

    const spans = container.querySelectorAll<HTMLElement>("[data-split-unit]");
    if (spans.length === 0) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (hasAnimated.current || !containerRef.current) return;

      const scroller = getScrollParent(container);
      const { from } = getAnimationProps(animation);

      // Set initial hidden state
      gsap.set(spans, from);

      const ctx = gsap.context(() => {
        gsap.to(spans, {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          duration,
          stagger: stagger / 1000,
          ease: "power2.out",
          scrollTrigger: {
            trigger: container,
            ...(scroller ? { scroller } : {}),
            start: "top 90%",
            toggleActions: "play none none none",
            onEnter: () => { hasAnimated.current = true; },
          },
        });

        ScrollTrigger.refresh();
      });

      cleanup = () => ctx.revert();
    })();

    return () => cleanup?.();
  }, [animation, stagger, duration]);

  return (
    <div ref={containerRef} className={className} style={{ ...style, visibility: "hidden" }}>
      <span
        style={{ visibility: "visible" }}
        aria-label={text}
      >
        {units.map((unit, i) => {
          if (unit.isSpace && splitMode === "char") {
            return <span key={i}>&nbsp;</span>;
          }
          if (unit.isSpace) {
            return <span key={i}>{unit.text}</span>;
          }
          return (
            <span
              key={i}
              data-split-unit
              style={{
                display: splitMode === "line" ? "block" : "inline-block",
                color: unit.isHighlight && highlightColor ? highlightColor : undefined,
                willChange: "opacity, transform, filter",
              }}
            >
              {unit.text}
            </span>
          );
        })}
      </span>
    </div>
  );
}
