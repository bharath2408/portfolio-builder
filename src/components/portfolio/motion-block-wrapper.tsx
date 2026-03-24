"use client";

import { motion, useScroll, useTransform, type Variant } from "framer-motion";
import { useRef } from "react";

import type { BlockStyles } from "@/types";

interface MotionBlockWrapperProps {
  styles: BlockStyles;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Easing presets ──────────────────────────────────────────────

const easingMap: Record<string, number[] | string> = {
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
  // spring and bounce handled via transition type
};

// ─── Animation variants ──────────────────────────────────────────

function getAnimationVariants(animation: string): { hidden: Variant; visible: Variant } {
  switch (animation) {
    case "fade-up":
      return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
    case "fade-in":
      return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    case "slide-left":
      return { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } };
    case "slide-right":
      return { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } };
    case "scale":
      return { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1 } };
    case "blur-in":
      return { hidden: { opacity: 0, filter: "blur(10px)" }, visible: { opacity: 1, filter: "blur(0px)" } };
    case "bounce-in":
      return { hidden: { opacity: 0, scale: 0.3, y: 50 }, visible: { opacity: 1, scale: 1, y: 0 } };
    case "flip-x":
      return { hidden: { opacity: 0, rotateX: 90 }, visible: { opacity: 1, rotateX: 0 } };
    case "flip-y":
      return { hidden: { opacity: 0, rotateY: 90 }, visible: { opacity: 1, rotateY: 0 } };
    case "rotate-in":
      return { hidden: { opacity: 0, rotate: -180, scale: 0.5 }, visible: { opacity: 1, rotate: 0, scale: 1 } };
    case "zoom-in":
      return { hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1 } };
    case "typewriter":
      return { hidden: { opacity: 0, width: 0 }, visible: { opacity: 1, width: "auto" } };
    default:
      return { hidden: {}, visible: {} };
  }
}

// ─── Hover effect presets ─────────────────────────────────────────

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

// ─── Parallax wrapper ─────────────────────────────────────────────

function ParallaxWrapper({
  speed,
  children,
  className,
  style,
}: {
  speed: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 50, speed * -50]);

  return (
    <motion.div ref={ref} style={{ ...style, y }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

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

  // No animation at all — render plain div
  if (!hasAnimation && !hasHover && !hasParallax) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // Build transition
  const transition: Record<string, unknown> = { duration, delay };
  if (easing === "spring") {
    transition.type = "spring";
    transition.stiffness = 200;
    transition.damping = 20;
  } else if (easing === "bounce") {
    transition.type = "spring";
    transition.stiffness = 300;
    transition.damping = 10;
    transition.mass = 0.8;
  } else {
    transition.ease = easingMap[easing] ?? [0, 0, 0.58, 1];
  }

  const variants = hasAnimation ? getAnimationVariants(animation) : undefined;
  const hoverProps = hasHover ? getHoverProps(hoverEffect) : undefined;

  // Parallax mode
  if (hasParallax) {
    return (
      <ParallaxWrapper speed={parallaxSpeed} className={className} style={style}>
        {hasAnimation ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={variants}
            transition={transition}
            whileHover={hoverProps}
            style={{ perspective: hoverEffect === "tilt-3d" ? 800 : undefined }}
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </ParallaxWrapper>
    );
  }

  // Scroll-triggered reveal
  if (scrollTrigger === "reveal" || hasAnimation) {
    return (
      <motion.div
        className={className}
        style={{ ...style, perspective: hoverEffect === "tilt-3d" ? 800 : undefined }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={variants}
        transition={transition}
        whileHover={hoverProps}
      >
        {children}
      </motion.div>
    );
  }

  // Hover-only
  return (
    <motion.div
      className={className}
      style={{ ...style, perspective: hoverEffect === "tilt-3d" ? 800 : undefined }}
      whileHover={hoverProps}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
