"use client";

import {
  memo, useCallback, useEffect, useRef, useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

// ─── Canvas State ─────────────────────────────────────────────────

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasEngineProps {
  children: React.ReactNode;
  transform: CanvasTransform;
  onTransformChange: (t: CanvasTransform) => void;
  onCanvasClick?: (e: ReactMouseEvent) => void;
  className?: string;
  cursorOverride?: string;
  showGrid?: boolean;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SENSITIVITY = 0.002;
const GRID_SIZE = 20;

// ─── CSS Grid Background (replaces SVG — far more performant) ────

const CanvasGrid = memo(function CanvasGrid({
  scale,
  offsetX,
  offsetY,
}: {
  scale: number;
  offsetX: number;
  offsetY: number;
}) {
  const gridSize = GRID_SIZE * scale;
  const gridSize5 = gridSize * 5;

  const bgImage =
    scale < 0.3
      ? `radial-gradient(circle, var(--b-grid-lg) 1px, transparent 1px)`
      : `radial-gradient(circle, var(--b-grid-sm) 0.5px, transparent 0.5px),
         radial-gradient(circle, var(--b-grid-lg) 1px, transparent 1px)`;

  const bgSize =
    scale < 0.3
      ? `${gridSize5}px ${gridSize5}px`
      : `${gridSize}px ${gridSize}px, ${gridSize5}px ${gridSize5}px`;

  const ox = offsetX % gridSize5;
  const oy = offsetY % gridSize5;
  const bgPosition =
    scale < 0.3 ? `${ox}px ${oy}px` : `${ox}px ${oy}px, ${ox}px ${oy}px`;

  return (
    <div
      className="pointer-events-none absolute inset-0"
      data-canvas
      style={{
        backgroundImage: bgImage,
        backgroundSize: bgSize,
        backgroundPosition: bgPosition,
      }}
    />
  );
});

// ─── Canvas Engine (pan + zoom + CSS grid) ────────────────────────

export function CanvasEngine({
  children,
  transform,
  onTransformChange,
  onCanvasClick,
  className,
  cursorOverride,
  showGrid = true,
}: CanvasEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const transformStart = useRef({ x: 0, y: 0 });

  // Keep transform in ref so event handlers always see latest value
  // without needing to recreate handlers on every transform change
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // RAF throttle ref
  const rafRef = useRef<number | null>(null);

  // ── Zoom — stable handler via ref (no dependency on transform) ──

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const t = transformRef.current;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (e.ctrlKey || e.metaKey) {
          const delta = -e.deltaY * ZOOM_SENSITIVITY * 2;
          const newScale = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, t.scale * (1 + delta)),
          );
          const scaleRatio = newScale / t.scale;

          onTransformChange({
            scale: newScale,
            x: mouseX - (mouseX - t.x) * scaleRatio,
            y: mouseY - (mouseY - t.y) * scaleRatio,
          });
        } else {
          onTransformChange({
            ...t,
            x: t.x - e.deltaX,
            y: t.y - e.deltaY,
          });
        }
      });
    },
    [onTransformChange],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleWheel]);

  // ── Pan (middle mouse, space+drag, or two-finger drag on touch) ──

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      // Pan: middle mouse, space+click, or single-finger touch on canvas
      const shouldPan =
        e.button === 1 ||
        (e.button === 0 && isSpaceHeld) ||
        (e.button === 0 && e.pointerType === "touch");

      if (shouldPan) {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY };
        const t = transformRef.current;
        transformStart.current = { x: t.x, y: t.y };
      }
    },
    [isSpaceHeld],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      onTransformChange({
        ...transformRef.current,
        x: transformStart.current.x + dx,
        y: transformStart.current.y + dy,
      });
    },
    [isPanning, onTransformChange],
  );

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // ── Space key for pan mode ──────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ── Click on empty canvas ─────────────────────────────────────

  const handleCanvasClick = (e: ReactMouseEvent) => {
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).dataset.canvas
    ) {
      onCanvasClick?.(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`builder-canvas relative h-full w-full overflow-hidden ${className ?? ""}`}
      style={{
        cursor: isPanning ? "grabbing" : isSpaceHeld ? "grab" : cursorOverride ?? "default",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleCanvasClick}
    >
      {/* CSS grid background */}
      {showGrid && (
        <CanvasGrid
          scale={transform.scale}
          offsetX={transform.x}
          offsetY={transform.y}
        />
      )}

      {/* Subtle radial vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, var(--b-vignette) 100%)",
        }}
        data-canvas
      />

      {/* Transformed content layer — GPU-accelerated via translate3d */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          willChange: "transform",
        }}
        data-canvas
      >
        {children}
      </div>
    </div>
  );
}

// ─── Zoom Controls UI ─────────────────────────────────────────────

export function ZoomControls({
  transform,
  onTransformChange,
  onFitToScreen,
}: {
  transform: CanvasTransform;
  onTransformChange: (t: CanvasTransform) => void;
  onFitToScreen: () => void;
}) {
  const zoom = (delta: number) => {
    const newScale = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, transform.scale + delta),
    );
    onTransformChange({ ...transform, scale: newScale });
  };

  return (
    <div className="builder-zoom-controls flex items-center gap-0.5 rounded-lg px-1 py-0.5">
      <button
        onClick={() => zoom(-0.1)}
        className="builder-zoom-btn flex h-7 w-7 items-center justify-center rounded-md text-xs"
        title="Zoom out"
      >
        −
      </button>
      <button
        onClick={onFitToScreen}
        className="builder-zoom-btn min-w-[52px] rounded-md px-2 py-1 text-center text-[11px] font-semibold tabular-nums"
        title="Fit to screen"
      >
        {Math.round(transform.scale * 100)}%
      </button>
      <button
        onClick={() => zoom(0.1)}
        className="builder-zoom-btn flex h-7 w-7 items-center justify-center rounded-md text-xs"
        title="Zoom in"
      >
        +
      </button>
    </div>
  );
}
