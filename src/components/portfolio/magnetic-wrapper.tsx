"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

interface MagneticWrapperProps {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
}

const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };

export function MagneticWrapper({
  children,
  strength = 0.2,
  radius = 100,
}: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const isTouch =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    // Disable on touch devices
    if (isTouch) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const el = ref.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < radius) {
          x.set(distX * strength);
          y.set(distY * strength);
        } else {
          x.set(0);
          y.set(0);
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [strength, radius, x, y, isTouch]);

  // Touch device — render without magnetic effect
  if (isTouch) {
    return <>{children}</>;
  }

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY, width: "inherit", height: "inherit" }}>
      {children}
    </motion.div>
  );
}
