"use client";

import {
  memo,
  useCallback,
  useRef,
  useState,
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from "react";

// ─── Constants ───────────────────────────────────────────────────

const HANDLE_SIZE = 8;

// ─── Types ───────────────────────────────────────────────────────

interface CanvasElementProps {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  sortOrder?: number;
  isSelected: boolean;
  isLocked?: boolean;
  isHidden?: boolean;
  canvasScale: number;
  onSelect: (id: string, additive: boolean) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number, x: number, y: number) => void;
  onDoubleClick?: (id: string) => void;
  onContextMenu?: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

type HandlePosition =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

const HANDLE_CURSORS: Record<HandlePosition, string> = {
  "top-left": "nwse-resize",
  top: "ns-resize",
  "top-right": "nesw-resize",
  left: "ew-resize",
  right: "ew-resize",
  "bottom-left": "nesw-resize",
  bottom: "ns-resize",
  "bottom-right": "nwse-resize",
};

const HANDLES: HandlePosition[] = [
  "top-left",
  "top",
  "top-right",
  "left",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
];

// ─── Resize Handle ───────────────────────────────────────────────

function ResizeHandle({
  position,
  onResizeStart,
}: {
  position: HandlePosition;
  onResizeStart: (pos: HandlePosition, e: ReactPointerEvent) => void;
}) {
  const posStyle: React.CSSProperties = {};
  const half = -HANDLE_SIZE / 2;

  if (position.includes("top")) posStyle.top = half;
  if (position.includes("bottom")) posStyle.bottom = half;
  if (position.includes("left")) posStyle.left = half;
  if (position.includes("right")) posStyle.right = half;

  if (position === "top" || position === "bottom") {
    posStyle.left = "50%";
    posStyle.marginLeft = half;
  }
  if (position === "left" || position === "right") {
    posStyle.top = "50%";
    posStyle.marginTop = half;
  }

  return (
    <div
      className="absolute z-50 transition-transform duration-100 hover:scale-125"
      style={{
        ...posStyle,
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        backgroundColor: "var(--b-handle-bg)",
        border: "2px solid var(--b-accent)",
        borderRadius: 3,
        cursor: HANDLE_CURSORS[position],
        boxShadow: "0 1px 4px rgba(0,0,0,0.4), 0 0 0 1px var(--b-accent-glow)",
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onResizeStart(position, e);
      }}
    />
  );
}

// ─── Canvas Element (memoized + selection overlay) ───────────────

export const CanvasElement = memo(function CanvasElement({
  id,
  x,
  y,
  w,
  h,
  rotation,
  isSelected,
  isLocked,
  isHidden,
  canvasScale,
  onSelect,
  onMove,
  onResize,
  onDoubleClick,
  onContextMenu: onCtxMenu,
  sortOrder = 0,
  onDragStart,
  onDragEnd,
  children,
}: CanvasElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, elX: 0, elY: 0 });
  const resizeStart = useRef({
    mouseX: 0,
    mouseY: 0,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    handle: "" as HandlePosition,
  });

  // ── Drag to move ──────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (isLocked || isResizing) return;
      if (e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onSelect(id, e.shiftKey);

      setIsDragging(true);
      onDragStart?.(id);
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        elX: x,
        elY: y,
      };
    },
    [id, x, y, isLocked, isResizing, onSelect, onDragStart],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: globalThis.PointerEvent) => {
      const dx = (e.clientX - dragStart.current.mouseX) / canvasScale;
      const dy = (e.clientY - dragStart.current.mouseY) / canvasScale;
      onMove(
        id,
        Math.round(dragStart.current.elX + dx),
        Math.round(dragStart.current.elY + dy),
      );
    };

    const handleUp = () => {
      setIsDragging(false);
      onDragEnd?.();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, id, canvasScale, onMove, onDragEnd]);

  // ── Resize ────────────────────────────────────────────────────

  const handleResizeStart = useCallback(
    (handle: HandlePosition, e: ReactPointerEvent) => {
      if (isLocked) return;

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsResizing(true);
      resizeStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        x,
        y,
        w,
        h,
        handle,
      };
    },
    [isLocked, x, y, w, h],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: globalThis.PointerEvent) => {
      const {
        mouseX,
        mouseY,
        x: sx,
        y: sy,
        w: sw,
        h: sh,
        handle,
      } = resizeStart.current;
      const dx = (e.clientX - mouseX) / canvasScale;
      const dy = (e.clientY - mouseY) / canvasScale;

      let newX = sx,
        newY = sy,
        newW = sw,
        newH = sh;

      if (handle.includes("right")) newW = Math.max(20, sw + dx);
      if (handle.includes("left")) {
        newW = Math.max(20, sw - dx);
        newX = sx + (sw - newW);
      }
      if (handle.includes("bottom")) newH = Math.max(20, sh + dy);
      if (handle.includes("top")) {
        newH = Math.max(20, sh - dy);
        newY = sy + (sh - newH);
      }

      onResize(
        id,
        Math.round(newW),
        Math.round(newH),
        Math.round(newX),
        Math.round(newY),
      );
    };

    const handleUp = () => setIsResizing(false);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isResizing, id, canvasScale, onResize]);

  if (isHidden) return null;

  return (
    <div
      ref={elementRef}
      className="absolute"
      style={{
        left: x,
        top: y,
        width: w,
        height: h === 0 ? "auto" : h,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        zIndex: isSelected ? 100 : isDragging ? 99 : sortOrder + 1,
        opacity: isHidden ? 0.3 : 1,
        touchAction: "none",
      }}
    >
      {/* Content — pointer-events DISABLED so interactive elements
          (buttons, links, forms) never steal clicks from selection.
          This is how Figma works: content is purely visual in design mode. */}
      <div className="relative h-full w-full" style={{ pointerEvents: "none" }}>
        {children}
      </div>

      {/* Transparent click/drag overlay — captures ALL pointer events.
          This sits on top and ensures single-click always selects,
          drag always moves, regardless of what content is rendered. */}
      <div
        className="absolute inset-0 z-10"
        style={{
          cursor: isLocked
            ? "default"
            : isDragging
              ? "grabbing"
              : "default",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelect(id, false);
          onCtxMenu?.(id, e.clientX, e.clientY);
        }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick?.(id);
        }}
      />

      {/* Hover outline */}
      {isHovered && !isSelected && !isDragging && (
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            border: "1.5px solid var(--b-accent)",
            borderRadius: 4,
            opacity: 0.4,
          }}
        />
      )}

      {/* Selection outline + handles */}
      {isSelected && (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              border: "1.5px solid var(--b-accent)",
              borderRadius: 4,
              boxShadow:
                "0 0 0 1px var(--b-accent-glow), inset 0 0 0 1px var(--b-accent-glow)",
            }}
          />

          {/* Dimension badge */}
          <div
            className="pointer-events-none absolute -top-7 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-0.5 text-[10px] font-semibold tabular-nums"
            style={{
              backgroundColor: "var(--b-accent)",
              color: "#fff",
              letterSpacing: "0.03em",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {Math.round(w)} ×{" "}
            {Math.round(
              h === 0 ? (elementRef.current?.clientHeight ?? 0) : h,
            )}
          </div>

          {/* Resize handles */}
          {!isLocked &&
            HANDLES.map((pos) => (
              <ResizeHandle
                key={pos}
                position={pos}
                onResizeStart={handleResizeStart}
              />
            ))}
        </>
      )}
    </div>
  );
});

