"use client";

import { useEffect, useRef, useState } from "react";

interface CounterStatProps {
  value: string | number;
  prefix?: string;
  suffix?: string;
  duration?: number; // seconds, default 2
  style?: React.CSSProperties;
}

/**
 * Animated counter that counts up from 0 to the target number
 * when scrolled into view. Non-numeric values render as-is.
 */
export function CounterStat({ value, prefix = "", suffix = "", duration = 2, style }: CounterStatProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  // Normalize value to string
  const valueStr = String(value ?? "0");

  // Parse the numeric part and trailing text upfront
  const cleaned = valueStr.replace(/,/g, "");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)/);
  const canAnimate = !!match;
  const target = canAnimate ? parseFloat(match[1]!) : 0;
  const trailingText = canAnimate ? cleaned.slice(match[1]!.length) : "";
  const isDecimal = canAnimate && match[1]!.includes(".");
  const hasCommas = valueStr.includes(",");

  // Full display string (used as initial and final state)
  const fullDisplay = `${prefix}${valueStr}${suffix}`;
  const [displayed, setDisplayed] = useState(fullDisplay);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current || !canAnimate || target === 0) {
      setDisplayed(fullDisplay);
      return;
    }

    // Find scroll parent for IntersectionObserver root
    let scrollParent: HTMLElement | null = null;
    let parent = el.parentElement;
    while (parent) {
      const { overflowY, overflow } = getComputedStyle(parent);
      if (overflowY === "auto" || overflowY === "scroll" || overflow === "auto" || overflow === "scroll") {
        scrollParent = parent;
        break;
      }
      parent = parent.parentElement;
    }

    // Start at 0
    setDisplayed(`${prefix}0${trailingText}${suffix}`);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;
        observer.disconnect();

        const startTime = performance.now();
        const durationMs = duration * 1000;

        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / durationMs, 1);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = eased * target;

          let formatted: string;
          if (isDecimal) {
            formatted = current.toFixed(1);
          } else {
            const rounded = Math.round(current);
            formatted = hasCommas ? rounded.toLocaleString() : String(rounded);
          }

          setDisplayed(`${prefix}${formatted}${trailingText}${suffix}`);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Ensure final value matches exactly
            setDisplayed(fullDisplay);
          }
        };

        requestAnimationFrame(animate);
      },
      { root: scrollParent, threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [valueStr, prefix, suffix, duration, canAnimate, target, trailingText, isDecimal, hasCommas, fullDisplay]);

  return <span ref={ref} style={style}>{displayed}</span>;
}
