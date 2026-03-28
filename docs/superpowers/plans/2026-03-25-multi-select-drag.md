# Multi-Select Drag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users draw a rubber-band marquee to select multiple blocks, then drag all selected blocks together.

**Architecture:** Three-layer change — (1) CanvasElement gets an id-aware `onDragStart`, (2) CanvasEngine grows marquee tracking + rendering internally (avoids re-rendering the heavy workspace on every pointer move), (3) builder-workspace replaces the single `selectedBlockId` string with a `Set<string>`, wires up multi-drag via a drag-start-positions ref, and handles the marquee callback to intersect blocks.

**Tech Stack:** React, TypeScript, Zustand (portfolioStore/builderStore), pointer events API

---

## File Map

| File | Change |
|------|--------|
| `src/components/builder/canvas-element.tsx` | Change `onDragStart` signature to pass `id` |
| `src/components/builder/canvas-engine.tsx` | Add marquee state, rendering, `onMarqueeEnd` prop |
| `src/components/builder/builder-workspace.tsx` | Replace `selectedBlockId` → `selectedBlockIds: Set<string>` at ALL 14 call sites, multi-drag, marquee handler, right-panel multi-select info |

---

## Task 1: Update CanvasElement `onDragStart` to pass `id`

**Files:**
- Modify: `src/components/builder/canvas-element.tsx`

The `onDragStart` prop currently passes no args. The workspace needs to know which block started dragging so it can snapshot initial positions of all selected blocks.

- [ ] **Step 1: Update the interface**

In `CanvasElementProps` (line 36), change:
```typescript
onDragStart?: () => void;
```
to:
```typescript
onDragStart?: (id: string) => void;
```

- [ ] **Step 2: Update the call site in `handlePointerDown`**

At line 172, change:
```typescript
onDragStart?.();
```
to:
```typescript
onDragStart?.(id);
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/bharathakumar/Downloads/portfolio-builder && npx tsc --noEmit 2>&1 | head -30
```
Expected: 1–2 errors about callers of `onDragStart` with wrong signature. These will be fixed in Task 3.

- [ ] **Step 4: Commit**

```bash
git add src/components/builder/canvas-element.tsx
git commit -m "refactor: pass id to CanvasElement onDragStart callback"
```

---

## Task 2: Add marquee selection to CanvasEngine

**Files:**
- Modify: `src/components/builder/canvas-engine.tsx`

CanvasEngine handles all pointer events on the canvas background (blocks stop propagation via `e.stopPropagation()` in their own `handlePointerDown`, so only background pointer events reach CanvasEngine). Marquee state lives here to avoid re-rendering the ~3900-line workspace on every mouse move.

**Key formula:** canvas coords = `(screenX - containerLeft - transform.x) / transform.scale`

- [ ] **Step 1: Add `onMarqueeEnd` to `CanvasEngineProps` and destructure**

In the `CanvasEngineProps` interface (line 17), add after `showGrid?: boolean;`:
```typescript
onMarqueeEnd?: (x1: number, y1: number, x2: number, y2: number) => void;
```

In the `export function CanvasEngine` destructure (line 77), add `onMarqueeEnd` to the params.

- [ ] **Step 2: Add marquee refs/state inside `CanvasEngine`**

After the existing `const transformStart = useRef(...)` block (line ~90), add:
```typescript
const marqueeStart = useRef<{ x: number; y: number } | null>(null);
const [marqueeRect, setMarqueeRect] = useState<{
  x: number; y: number; w: number; h: number;
} | null>(null);
```

- [ ] **Step 3: Start marquee in `handlePointerDown` (use `else if` to prevent simultaneous pan+marquee)**

