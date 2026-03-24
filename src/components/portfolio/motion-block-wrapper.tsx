"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import type { BlockStyles } from "@/types";

// ─── Helpers ────────────────────────────────────────────────────

/** Walk up the DOM to find the nearest scrollable ancestor */
function getScrollParent(el: HTMLElement): HTMLElement | undefined {
  let parent = el.parentElement;
  while (parent) {
    const { overflowY, overflow } = getComputedStyle(parent);
    if (
      overflowY === "auto" || overflowY === "scroll" ||
      overflow === "auto" || overflow === "scroll"
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return undefined;
}

/** GSAP ease strings for each easing preset */
function getGsapEase(easing: string): string {
  switch (easing) {
    case "ease":        return "power1.inOut";
    case "ease-in":     return "power2.in";
    case "ease-out":    return "power2.out";
    case "ease-in-out": return "power2.inOut";
    case "spring":      return "elastic.out(1, 0.5)";
    case "bounce":      return "bounce.out";
    default:            return "power2.out";
  }
}

/** GSAP from/to vars for each animation preset */
function getGsapFromTo(animation: string): { from: Record<string, unknown>; to: Record<string, unknown> } {
  switch (animation) {
    case "fade-up":
      return { from: { opacity: 0, y: 40 }, to: { opacity: 1, y: 0 } };
    case "fade-in":
      return { from: { opacity: 0 }, to: { opacity: 1 } };
    case "slide-left":
      return { from: { opacity: 0, x: -60 }, to: { opacity: 1, x: 0 } };
    case "slide-right":
      return { from: { opacity: 0, x: 60 }, to: { opacity: 1, x: 0 } };
    case "scale":
      return { from: { opacity: 0, scale: 0.85 }, to: { opacity: 1, scale: 1 } };
    case "blur-in":
      return { from: { opacity: 0, filter: "blur(10px)" }, to: { opacity: 1, filter: "blur(0px)" } };
    case "bounce-in":
      return { from: { opacity: 0, scale: 0.3, y: 50 }, to: { opacity: 1, scale: 1, y: 0 } };
    case "flip-x":
      return {
        from: { opacity: 0, rotateX: 90, transformPerspective: 800 },
        to: { opacity: 1, rotateX: 0, transformPerspective: 800 },
      };
    case "flip-y":
      return {
        from: { opacity: 0, rotateY: 90, transformPerspective: 800 },
        to: { opacity: 1, rotateY: 0, transformPerspective: 800 },
      };
    case "rotate-in":
      return { from: { opacity: 0, rotate: -180, scale: 0.5 }, to: { opacity: 1, rotate: 0, scale: 1 } };
    case "zoom-in":
      return { from: { opacity: 0, scale: 0 }, to: { opacity: 1, scale: 1 } };
    case "typewriter":
      return { from: { opacity: 0, width: 0, overflow: "hidden" }, to: { opacity: 1, width: "auto" } };
    default:
      return { from: {}, to: {} };
  }
}

// ─── Hover effect presets (Framer Motion) ───────────────────────

function getHoverProps(effect: string) {
  switch (effect) {
    case "lift":
      return { y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" };
    case "tilt-3d":
      return { rotateX: -5, rotateY: 5, scale: 1.02 };
    case "glow":
      return { boxShadow: "0 0 30px rgba(20,184,166,0.4), 0 0 60px rgba(20,184,166,0.1)" };
    case "grow":
      return { scale: 1.08 };
    case "shake":
      return { x: [0, -4, 4, -4, 4, 0], transition: { duration: 0.4 } };
    default:
      return {};
  }
}

// ─── Main Component ─────────────────────────────────────────────

interface MotionBlockWrapperProps {
  styles: BlockStyles;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MotionBlockWrapper({ styles, children, className, style }: MotionBlockWrapperProps) {
  const animation = styles.animation ?? "none";
  const duration = styles.animationDuration ?? 0.6;
  const delay = styles.animationDelay ? styles.animationDelay / 1000 : 0;
  const easing = styles.animationEasing ?? "ease-out";
  const scrollTrigger = styles.scrollTrigger ?? "none";
  const hoverEffect = styles.hoverEffect ?? "none";
  const parallaxSpeed = styles.parallaxSpeed ?? 0.5;

  const hasAnimation = animation !== "none";
  const hasHover = hoverEffect !== "none";
  const hasParallax = scrollTrigger === "parallax";

  const ref = useRef<HTMLDivElement>(null);

  // GSAP scroll-triggered animations
  // Uses useEffect (after paint) so the browser has laid out elements
  // and ScrollTrigger can accurately measure positions.
  useEffect(() => {
    if (!ref.current || (!hasAnimation && !hasParallax)) return;

    let cleanup: (() => void) | undefined;

    // Dynamic import ensures GSAP + ScrollTrigger load only on client
    // and avoids Next.js SSR bundling issues
    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const el = ref.current;
      if (!el) return;

      const scroller = getScrollParent(el);

      const ctx = gsap.context(() => {
        if (hasParallax) {
          // Make visible for parallax-only (no entrance anim hides it)
          if (!hasAnimation) gsap.set(el, { visibility: "visible" });

          gsap.to(el, {
            y: parallaxSpeed * -100,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              ...(scroller ? { scroller } : {}),
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        if (hasAnimation) {
          const { from, to } = getGsapFromTo(animation);
          // When parallax is active, animate a child to avoid transform conflicts
          const target = hasParallax
            ? (el.querySelector("[data-gsap-anim]") as HTMLElement) ?? el
            : el;

          // visibility:"visible" in `from` removes the inline hidden
          // while opacity:0 (or other from-state) keeps it visually hidden
          gsap.fromTo(target, { ...from, visibility: "visible" }, {
            ...to,
            duration,
            delay,
            ease: getGsapEase(easing),
            scrollTrigger: {
              trigger: el,
              ...(scroller ? { scroller } : {}),
              start: "top 90%",
              toggleActions: "play none none none",
            },
          });
        }

        // Recalculate positions after everything is set up
        ScrollTrigger.refresh();
      });

      cleanup = () => ctx.revert();
    })();

    return () => cleanup?.();
  }, [hasAnimation, hasParallax, animation, duration, delay, easing, parallaxSpeed]);

  // ── No effects: plain div ──────────────────────────
  if (!hasAnimation && !hasHover && !hasParallax) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // ── Build hover wrapper (Framer Motion) ────────────
  const content = hasHover ? (
    <motion.div
      style={{ perspective: hoverEffect === "tilt-3d" ? 800 : undefined }}
      whileHover={getHoverProps(hoverEffect)}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  ) : (
    children
  );

  // ── Scroll-triggered (GSAP on ref div) ─────────────
  if (hasAnimation || hasParallax) {
    // Start invisible — GSAP will reveal on scroll.
    // Inline visibility:hidden prevents flash before GSAP sets initial state.
    const hiddenStyle: React.CSSProperties = {
      ...style,
      visibility: "hidden",
    };

    if (hasParallax && hasAnimation) {
      return (
        <div ref={ref} className={className} style={hiddenStyle}>
          <div data-gsap-anim="">{content}</div>
        </div>
      );
    }
    return (
      <div ref={ref} className={className} style={hiddenStyle}>
        {content}
      </div>
    );
  }

  // ── Hover only: Framer Motion ──────────────────────
  return (
    <motion.div
      className={className}
      style={{ ...style, perspective: hoverEffect === "tilt-3d" ? 800 : undefined }}
      whileHover={getHoverProps(hoverEffect)}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