// ─── Smart Alignment Guides (memoized) ───────────────────────────

export interface GuideInfo {
  type: "vertical" | "horizontal";
  position: number;
  start: number;
  end: number;
}

export const SmartGuides = memo(function SmartGuides({
  guides,
  transform,
}: {
  guides: GuideInfo[];
  transform: { x: number; y: number; scale: number };
}) {
  if (guides.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[200]"
      style={{ overflow: "visible" }}
    >
      {guides.map((g, i) => {
        if (g.type === "vertical") {
          const x = g.position * transform.scale + transform.x;
          const y1 = g.start * transform.scale + transform.y;
          const y2 = g.end * transform.scale + transform.y;
          return (
            <line
              key={i}
              x1={x}
              y1={y1}
              x2={x}
              y2={y2}
              stroke="var(--b-accent)"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          );
        } else {
          const y = g.position * transform.scale + transform.y;
          const x1 = g.start * transform.scale + transform.x;
          const x2 = g.end * transform.scale + transform.x;
          return (
            <line
              key={i}
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="var(--b-accent)"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          );
        }
      })}
    </svg>
  );
});

// ─── Frame Component (memoized) ──────────────────────────────────

export interface FrameProps {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  patternStyle?: React.CSSProperties;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onContextMenu?: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
}

export const CanvasFrame = memo(function CanvasFrame({
  id,
  name,
  x,
  y,
  width,
  height,
  backgroundColor,
  patternStyle,
  isSelected,
  onSelect,
  onContextMenu: onCtxMenu,
  children,
}: FrameProps) {
  return (
    <div
      className="absolute"
      style={{ left: x, top: y, width, minHeight: height }}
    >
      {/* Frame label */}
      <div
        className="absolute -top-8 left-0 flex cursor-pointer select-none items-center gap-2"
        style={{ maxWidth: width }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        <div
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: isSelected
              ? "var(--b-accent)"
              : "var(--b-frame-dot)",
            boxShadow: isSelected ? "0 0 6px var(--b-accent)" : "none",
            transition: "all 0.2s",
          }}
        />
        <span
          className="truncate text-[11px] font-semibold tracking-wide"
          style={{
            color: isSelected
              ? "var(--b-accent)"
              : "var(--b-frame-label)",
            transition: "color 0.2s",
          }}
        >
          {name}
        </span>
      </div>

      {/* Frame body */}
      <div
        data-frame-id={id}
        className="relative overflow-hidden"
        style={{
          width,
          minHeight: height,
          backgroundColor: backgroundColor ?? "#0f172a",
          borderRadius: 10,
          border: isSelected
            ? "1.5px solid var(--b-accent)"
            : "1px solid var(--b-frame-border)",
          boxShadow: isSelected
            ? "0 0 0 1px var(--b-accent-glow), 0 0 30px var(--b-accent-glow), 0 8px 40px rgba(0,0,0,0.3)"
            : "var(--b-frame-shadow)",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onClick={(e) => {
          // Select frame when clicking empty space (not on a block's overlay)
          e.stopPropagation();
          onSelect(id);
        }}
        onContextMenu={(e) => {
          if (onCtxMenu) {
            e.preventDefault();
            e.stopPropagation();
            onCtxMenu(id, e.clientX, e.clientY);
          }
        }}
      >
        {/* Pattern overlay */}
        {patternStyle && Object.keys(patternStyle).length > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
              borderRadius: 10,
              ...patternStyle,
            }}
          />
        )}
        {children}
      </div>
    </div>
  );
});