Current `handlePointerDown` (lines 156–173) ends right after the `if (shouldPan)` block with no return. Replace the whole function to use `else if`:

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
    } else if (e.button === 0 && onMarqueeEnd) {
      // Start rubber-band marquee (only when onMarqueeEnd is provided — not in draw mode)
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      marqueeStart.current = { x: sx, y: sy };
      setMarqueeRect({ x: sx, y: sy, w: 0, h: 0 });
    }
  },
  [isSpaceHeld, onMarqueeEnd],
);
```

- [ ] **Step 4: Update `handlePointerMove` to also update the marquee**

Replace the existing `handlePointerMove` (lines 176–188):

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
    if (marqueeStart.current) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ex = e.clientX - rect.left;
      const ey = e.clientY - rect.top;
      setMarqueeRect({
        x: Math.min(marqueeStart.current.x, ex),
        y: Math.min(marqueeStart.current.y, ey),
        w: Math.abs(ex - marqueeStart.current.x),
        h: Math.abs(ey - marqueeStart.current.y),
      });
    }
  },
  [isPanning, onTransformChange],
);
```

(`marqueeStart` and `containerRef` are refs — no need in deps.)

- [ ] **Step 5: Commit marquee on `handlePointerUp`**

Replace `handlePointerUp` (lines 190–192):

```typescript
const handlePointerUp = useCallback(() => {
  setIsPanning(false);
  if (marqueeStart.current && onMarqueeEnd) {
    setMarqueeRect((currentRect) => {
      if (currentRect && (currentRect.w > 4 || currentRect.h > 4)) {
        const t = transformRef.current;
        // marqueeRect is already in screen-space, min-corner normalized
        const canvasX1 = (currentRect.x - t.x) / t.scale;
        const canvasY1 = (currentRect.y - t.y) / t.scale;
        const canvasX2 = canvasX1 + currentRect.w / t.scale;
        const canvasY2 = canvasY1 + currentRect.h / t.scale;
        onMarqueeEnd(canvasX1, canvasY1, canvasX2, canvasY2);
      }
      return null; // clear marquee rect
    });
  } else {
    setMarqueeRect(null);
  }
  marqueeStart.current = null;
}, [onMarqueeEnd]);
```

Note: We use the functional `setMarqueeRect` updater to read the latest rect without adding it to deps (avoids stale closure). `onMarqueeEnd` is in deps because we call it conditionally.

- [ ] **Step 6: Render the marquee overlay inside the CanvasEngine JSX**

In the return block, after the `{showGrid && <CanvasGrid ... />}` block (line ~241), add:
```tsx
{/* Rubber-band marquee overlay */}
{marqueeRect && (marqueeRect.w > 2 || marqueeRect.h > 2) && (
  <div
    className="pointer-events-none absolute z-[60]"
    style={{
      left: marqueeRect.x,
      top: marqueeRect.y,
      width: marqueeRect.w,
      height: marqueeRect.h,
      border: "1.5px dashed var(--b-accent)",
      backgroundColor: "rgba(20,184,166,0.08)",
      borderRadius: 2,
    }}
  />
)}
```

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/bharathakumar/Downloads/portfolio-builder && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors (workspace doesn't pass `onMarqueeEnd` yet — it's optional).

- [ ] **Step 8: Commit**

```bash
git add src/components/builder/canvas-engine.tsx
git commit -m "feat: rubber-band marquee tracking and rendering in CanvasEngine"
```

---

## Task 3: Refactor builder-workspace.tsx — all 14 `selectedBlockId` sites

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

This task replaces ALL usages of `selectedBlockId`/`setSelectedBlockId`. There are 14 call sites. Each is addressed explicitly below.

### 3a — Replace state declaration + add refs (line 733)

- [ ] **Step 1: Replace state**

Old:
```typescript
const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
```
New:
```typescript
const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
```

### 3b — Update `selectedBlock` memo (lines 797–804)

- [ ] **Step 2: Update selectedBlock**

Old:
```typescript
const selectedBlock = useMemo(() => {
  if (!selectedBlockId) return null;
  for (const s of portfolio.sections) {
    const b = s.blocks.find((bl) => bl.id === selectedBlockId);
    if (b) return b;
  }
  return null;
}, [selectedBlockId, portfolio.sections]);
```
New:
```typescript
const selectedBlock = useMemo(() => {
  if (selectedBlockIds.size !== 1) return null;
  const id = [...selectedBlockIds][0];
  for (const s of portfolio.sections) {
    const b = s.blocks.find((bl) => bl.id === id);
    if (b) return b;
  }
  return null;
}, [selectedBlockIds, portfolio.sections]);
```

