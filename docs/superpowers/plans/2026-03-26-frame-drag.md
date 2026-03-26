# Frame Drag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to reposition frames (sections) on the builder canvas by dragging an already-selected frame.

**Architecture:** Frame drag is handled inside `CanvasEngine` via hit-testing against frame rects passed as props. When the user pointerdowns on a selected frame, the engine captures the pointer and calculates canvas-space deltas on move, calling back to `builder-workspace` which persists `frameX`/`frameY` via the portfolio store. Auto-save triggers on drag end.

**Tech Stack:** React, pointer events, Zustand (portfolio store)

---

### Task 1: Add frame drag props and state to CanvasEngine

**Files:**
- Modify: `src/components/builder/canvas-engine.tsx:17-26` (CanvasEngineProps)
- Modify: `src/components/builder/canvas-engine.tsx:78-99` (component state)

- [ ] **Step 1: Add new props to CanvasEngineProps**

In `src/components/builder/canvas-engine.tsx`, extend the `CanvasEngineProps` interface to add frame drag props:

```typescript
export interface CanvasEngineProps {
  children: React.ReactNode;
  transform: CanvasTransform;
  onTransformChange: (t: CanvasTransform) => void;
  onCanvasClick?: (e: ReactMouseEvent) => void;
  className?: string;
  cursorOverride?: string;
  showGrid?: boolean;
  onMarqueeEnd?: (x1: number, y1: number, x2: number, y2: number) => void;
  /** Frame rects for hit-testing during frame drag */
  frames?: Array<{ id: string; x: number; y: number; w: number; h: number }>;
  /** Currently selected frame ID (only set when no blocks are selected) */
  selectedFrameId?: string | null;
  /** Called on each pointer move during frame drag with new canvas-space position */
  onFrameMove?: (id: string, newX: number, newY: number) => void;
  /** Called when frame drag ends — triggers auto-save */
  onFrameDragEnd?: () => void;
}
```

- [ ] **Step 2: Destructure new props and add frame drag state**

In the `CanvasEngine` function signature, destructure the new props:

```typescript
export function CanvasEngine({
  children,
  transform,
  onTransformChange,
  onCanvasClick,
  className,
  cursorOverride,
  showGrid = true,
  onMarqueeEnd,
  frames,
  selectedFrameId,
  onFrameMove,
  onFrameDragEnd,
}: CanvasEngineProps) {
```

Add frame drag ref after the existing `justFinishedMarquee` ref (after line 95):

```typescript
const frameDrag = useRef<{
  id: string;
  startMouseX: number;
  startMouseY: number;
  startFrameX: number;
  startFrameY: number;
} | null>(null);
```

- [ ] **Step 3: Commit**

```bash
git add src/components/builder/canvas-engine.tsx
git commit -m "feat(canvas-engine): add frame drag props and state"
```

---

### Task 2: Implement frame drag pointer handlers in CanvasEngine

**Files:**
- Modify: `src/components/builder/canvas-engine.tsx:164-242` (pointer handlers)

- [ ] **Step 1: Add frame hit-test to handlePointerDown**

In `handlePointerDown`, insert a frame drag check between the pan check and the marquee start. The full updated callback:

```typescript
const handlePointerDown = useCallback(
  (e: ReactPointerEvent) => {
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
    } else if (e.button === 0 && selectedFrameId && frames && onFrameMove) {
      // Hit-test: is the pointer inside the selected frame?
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const t = transformRef.current;
      const canvasX = (e.clientX - rect.left - t.x) / t.scale;
      const canvasY = (e.clientY - rect.top - t.y) / t.scale;
      const frame = frames.find((f) => f.id === selectedFrameId);
      if (
        frame &&
        canvasX >= frame.x &&
        canvasX <= frame.x + frame.w &&
        canvasY >= frame.y - 32 &&
        canvasY <= frame.y + frame.h
      ) {
        e.preventDefault();
        container.setPointerCapture(e.pointerId);
        frameDrag.current = {
          id: frame.id,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startFrameX: frame.x,
          startFrameY: frame.y,
        };
        return;
      }
      // Not on the selected frame — fall through to marquee
      if (onMarqueeEnd) {
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        marqueeStart.current = { x: sx, y: sy };
        marqueeRectRef.current = { x: sx, y: sy, w: 0, h: 0 };
        setMarqueeRect({ x: sx, y: sy, w: 0, h: 0 });
        container.setPointerCapture(e.pointerId);
      }
    } else if (e.button === 0 && onMarqueeEnd) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      marqueeStart.current = { x: sx, y: sy };
      marqueeRectRef.current = { x: sx, y: sy, w: 0, h: 0 };
      setMarqueeRect({ x: sx, y: sy, w: 0, h: 0 });
      container.setPointerCapture(e.pointerId);
    }
  },
  [isSpaceHeld, onMarqueeEnd, selectedFrameId, frames, onFrameMove],
);
```

