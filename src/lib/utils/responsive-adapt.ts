import type { BlockWithStyles, BlockStyles } from "@/types";

// ─── Return types ────────────────────────────────────────────────

export interface BlockOverrides {
  blockId: string;
  tabletStyles: Partial<BlockStyles>;
  mobileStyles: Partial<BlockStyles>;
}

export interface FrameSizeRecommendation {
  width: number;
  height: number;
}

export interface AdaptResult {
  overrides: BlockOverrides[];
  tabletFrame: FrameSizeRecommendation;
  mobileFrame: FrameSizeRecommendation;
}

// ─── Constants ───────────────────────────────────────────────────

const TABLET_WIDTH = 768;
const MOBILE_WIDTH = 375;
const MOBILE_PADDING = 16;
const MOBILE_CONTENT_WIDTH = MOBILE_WIDTH - MOBILE_PADDING * 2; // 343
const MOBILE_GAP = 16;
const TABLET_FONT_SCALE = 0.85;
const MOBILE_FONT_SCALE = 0.75;

// ─── Internal helpers ────────────────────────────────────────────

interface PositionedBlock {
  block: BlockWithStyles;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Check if two vertical ranges overlap by more than 50% of the smaller range.
 */
function yRangesOverlap(
  y1: number,
  h1: number,
  y2: number,
  h2: number,
): boolean {
  const top = Math.max(y1, y2);
  const bottom = Math.min(y1 + h1, y2 + h2);
  const overlap = Math.max(0, bottom - top);
  const smallerHeight = Math.min(h1, h2);
  if (smallerHeight <= 0) return false;
  return overlap / smallerHeight > 0.5;
}

/**
 * Check whether a block already has manual responsive overrides set.
 * Empty objects ({}) are treated as "not set".
 */
function hasManualOverrides(block: BlockWithStyles): boolean {
  const hasTablet =
    block.tabletStyles && Object.keys(block.tabletStyles).length > 0;
  const hasMobile =
    block.mobileStyles && Object.keys(block.mobileStyles).length > 0;
  return !!(hasTablet || hasMobile);
}

// ─── Main function ───────────────────────────────────────────────

/**
 * Generate tablet (768px) and mobile (375px) style overrides for desktop
 * block layouts. Pure function — no side effects.
 *
 * Algorithm:
 * 1. Filter to eligible blocks (top-level, visible, unlocked, no manual overrides)
 * 2. Detect visual rows by Y-range overlap
 * 3. Tablet: scale proportionally from desktop width
 * 4. Mobile: stack all blocks vertically, full-width
 */
export function generateResponsiveLayouts(
  blocks: BlockWithStyles[],
  frameWidth: number,
  frameHeight: number,
): AdaptResult {
  // 1. Filter eligible blocks
  const eligible = blocks.filter(
    (b) =>
      !b.parentId &&
      b.isVisible &&
      !b.isLocked &&
      !hasManualOverrides(b),
  );

  if (eligible.length === 0) {
    return {
      overrides: [],
      tabletFrame: { width: TABLET_WIDTH, height: frameHeight },
      mobileFrame: { width: MOBILE_WIDTH, height: frameHeight },
    };
  }

  // Extract positioned blocks with defaults
  const positioned: PositionedBlock[] = eligible.map((block) => ({
    block,
    x: block.styles.x ?? 0,
    y: block.styles.y ?? 0,
    w: block.styles.w ?? 100,
    h: block.styles.h ?? 40,
  }));

  // 2. Row Detection — sort by Y, then group into visual rows
  const sortedByY = [...positioned].sort((a, b) => a.y - b.y);

  const rows: PositionedBlock[][] = [];
  for (const pb of sortedByY) {
    let placed = false;
    for (const row of rows) {
      // Check overlap with the first block in the row (representative)
      const rep = row[0]!;
      if (yRangesOverlap(rep.y, rep.h, pb.y, pb.h)) {
        row.push(pb);
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([pb]);
    }
  }

  // Sort each row left-to-right by X
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
  }

  // Sort rows top-to-bottom by the minimum Y in each row
  rows.sort((a, b) => {
    const minYA = Math.min(...a.map((pb) => pb.y));
    const minYB = Math.min(...b.map((pb) => pb.y));
    return minYA - minYB;
  });

  // 3. Tablet layout — proportional scale
  const tabletScale = TABLET_WIDTH / frameWidth;
  const overrides: BlockOverrides[] = [];
  let tabletMaxBottom = 0;

  // Track tablet row positions: scale Y proportionally
  for (const row of rows) {
    for (const pb of row) {
      const tabletX = Math.round(pb.x * tabletScale);
      const tabletW = Math.round(pb.w * tabletScale);
      const tabletY = Math.round(pb.y * tabletScale);
      const tabletH = Math.round(pb.h * tabletScale);

      const tabletStyles: Partial<BlockStyles> = {
        x: tabletX,
        y: tabletY,
        w: tabletW,
        h: tabletH,
      };

      if (pb.block.styles.fontSize) {
        tabletStyles.fontSize = Math.round(
          pb.block.styles.fontSize * TABLET_FONT_SCALE,
        );
      }

      const bottom = tabletY + tabletH;
      if (bottom > tabletMaxBottom) {
        tabletMaxBottom = bottom;
      }

      // Find or create the override entry for this block
      let entry = overrides.find((o) => o.blockId === pb.block.id);
      if (!entry) {
        entry = {
          blockId: pb.block.id,
          tabletStyles: {},
          mobileStyles: {},
        };
        overrides.push(entry);
      }
      entry.tabletStyles = tabletStyles;
    }
  }

  // 4. Mobile layout — stack vertically, full-width
  let mobileCursorY = MOBILE_PADDING;

  for (const row of rows) {
    // Blocks that were side-by-side now stack in left-to-right order
    for (const pb of row) {
      const mobileStyles: Partial<BlockStyles> = {
        x: MOBILE_PADDING,
        y: mobileCursorY,
        w: MOBILE_CONTENT_WIDTH,
      };

      if (pb.block.styles.fontSize) {
        mobileStyles.fontSize = Math.round(
          pb.block.styles.fontSize * MOBILE_FONT_SCALE,
        );
      }

      // Keep original height for mobile (content may need it)
      const blockHeight = pb.h;
      mobileCursorY += blockHeight + MOBILE_GAP;

      let entry = overrides.find((o) => o.blockId === pb.block.id);
      if (!entry) {
        entry = {
          blockId: pb.block.id,
          tabletStyles: {},
          mobileStyles: {},
        };
        overrides.push(entry);
      }
      entry.mobileStyles = mobileStyles;
    }
  }

  const mobileFrameHeight = mobileCursorY + MOBILE_PADDING; // bottom padding

  return {
    overrides,
    tabletFrame: {
      width: TABLET_WIDTH,
      height: Math.max(Math.round(tabletMaxBottom + 40), 200), // 40px bottom padding
    },
    mobileFrame: {
      width: MOBILE_WIDTH,
      height: Math.max(Math.round(mobileFrameHeight), 200),
    },
  };
}