### 3c — Update selection callbacks

- [ ] **Step 3: Update `handleCanvasClick` (line ~892)**

Old:
```typescript
const handleCanvasClick = useCallback(() => {
  setSelectedBlockId(null);
  setSelectedSectionId(null);
}, []);
```
New:
```typescript
const handleCanvasClick = useCallback(() => {
  setSelectedBlockIds(new Set());
  setSelectedSectionId(null);
}, []);
```

- [ ] **Step 4: Update `selectBlock` (lines 896–908)**

Old:
```typescript
const selectBlock = useCallback(
  (blockId: string, _additive: boolean) => {
    setSelectedBlockId(blockId);
    for (const s of portfolio.sections) {
      if (s.blocks.some((b) => b.id === blockId)) {
        setSelectedSectionId(s.id);
        break;
      }
    }
    setRightPanel("properties");
  },
  [portfolio.sections],
);
```
New:
```typescript
const selectBlock = useCallback(
  (blockId: string, additive: boolean) => {
    setSelectedBlockIds((prev) => {
      if (additive) {
        const next = new Set(prev);
        if (next.has(blockId)) {
          next.delete(blockId);
        } else {
          next.add(blockId);
        }
        return next;
      }
      return new Set([blockId]);
    });
    for (const s of portfolio.sections) {
      if (s.blocks.some((b) => b.id === blockId)) {
        setSelectedSectionId(s.id);
        break;
      }
    }
    setRightPanel("properties");
  },
  [portfolio.sections],
);
```

- [ ] **Step 5: Update `selectSection` (line ~910)**

Old:
```typescript
const selectSection = useCallback((sectionId: string) => {
  setSelectedSectionId(sectionId);
  setSelectedBlockId(null);
}, []);
```
New:
```typescript
const selectSection = useCallback((sectionId: string) => {
  setSelectedSectionId(sectionId);
  setSelectedBlockIds(new Set());
}, []);
```

### 3d — Block CRUD: addBlockAt, addBlock, deleteBlock, duplicateBlock

- [ ] **Step 6: `addBlock` (~line 950)**

Find: `setSelectedBlockId(newBlock.id);`
Replace: `setSelectedBlockIds(new Set([newBlock.id]));`

- [ ] **Step 7: `addBlockAt` (draw-mode block creation, line 826)**

Find: `setSelectedBlockId(res.id);`
Replace: `setSelectedBlockIds(new Set([res.id]));`

- [ ] **Step 8: `duplicateBlock` (line 1081)**

Find: `setSelectedBlockId(res.id);`
Replace: `setSelectedBlockIds(new Set([res.id]));`

- [ ] **Step 9: `deleteBlock` (line 1051)**

Old:
```typescript
if (selectedBlockId === blockId) setSelectedBlockId(null);
```
New:
```typescript
if (selectedBlockIds.has(blockId)) {
  setSelectedBlockIds((prev) => {
    const next = new Set(prev);
    next.delete(blockId);
    return next;
  });
}
```

### 3e — Section CRUD: addSectionFromTemplate, deleteSection

- [ ] **Step 10: `addSectionFromTemplate` (line 1154)**

Find: `setSelectedBlockId(null);`
Replace: `setSelectedBlockIds(new Set());`

- [ ] **Step 11: `deleteSection` (line 1237)**

Old:
```typescript
if (selectedSectionId === id) {
  setSelectedSectionId(null);
  setSelectedBlockId(null);
}
```
New:
```typescript
if (selectedSectionId === id) {
  setSelectedSectionId(null);
  setSelectedBlockIds(new Set());
}
```

### 3f — Keyboard shortcuts

- [ ] **Step 12: Arrow-key handler (line ~1682)**