Key details:
- `canvasY >= frame.y - 32` accounts for the label above the frame (32px = 8 × 4, the `-top-8` Tailwind class = 2rem = 32px).
- Frame drag takes priority over marquee when the click lands on the selected frame.
- If the click is NOT on the selected frame, fall through to marquee as before.

- [ ] **Step 2: Add frame drag to handlePointerMove**

Update `handlePointerMove` to handle frame drag. Insert the frame drag check after the panning check:

```typescript
const handlePointerMove = useCallback(
  (e: ReactPointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      onTransformChange({
        ...transformRef.current,
        x: transformStart.current.x + dx,
        y: transformStart.current.y + dy,
      });
      return;
    }
    if (frameDrag.current && onFrameMove) {
      const t = transformRef.current;
      const dx = (e.clientX - frameDrag.current.startMouseX) / t.scale;
      const dy = (e.clientY - frameDrag.current.startMouseY) / t.scale;
      onFrameMove(
        frameDrag.current.id,
        Math.round(frameDrag.current.startFrameX + dx),
        Math.round(frameDrag.current.startFrameY + dy),
      );
      return;
    }
    if (marqueeStart.current) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ex = e.clientX - rect.left;
      const ey = e.clientY - rect.top;
      const newRect = {
        x: Math.min(marqueeStart.current.x, ex),
        y: Math.min(marqueeStart.current.y, ey),
        w: Math.abs(ex - marqueeStart.current.x),
        h: Math.abs(ey - marqueeStart.current.y),
      };
      marqueeRectRef.current = newRect;
      setMarqueeRect(newRect);
    }
  },
  [isPanning, onTransformChange, onFrameMove],
);
```

- [ ] **Step 3: Add frame drag cleanup to handlePointerUp**

Update `handlePointerUp` to clear frame drag state and call `onFrameDragEnd`:

```typescript
const handlePointerUp = useCallback(() => {
  setIsPanning(false);
  if (frameDrag.current) {
    frameDrag.current = null;
    onFrameDragEnd?.();
    return;
  }
  const currentRect = marqueeRectRef.current;
  if (marqueeStart.current && onMarqueeEnd && currentRect && (currentRect.w > 4 || currentRect.h > 4)) {
    const t = transformRef.current;
    const canvasX1 = (currentRect.x - t.x) / t.scale;
    const canvasY1 = (currentRect.y - t.y) / t.scale;
    const canvasX2 = canvasX1 + currentRect.w / t.scale;
    const canvasY2 = canvasY1 + currentRect.h / t.scale;
    onMarqueeEnd(canvasX1, canvasY1, canvasX2, canvasY2);
    justFinishedMarquee.current = true;
  }
  marqueeStart.current = null;
  marqueeRectRef.current = null;
  setMarqueeRect(null);
}, [onMarqueeEnd, onFrameDragEnd]);
```

- [ ] **Step 4: Update cursor logic**

Update the container's cursor style to show `grab`/`grabbing` for frame drag. Change line 286:

From:
```typescript
cursor: isPanning ? "grabbing" : isSpaceHeld ? "grab" : cursorOverride ?? "default",
```

To:
```typescript
cursor: isPanning
  ? "grabbing"
  : isSpaceHeld
    ? "grab"
    : frameDrag.current
      ? "grabbing"
      : cursorOverride ?? "default",
```

Note: Since `frameDrag` is a ref (not state), the cursor won't reactively update from `default` to `grabbing` on the first frame of a drag. This is acceptable — the cursor updates on the next pointer move, which happens within milliseconds. Using a ref avoids unnecessary re-renders during drag.

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/canvas-engine.tsx
git commit -m "feat(canvas-engine): implement frame drag pointer handlers"
```

---

### Task 3: Wire frame drag props in builder-workspace

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx:2913-2920` (CanvasEngine usage)
- Modify: `src/components/builder/builder-workspace.tsx` (add moveFrame callback, ~after line 1083)

