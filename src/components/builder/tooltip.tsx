"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
  delay?: number;
}

export function Tooltip({ content, children, side = "top", delay = 400 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        x: r.left + r.width / 2,
        y: side === "top" ? r.top - 6 : r.bottom + 6,
      });
      setVisible(true);
    }, delay);
  }, [delay, side]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="inline-flex"
      >
        {children}
      </span>
      {visible && (
        <div
          className="pointer-events-none fixed z-[500] max-w-[200px] rounded-md px-2.5 py-1.5 text-center text-[10px] font-medium leading-snug"
          style={{
            left: pos.x,
            top: pos.y,
            transform: side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            backgroundColor: "var(--b-hint-bg, #1c1917)",
            color: "var(--b-hint-text, #fafaf9)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {content}
        </div>
      )}
    </>
  );
}