Old:
```typescript
if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selectedBlockId && selectedSectionId) {
  ...
  const block = portfolio.sections
    .find((s) => s.id === selectedSectionId)
    ?.blocks.find((b) => b.id === selectedBlockId);
  ...
  portfolioStore.updateBlockInSection(selectedSectionId, selectedBlockId, { styles: ... });
  ...
  portfolioStore.updateBlockInSection(selectedSectionId, selectedBlockId, { [field]: ... });
```
New (add a helper at the top of the condition and replace all 3 uses):
```typescript
const _singleId = selectedBlockIds.size === 1 ? [...selectedBlockIds][0]! : null;
if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && _singleId && selectedSectionId) {
  ...
  const block = portfolio.sections
    .find((s) => s.id === selectedSectionId)
    ?.blocks.find((b) => b.id === _singleId);
  ...
  portfolioStore.updateBlockInSection(selectedSectionId, _singleId, { styles: ... });
  ...
  portfolioStore.updateBlockInSection(selectedSectionId, _singleId, { [field]: ... });
```

- [ ] **Step 13: Delete/Backspace handler (line ~1716)**

Old:
```typescript
if ((e.key === "Delete" || e.key === "Backspace") && selectedBlockId && selectedSectionId) {
  ...
  deleteBlock(selectedBlockId, selectedSectionId);
```
New:
```typescript
const _singleId2 = selectedBlockIds.size === 1 ? [...selectedBlockIds][0]! : null;
if ((e.key === "Delete" || e.key === "Backspace") && _singleId2 && selectedSectionId) {
  ...
  deleteBlock(_singleId2, selectedSectionId);
```

Note: If `_singleId` from the arrow-key block is in the same `useEffect` closure, reuse it (rename to avoid shadowing). Use your judgment based on the actual block structure.

- [ ] **Step 14: Ctrl+C handler (line ~1739)**

Old:
```typescript
if (mod && e.key === "c" && selectedBlockId) {
  e.preventDefault();
  const block = portfolio.sections.flatMap(s => s.blocks).find(b => b.id === selectedBlockId);
```
New:
```typescript
const _copyId = selectedBlockIds.size === 1 ? [...selectedBlockIds][0]! : null;
if (mod && e.key === "c" && _copyId) {
  e.preventDefault();
  const block = portfolio.sections.flatMap(s => s.blocks).find(b => b.id === _copyId);
```

- [ ] **Step 15: Ctrl+V paste handler (line 1776)**

Find: `setSelectedBlockId(pastedBlock.id);`
Replace: `setSelectedBlockIds(new Set([pastedBlock.id]));`

### 3g — Toolbar button clicks

- [ ] **Step 16: SEO button (line 2326)**

Old:
```typescript
onClick={() => { setRightPanel("seo"); setSelectedBlockId(null); }}
```
New:
```typescript
onClick={() => { setRightPanel("seo"); setSelectedBlockIds(new Set()); }}
```

- [ ] **Step 17: Theme button (line 2520)**

Old:
```typescript
onClick={() => { setRightPanel("theme"); setSelectedBlockId(null); }}
```
New:
```typescript
onClick={() => { setRightPanel("theme"); setSelectedBlockIds(new Set()); }}
```

### 3h — Image upload in right panel toolbar (line 3034)

- [ ] **Step 18: Image upload block creation**

Find: `setSelectedBlockId(newBlock.id);`  (line 3034, inside image upload handler)
Replace: `setSelectedBlockIds(new Set([newBlock.id]));`

### 3i — Add multi-drag logic

- [ ] **Step 19: Update `moveBlock` (lines 957–982)**

Replace the entire `moveBlock` function:

