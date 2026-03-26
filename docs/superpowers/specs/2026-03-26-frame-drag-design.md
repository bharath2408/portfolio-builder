# Frame Drag — Design Spec

**Date:** 2026-03-26
**Status:** Approved

## Summary

Allow users to reposition frames (sections) on the builder canvas by dragging. Drag is handled in `CanvasEngine` via hit-testing against frame rects.

## Interaction Model

- **Two-step activation:** Click a frame to select it, then pointerdown + drag to move it.
- **Trigger condition:** Frame is selected AND no blocks are selected (`selectedBlockIds.size === 0`).
- **Cursor:** `grab` on hover over a selected frame, `grabbing` while dragging.
- **No grid snap:** Frames move freely (no snap-to-grid).
- **Single frame only:** No multi-frame drag support.

## Architecture

### CanvasEngine changes

New props:

```typescript
frames: Array<{ id: string; x: number; y: number; w: number; h: number }>;
selectedFrameId: string | null;
onFrameMove: (id: string, newX: number, newY: number) => void;
onFrameDragEnd: () => void;
```

New internal state:

```typescript
frameDrag: {
  id: string;
  startMouseX: number;
  startMouseY: number;
  startFrameX: number;
  startFrameY: number;
} | null;
```

#### Pointer flow

1. **pointerdown (LMB, not space-panning):** Convert `clientX/clientY` to canvas space. Check if point is inside `selectedFrameId`'s rect (full frame area including label) from the `frames` array. If hit:
   - Set `frameDrag` state with start positions.
   - Capture pointer.
   - Prevent marquee from starting.
2. **pointermove (while `frameDrag` is set):** Compute canvas-space delta: `dx = (clientX - startMouseX) / scale`, `dy = (clientY - startMouseY) / scale`. Call `onFrameMove(id, startFrameX + dx, startFrameY + dy)` with rounded values.
3. **pointerup:** Clear `frameDrag`, release capture, call `onFrameDragEnd()`.

#### Interaction priority

| Trigger | Condition | Action |
|---|---|---|
| Middle mouse / Space+LMB | Always | Canvas pan |
| LMB on empty canvas | No frame hit | Marquee selection |
| LMB on selected frame | `selectedFrameId` matches, no blocks selected | Frame drag |
| LMB on unselected frame | Frame not selected | Select frame (existing) |

### builder-workspace changes

Wire new CanvasEngine props:

- **`frames`:** Built from `portfolio.sections`, mapping each section's `frameX`, `frameY`, `frameWidth`, `frameHeight` (with existing fallback defaults).
- **`selectedFrameId`:** `selectedSectionId` when `selectedBlockIds.size === 0`, otherwise `null`.
- **`onFrameMove`:** Calls `portfolioStore.updateSection(id, { styles: { ...existingStyles, frameX: newX, frameY: newY } })`.
- **`onFrameDragEnd`:** Triggers auto-save (same pattern used by block drag end).

### What doesn't change

- `CanvasFrame` component — no modifications.
- Block dragging — separate interaction path, unaffected.
- Marquee selection — triggers on empty canvas only.
- Canvas panning — triggers on middle mouse / space+drag.

## Edge Cases

- **Click inside frame on empty space:** Selects the frame (existing behavior). A subsequent pointerdown + drag moves it.
- **Drag near canvas edge:** No auto-scroll. User pans separately.
- **Frame overlapping another frame:** No collision detection. Frames can overlap freely.

## Non-Goals

- Multi-frame drag (select and move multiple frames)
- Frame resize via drag handles
- Grid snapping for frames
- Auto-layout / auto-arrange frames

## Files to modify

1. `src/components/builder/canvas-engine.tsx` — Frame drag state, hit-testing, pointer handlers
2. `src/components/builder/builder-workspace.tsx` — Wire `frames`, `selectedFrameId`, `onFrameMove`, `onFrameDragEnd` props