- [ ] **Step 1: Add the moveFrame callback**

Add a `moveFrame` callback after the `handleMarqueeEnd` callback (after line 1083):

```typescript
const moveFrame = useCallback(
  (sectionId: string, newX: number, newY: number) => {
    const section = portfolio.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const ss = section.styles as SectionStyles;
    portfolioStore.updateSection(sectionId, {
      styles: { ...ss, frameX: newX, frameY: newY },
    });
  },
  [portfolio.sections, portfolioStore],
);
```

- [ ] **Step 2: Build the frames array for CanvasEngine**

Add a `useMemo` to compute the frames array. Place it near the existing `visibleSections` computation:

```typescript
const canvasFrames = useMemo(
  () =>
    visibleSections.map((section) => {
      const ss = section.styles as SectionStyles;
      return {
        id: section.id,
        x: ss.frameX ?? 0,
        y:
          ss.frameY ??
          portfolio.sections.indexOf(section) * (DEFAULT_FRAME_HEIGHT + 80),
        w: previewWidth ?? ss.frameWidth ?? DEFAULT_FRAME_WIDTH,
        h: ss.frameHeight ?? DEFAULT_FRAME_HEIGHT,
      };
    }),
  [visibleSections, portfolio.sections, previewWidth],
);
```

Also add `useMemo` to imports if not already imported (it's likely already imported).

- [ ] **Step 3: Compute selectedFrameId**

Add a derived value for `selectedFrameId` — it's the selected section when no blocks are selected:

```typescript
const selectedFrameId =
  selectedSectionId && selectedBlockIds.size === 0 ? selectedSectionId : null;
```

Place this near where `selectedSectionId` is used, before the JSX return.

- [ ] **Step 4: Wire the new props to CanvasEngine**

Update the `<CanvasEngine>` JSX (around line 2913) to pass the new props:

From:
```tsx
<CanvasEngine
  transform={transform}
  onTransformChange={setTransform}
  onCanvasClick={drawMode ? undefined : handleCanvasClick}
  cursorOverride={drawMode ? "crosshair" : undefined}
  showGrid={builderStore.showGrid}
  onMarqueeEnd={drawMode ? undefined : handleMarqueeEnd}
>
```

To:
```tsx
<CanvasEngine
  transform={transform}
  onTransformChange={setTransform}
  onCanvasClick={drawMode ? undefined : handleCanvasClick}
  cursorOverride={drawMode ? "crosshair" : undefined}
  showGrid={builderStore.showGrid}
  onMarqueeEnd={drawMode ? undefined : handleMarqueeEnd}
  frames={drawMode ? undefined : canvasFrames}
  selectedFrameId={drawMode ? null : selectedFrameId}
  onFrameMove={drawMode ? undefined : moveFrame}
  onFrameDragEnd={drawMode ? undefined : handleBlockDragOrResizeEnd}
>
```

Note: `handleBlockDragOrResizeEnd` is reused for `onFrameDragEnd` — it does exactly what we need: sets dirty flag + schedules auto-save.

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/builder-workspace.tsx
git commit -m "feat(workspace): wire frame drag to CanvasEngine"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the builder studio in the browser.

- [ ] **Step 2: Verify frame drag works**

1. Click an empty area inside a frame — it should become selected (accent border + glow).
2. Pointerdown on the selected frame and drag — the frame should move freely with the cursor.
3. Release — the frame should stay at the new position.
4. Verify auto-save triggers (check network tab or dirty indicator).

- [ ] **Step 3: Verify no regressions**

1. **Canvas pan:** Middle mouse drag and Space+drag should still pan the canvas.
2. **Block drag:** Click a block, drag it — should move within the frame as before.
3. **Marquee selection:** Click on empty canvas (not on a frame), drag — rubber-band marquee should still work.
4. **Frame select:** Click an unselected frame — should select it without starting a drag.
5. **Draw mode:** Enter draw mode (R/O/L/T) — frame drag should be disabled.

- [ ] **Step 4: Commit any fixes if needed**

```bash
git add -u
git commit -m "fix: frame drag verification fixes"
```