```typescript
const moveBlock = useCallback(
  (blockId: string, newX: number, newY: number) => {
    if (!selectedSectionId) return;
    const section = portfolio.sections.find((s) => s.id === selectedSectionId);
    if (!section) return;
    const block = section.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const gs = builderStore.gridSize;
    const snap = builderStore.snapToGrid;
    const device = builderStore.devicePreview;

    // Delta from drag-start snapshot (set in handleBlockDragStart)
    const startPos = dragStartPositions.current.get(blockId);
    const dx = startPos ? newX - startPos.x : 0;
    const dy = startPos ? newY - startPos.y : 0;

    // Collect blocks to move: dragged block + all other selected blocks
    const toMove: Array<{ b: typeof block; tx: number; ty: number }> = [];
    if (selectedBlockIds.has(blockId) && startPos) {
      for (const b of section.blocks) {
        if (!selectedBlockIds.has(b.id)) continue;
        const bStart = dragStartPositions.current.get(b.id);
        if (!bStart) continue;
        toMove.push({ b, tx: bStart.x + dx, ty: bStart.y + dy });
      }
    }
    if (toMove.length === 0) {
      toMove.push({ b: block, tx: newX, ty: newY });
    }

    for (const { b, tx, ty } of toMove) {
      const sx = snap ? Math.round(tx / gs) * gs : tx;
      const sy = snap ? Math.round(ty / gs) * gs : ty;
      if (device === "desktop") {
        portfolioStore.updateBlockInSection(selectedSectionId, b.id, {
          styles: { ...(b.styles as BlockStyles), x: sx, y: sy },
        });
      } else {
        const field = device === "tablet" ? "tabletStyles" : "mobileStyles";
        const existing = (b[field] ?? {}) as Partial<BlockStyles>;
        portfolioStore.updateBlockInSection(selectedSectionId, b.id, {
          [field]: { ...existing, x: sx, y: sy },
        });
      }
    }
  },
  [selectedSectionId, selectedBlockIds, portfolio.sections, portfolioStore, builderStore.gridSize, builderStore.snapToGrid, builderStore.devicePreview],
);
```

- [ ] **Step 20: Add `handleBlockDragStart` (after `moveBlock`)**

```typescript
const handleBlockDragStart = useCallback(
  (blockId: string) => {
    if (!selectedSectionId) return;
    const section = portfolio.sections.find((s) => s.id === selectedSectionId);
    if (!section) return;
    const device = builderStore.devicePreview;
    const snapshot = new Map<string, { x: number; y: number }>();
    // Snapshot all selected blocks in this section
    for (const b of section.blocks) {
      if (!selectedBlockIds.has(b.id)) continue;
      const ms = mergeDeviceStyles(
        b.styles,
        b.tabletStyles as Partial<BlockStyles>,
        b.mobileStyles as Partial<BlockStyles>,
        device,
      );
      snapshot.set(b.id, { x: ms.x ?? 0, y: ms.y ?? 0 });
    }
    // Also snapshot the dragged block itself (in case it wasn't in selectedBlockIds yet)
    if (!snapshot.has(blockId)) {
      const b = section.blocks.find((bl) => bl.id === blockId);
      if (b) {
        const ms = mergeDeviceStyles(
          b.styles,
          b.tabletStyles as Partial<BlockStyles>,
          b.mobileStyles as Partial<BlockStyles>,
          device,
        );
        snapshot.set(blockId, { x: ms.x ?? 0, y: ms.y ?? 0 });
      }
    }
    dragStartPositions.current = snapshot;
  },
  [selectedSectionId, selectedBlockIds, portfolio.sections, builderStore.devicePreview],
);
```

- [ ] **Step 21: Add `handleMarqueeEnd` (after `handleBlockDragStart`)**

```typescript
const handleMarqueeEnd = useCallback(
  (canvasX1: number, canvasY1: number, canvasX2: number, canvasY2: number) => {
    const intersecting = new Set<string>();
    let hitSectionId: string | null = null;

    for (const section of portfolio.sections) {
      if (!section.isVisible) continue;
      for (const block of section.blocks) {
        if (!block.isVisible) continue;
        const bs = block.styles as BlockStyles;
        const bx = bs.x ?? 0;
        const by = bs.y ?? 0;
        const bw = bs.w ?? 200;
        const bh = bs.h ?? 50;
        // AABB intersection test
        if (bx < canvasX2 && bx + bw > canvasX1 && by < canvasY2 && by + bh > canvasY1) {
          intersecting.add(block.id);
          hitSectionId = section.id;
        }
      }
    }

    if (intersecting.size > 0) {
      setSelectedBlockIds(intersecting);
      if (hitSectionId) setSelectedSectionId(hitSectionId);
      setRightPanel("properties");
    }
  },
  [portfolio.sections],
);
```

