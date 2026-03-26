# Magnetic Cursor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blocks with `magneticHover` enabled subtly pull toward the cursor when nearby, on published portfolios and preview mode (desktop only).

**Architecture:** A new `MagneticWrapper` component uses Framer Motion's `useMotionValue` + `useSpring` to smoothly translate elements toward the cursor. It's integrated into `MotionBlockWrapper` as a layer between the GSAP scroll animation div and the Framer Motion hover div, composable with all existing effects.

**Tech Stack:** React, Framer Motion (useMotionValue, useSpring, motion.div), BlockStyles type

---

### Task 1: Add magnetic fields to BlockStyles

**Files:**
- Modify: `src/types/index.ts:197-205`

- [ ] **Step 1: Add the three new fields**

In `src/types/index.ts`, add three fields to `BlockStyles` after `hoverEffect` (line 197) and before `hideOnMobile` (line 198):

```typescript
  hoverEffect?: "none"|"lift"|"tilt-3d"|"glow"|"grow"|"shake";
  magneticHover?: boolean;
  magneticStrength?: number;
  magneticRadius?: number;
  hideOnMobile?: boolean;
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add magneticHover, magneticStrength, magneticRadius to BlockStyles"
```

---

### Task 2: Create MagneticWrapper component

**Files:**
- Create: `src/components/portfolio/magnetic-wrapper.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/portfolio/magnetic-wrapper.tsx`:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

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
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouch(true);
      return;
    }

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
  }, [strength, radius, x, y]);

  // Touch device — render without magnetic effect
  if (isTouch) {
    return <>{children}</>;
  }

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY }}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/portfolio/magnetic-wrapper.tsx
git commit -m "feat: create MagneticWrapper component with spring physics"
```

---

### Task 3: Integrate MagneticWrapper into MotionBlockWrapper

**Files:**
- Modify: `src/components/portfolio/motion-block-wrapper.tsx`

- [ ] **Step 1: Add import**

At the top of `src/components/portfolio/motion-block-wrapper.tsx`, add the import after the existing imports (after line 6):

```typescript
import { MagneticWrapper } from "./magnetic-wrapper";
```

- [ ] **Step 2: Extract magnetic config and add to early-exit check**

In the `MotionBlockWrapper` function body, after `const hasParallax = ...` (line 122), add:

```typescript
  const hasMagnetic = styles.magneticHover === true;
```

Update the early-exit "no effects" check (line 198) from:

```typescript
  if (!hasAnimation && !hasHover && !hasParallax) {
```

to:

```typescript
  if (!hasAnimation && !hasHover && !hasParallax && !hasMagnetic) {
```

- [ ] **Step 3: Wrap content with MagneticWrapper**

Replace the hover wrapper block (lines 207-217) to layer magnetic around hover:

```typescript
  // ── Build hover wrapper (Framer Motion) ────────────
  let content: React.ReactNode = children;

  if (hasHover) {
    content = (
      <motion.div
        style={{ perspective: hoverEffect === "tilt-3d" ? 800 : undefined }}
        whileHover={getHoverProps(hoverEffect)}
        transition={{ duration: 0.25 }}
      >
        {content}
      </motion.div>
    );
  }

  if (hasMagnetic) {
    content = (
      <MagneticWrapper
        strength={styles.magneticStrength}
        radius={styles.magneticRadius}
      >
        {content}
      </MagneticWrapper>
    );
  }
```

- [ ] **Step 4: Add magnetic-only render path**

After the "Hover only" return (line 242-252), the current code ends. But now we need to handle the case where only magnetic is enabled (no animation, no hover, no parallax but hasMagnetic). The existing early-exit check already skips this case, so it falls through. However, none of the existing render paths handle magnetic-only.

Add a new return before the final hover-only return. Replace the entire bottom section (from line 242 to end of function) with:

```typescript
  // ── Hover only (no scroll animation) ────────────────
  if (hasHover && !hasMagnetic) {
    return (
      <motion.div
        className={className}
        style={{ ...style, perspective: hoverEffect === "tilt-3d" ? 800 : undefined }}
        whileHover={getHoverProps(hoverEffect)}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    );
  }

  // ── Magnetic (with or without hover, no scroll animation) ──
  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
```

Wait — the `content` variable already has hover and magnetic wrapped in Steps 3. But the hover-only path (line 242-252) currently renders a `motion.div` with `whileHover` directly wrapping `children`, which duplicates the hover logic.

Let me simplify. The refactored bottom section should be:

```typescript
  // ── No scroll animation — magnetic and/or hover only ──
  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
```

This works because `content` already has the magnetic wrapper and hover wrapper applied from Step 3. The `motion.div` with `whileHover` is inside `content` if hover is active.

- [ ] **Step 5: Commit**

```bash
git add src/components/portfolio/motion-block-wrapper.tsx
git commit -m "feat: integrate MagneticWrapper into MotionBlockWrapper"
```

---

### Task 4: Add magnetic cursor UI controls to effects panel

**Files:**
- Modify: `src/components/builder/block-properties-panel.tsx:797-798`

- [ ] **Step 1: Add UI controls after hover effect dropdown**

In `src/components/builder/block-properties-panel.tsx`, after the hover effect `</div>` (line 797) and before the closing `</PropGrid>` (line 798), add:

```tsx
            {/* Magnetic Cursor */}
            <div>
              <SubLabel hint="Element subtly pulls toward the cursor when nearby (desktop only)">Magnetic Cursor</SubLabel>
              <label className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[11px] transition-colors" style={{ color: "var(--b-text-2)", backgroundColor: styles.magneticHover ? "var(--b-accent-soft)" : "transparent" }}>
                <input
                  type="checkbox"
                  checked={styles.magneticHover ?? false}
                  onChange={(e) => updateStyle("magneticHover", e.target.checked)}
                  className="rounded"
                />
                Enable magnetic pull
              </label>
            </div>
            {styles.magneticHover && (
              <>
                <div>
                  <SubLabel hint="How strongly the element pulls toward cursor (0.1 = subtle, 0.5 = strong)">Strength</SubLabel>
                  <NumInput value={styles.magneticStrength} onChange={(v) => updateStyle("magneticStrength", v)} placeholder="0.2" />
                </div>
                <div>
                  <SubLabel hint="Detection radius in pixels around the element">Radius (px)</SubLabel>
                  <NumInput value={styles.magneticRadius} onChange={(v) => updateStyle("magneticRadius", v)} placeholder="100" />
                </div>
              </>
            )}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/builder/block-properties-panel.tsx
git commit -m "feat: add magnetic cursor controls to effects panel"
```

---

### Task 5: Verification

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Start dev server and test in builder**

```bash
npm run dev
```

1. Open the builder studio, select a block.
2. In the Effects panel, find "Magnetic Cursor" below the hover dropdown.
3. Toggle it on — Strength and Radius inputs should appear.
4. Set Strength to 0.3, Radius to 150.
5. Open preview mode — hover near the block. It should pull toward cursor.
6. Verify it works combined with a hover effect (e.g., Glow + Magnetic).

- [ ] **Step 3: Test edge cases**

1. **Touch device:** Open in mobile DevTools emulation — magnetic effect should not apply.
2. **Builder canvas:** Blocks should NOT have magnetic effect while editing — only in preview/published.
3. **Multiple magnetic blocks:** Enable on 2+ blocks — each should track independently.
4. **Scroll animations + magnetic:** Enable both entrance animation and magnetic on same block — both should work.

- [ ] **Step 4: Commit any fixes**

```bash
git add -u
git commit -m "fix: magnetic cursor verification fixes"
```
