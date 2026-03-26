# Magnetic Cursor — Design Spec

**Date:** 2026-03-26
**Status:** Approved

## Summary

Blocks with `magneticHover` enabled subtly pull toward the cursor when nearby. Works on published portfolios and preview mode. Desktop only — disabled on touch devices.

## Data Model

Three new optional fields on `BlockStyles` (`src/types/index.ts`):

```typescript
magneticHover?: boolean;    // enables the effect (default false)
magneticStrength?: number;  // pull intensity, range 0.1–0.5 (default 0.2)
magneticRadius?: number;    // detection radius in px, range 50–300 (default 100)
```

## Architecture

### MagneticWrapper component

New file: `src/components/portfolio/magnetic-wrapper.tsx`

A wrapper component that applies magnetic pull to its children:

1. Uses `useRef` to get the element's bounding rect.
2. Listens to `mousemove` on `window`, throttled via `requestAnimationFrame`.
3. Computes distance from cursor to element center.
4. If cursor is within `magneticRadius`, calculates a proportional `translate(dx, dy)` offset:
   - `dx = (cursorX - centerX) * magneticStrength`
   - `dy = (cursorY - centerY) * magneticStrength`
5. Applies offset using Framer Motion's `useMotionValue` + `useSpring` for smooth interpolation.
6. When cursor exits the radius, springs back to `(0, 0)`.
7. Skips entirely on touch devices — detected via `window.matchMedia('(pointer: coarse)')`.

Props:
```typescript
interface MagneticWrapperProps {
  children: React.ReactNode;
  strength?: number;  // default 0.2
  radius?: number;    // default 100
}
```

### Integration into MotionBlockWrapper

File: `src/components/portfolio/motion-block-wrapper.tsx`

When `styles.magneticHover` is true, wrap the block content in `<MagneticWrapper>` passing `strength` and `radius`. This layer is independent of and composable with existing hover effects (glow, lift, tilt-3d, grow, shake). The magnetic wrapper wraps the hover wrapper, so both effects apply simultaneously.

Layering order (outer to inner):
1. GSAP entrance/scroll animation div (existing)
2. MagneticWrapper (new, conditional)
3. Framer Motion whileHover div (existing, conditional)
4. Block content

### Effects Panel UI

File: `src/components/builder/block-properties-panel.tsx`

Add below the existing hover effect dropdown in the "Effects" section:

- **Magnetic Cursor** — toggle (switch/checkbox)
- When enabled, show two sliders:
  - **Strength** — range 0.1–0.5, step 0.05, default 0.2
  - **Radius** — range 50–300, step 10, default 100, unit label "px"

## Scope

### What changes
1. `src/types/index.ts` — Add 3 fields to BlockStyles
2. `src/components/portfolio/magnetic-wrapper.tsx` — New component
3. `src/components/portfolio/motion-block-wrapper.tsx` — Wrap content in MagneticWrapper when enabled
4. `src/components/builder/block-properties-panel.tsx` — Add UI controls

### What doesn't change
- Existing hover effects (lift, tilt-3d, glow, grow, shake)
- Builder canvas interactions (drag, select, resize)
- GSAP entrance/scroll animations
- Mobile/tablet rendering — effect is desktop-only

## Non-Goals
- Magnetic effect in the builder canvas (conflicts with drag/select)
- Per-axis strength control
- Magnetic effect on frames/sections (blocks only)
- Custom easing configuration for the spring return