### 3j — Update render sites

- [ ] **Step 22: Left panel layer list `isSelected` (line ~2654)**

Old: `isSelected={block.id === selectedBlockId}`
New: `isSelected={selectedBlockIds.has(block.id)}`

- [ ] **Step 23: `isSectionSelected` in left panel (line ~2588)**

Old:
```typescript
const isSectionSelected = selectedSectionId === section.id && !selectedBlockId;
```
New:
```typescript
const isSectionSelected = selectedSectionId === section.id && selectedBlockIds.size === 0;
```

- [ ] **Step 24: CanvasFrame `isSelected` (line ~2832)**

Old:
```typescript
isSelected={selectedSectionId === section.id && !selectedBlockId}
```
New:
```typescript
isSelected={selectedSectionId === section.id && selectedBlockIds.size === 0}
```

- [ ] **Step 25: CanvasElement props — `isSelected` + `onDragStart` (lines ~2843–2866)**

The current CanvasElement render block looks like:
```tsx
<CanvasElement
  key={block.id}
  id={block.id}
  x={ms.x ?? 40}
  y={ms.y ?? 0}
  w={ms.w ?? DEFAULT_BLOCK_W}
  h={ms.h ?? 0}
  rotation={ms.rotation}
  isSelected={block.id === selectedBlockId}
  isLocked={block.isLocked}
  isHidden={!block.isVisible}
  canvasScale={transform.scale}
  onSelect={selectBlock}
  onMove={moveBlock}
  onResize={resizeBlock}
  sortOrder={block.sortOrder}
  onContextMenu={handleBlockContextMenu}
>
```
Change `isSelected` and add `onDragStart`:
```tsx
<CanvasElement
  key={block.id}
  id={block.id}
  x={ms.x ?? 40}
  y={ms.y ?? 0}
  w={ms.w ?? DEFAULT_BLOCK_W}
  h={ms.h ?? 0}
  rotation={ms.rotation}
  isSelected={selectedBlockIds.has(block.id)}
  isLocked={block.isLocked}
  isHidden={!block.isVisible}
  canvasScale={transform.scale}
  onSelect={selectBlock}
  onMove={moveBlock}
  onResize={resizeBlock}
  onDragStart={handleBlockDragStart}
  sortOrder={block.sortOrder}
  onContextMenu={handleBlockContextMenu}
>
```

- [ ] **Step 26: Pass `onMarqueeEnd` to `CanvasEngine` (line ~2802)**

Find the `<CanvasEngine` opening tag and add the prop:
```tsx
onMarqueeEnd={drawMode ? undefined : handleMarqueeEnd}
```

- [ ] **Step 27: Minimap block highlight (line ~3192)**

Old: `const isSelectedBlock = block.id === selectedBlockId;`
New: `const isSelectedBlock = selectedBlockIds.has(block.id);`

### 3k — Right panel multi-select info

- [ ] **Step 28: Check if `MousePointer2` is already imported**

```bash
grep -n "MousePointer" /Users/bharathakumar/Downloads/portfolio-builder/src/components/builder/builder-workspace.tsx | head -5
```
If not found, add `MousePointer2` to the existing `lucide-react` import line.

- [ ] **Step 29: Add multi-select info panel in the right panel ternary (line ~3269)**

The right panel ternary chain currently reads (simplified):
```tsx
{rightPanel === "theme" ? (
  <ThemeEditor ... />
) : rightPanel === "seo" ? (
  <SeoEditor ... />
) : selectedBlock && selectedSectionId ? (
  <BlockPropertiesPanel ... />
) : selectedSectionId ? (
  ...section properties...
) : (
  ...empty state...
)}
```

Insert a new branch between the `seo` branch and the `selectedBlock` branch:

```tsx
) : selectedBlockIds.size > 1 ? (
  /* ── Multi-select info ──────────────────────────────────── */
  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ color: "var(--b-text-3)" }}>
    <div
      className="flex h-10 w-10 items-center justify-center rounded-xl"
      style={{ backgroundColor: "var(--b-surface)", border: "1px solid var(--b-border)" }}
    >
      <MousePointer2 className="h-5 w-5" style={{ color: "var(--b-accent)" }} />
    </div>
    <p className="text-[13px] font-semibold" style={{ color: "var(--b-text-2)" }}>
      {selectedBlockIds.size} blocks selected
    </p>
    <p className="text-[11px] leading-relaxed" style={{ color: "var(--b-text-4)" }}>
      Drag any selected block to move them all together. Click a single block to edit its properties.
    </p>
    <button
      className="mt-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
      style={{ backgroundColor: "var(--b-surface)", border: "1px solid var(--b-border)", color: "var(--b-text-3)" }}
      onClick={() => setSelectedBlockIds(new Set())}
    >
      Clear selection
    </button>
  </div>
) : selectedBlock && selectedSectionId ? (
```

The exact edit: find the string `) : selectedBlock && selectedSectionId ? (` and replace it with the multi-select branch + the original condition:
```
) : selectedBlockIds.size > 1 ? (
  ... panel JSX ...
) : selectedBlock && selectedSectionId ? (
```

### 3l — Final verification

- [ ] **Step 30: Verify no remaining `selectedBlockId` references**

```bash
grep -n "selectedBlockId" /Users/bharathakumar/Downloads/portfolio-builder/src/components/builder/builder-workspace.tsx
```
Expected: 0 matches. Fix any remaining occurrences.

- [ ] **Step 31: TypeScript compile check**

```bash
cd /Users/bharathakumar/Downloads/portfolio-builder && npx tsc --noEmit 2>&1 | head -50
```
Expected: 0 errors.

- [ ] **Step 32: Commit**

```bash
git add src/components/builder/builder-workspace.tsx
git commit -m "feat: multi-select — Set<string> selection, rubber-band marquee, multi-block drag"
```

---

## Task 4: Manual verification

- [ ] **Step 1: Start dev server**

```bash
cd /Users/bharathakumar/Downloads/portfolio-builder && npm run dev
```

- [ ] **Step 2: Rubber-band marquee**
  - Drag on the canvas background → teal dashed rectangle appears
  - Release over blocks → those blocks show selection outlines; right panel shows "N blocks selected"

- [ ] **Step 3: Multi-drag**
  - With multiple blocks selected, grab any one → all move together as a group

- [ ] **Step 4: Shift+click additive selection**
  - Click block A → selected
  - Shift+click block B → both selected
  - Shift+click block A again → only B remains

- [ ] **Step 5: Deselect paths**
  - Click canvas background → all deselected
  - Click a frame label → all blocks deselected, frame selected
  - "Clear selection" button → all deselected

- [ ] **Step 6: Single-block interactions unchanged**
  - Click one block → properties panel shows normally with resize handles
  - Arrow keys move the block
  - Delete key removes the block
  - Ctrl+C copies it

---

## Implementation Notes

- **`dragStartPositions`** is a ref — updating it on drag start causes no re-renders.
- **`marqueeRect`** is CanvasEngine state — only CanvasEngine re-renders during marquee drag, not the 3900-line workspace.
- **`onMarqueeEnd` is `undefined` in draw mode** (workspace passes `drawMode ? undefined : handleMarqueeEnd`) — this prevents CanvasEngine from starting a marquee while in draw mode, because the `else if (e.button === 0 && onMarqueeEnd)` guard evaluates false.
- **Resize handles** remain visible on all selected blocks. The approved design says "selection outline for all" — handles on multi-selected blocks are acceptable for MVP.
- **Arrow keys, Delete, Copy** are restricted to single-block selection to prevent accidental mass edits.
- **`section.isVisible`** is a real field (see `visibleSections` filter at line ~792).
