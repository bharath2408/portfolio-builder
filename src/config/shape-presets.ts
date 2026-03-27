// ─── Shape Presets — SVG decorative elements ────────────────────
// Pre-built SVG shapes that users can insert as blocks on the canvas.
// All SVGs use `currentColor` for fill to support color theming.

export interface ShapePreset {
  id: string;
  name: string;
  category: "dividers" | "blobs" | "geometric";
  svg: string;
  defaultWidth: number;
  defaultHeight: number;
}

export const SHAPE_PRESETS: ShapePreset[] = [
  // ═══ Dividers ═══════════════════════════════════════════════════

  {
    id: "wave",
    name: "Wave",
    category: "dividers",
    svg: `<svg viewBox='0 0 1440 120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><path d='M0 60 C360 0 720 120 1080 60 S1440 0 1440 0 V120 H0Z' fill='currentColor'/></svg>`,
    defaultWidth: 1440,
    defaultHeight: 120,
  },
  {
    id: "tilt",
    name: "Tilt",
    category: "dividers",
    svg: `<svg viewBox='0 0 1440 120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><polygon points='0,120 1440,0 1440,120' fill='currentColor'/></svg>`,
    defaultWidth: 1440,
    defaultHeight: 120,
  },
  {
    id: "curve",
    name: "Curve",
    category: "dividers",
    svg: `<svg viewBox='0 0 1440 120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><path d='M0 120 Q720 -40 1440 120 Z' fill='currentColor'/></svg>`,
    defaultWidth: 1440,
    defaultHeight: 120,
  },
  {
    id: "zigzag",
    name: "Zigzag",
    category: "dividers",
    svg: `<svg viewBox='0 0 1440 80' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><polyline fill='currentColor' points='0,80 120,20 240,80 360,20 480,80 600,20 720,80 840,20 960,80 1080,20 1200,80 1320,20 1440,80 1440,80 0,80'/></svg>`,
    defaultWidth: 1440,
    defaultHeight: 80,
  },

  // ═══ Blobs ══════════════════════════════════════════════════════

  {
    id: "blob-1",
    name: "Blob 1",
    category: "blobs",
    svg: `<svg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'><path d='M440 250c0 70-30 140-90 180s-130 50-200 30S30 400 10 330 10 180 50 120 130 30 200 20s120 10 170 50 70 100 70 180z' fill='currentColor'/></svg>`,
    defaultWidth: 500,
    defaultHeight: 500,
  },
  {
    id: "blob-2",
    name: "Blob 2",
    category: "blobs",
    svg: `<svg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'><path d='M420 300c-20 80-80 140-160 160s-160-10-210-70S0 260 20 180 90 40 180 20s170 10 200 70 60 130 40 210z' fill='currentColor'/></svg>`,
    defaultWidth: 500,
    defaultHeight: 500,
  },
  {
    id: "circle-glow",
    name: "Circle Glow",
    category: "blobs",
    svg: `<svg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'><defs><radialGradient id='cg'><stop offset='0%' stop-color='currentColor' stop-opacity='0.6'/><stop offset='100%' stop-color='currentColor' stop-opacity='0'/></radialGradient></defs><circle cx='250' cy='250' r='220' fill='url(#cg)'/></svg>`,
    defaultWidth: 500,
    defaultHeight: 500,
  },

  // ═══ Geometric ═════════════════════════════════════════════════

  {
    id: "dots-grid",
    name: "Dots Grid",
    category: "geometric",
    svg: `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'>${Array.from({ length: 100 }, (_, i) => {
      const x = (i % 10) * 20 + 10;
      const y = Math.floor(i / 10) * 20 + 10;
      return `<circle cx='${x}' cy='${y}' r='2' fill='currentColor' opacity='0.5'/>`;
    }).join("")}</svg>`,
    defaultWidth: 200,
    defaultHeight: 200,
  },
  {
    id: "concentric-circles",
    name: "Concentric Circles",
    category: "geometric",
    svg: `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><circle cx='100' cy='100' r='90' fill='none' stroke='currentColor' stroke-width='1' opacity='0.3'/><circle cx='100' cy='100' r='70' fill='none' stroke='currentColor' stroke-width='1' opacity='0.3'/><circle cx='100' cy='100' r='50' fill='none' stroke='currentColor' stroke-width='1' opacity='0.4'/><circle cx='100' cy='100' r='30' fill='none' stroke='currentColor' stroke-width='1' opacity='0.5'/><circle cx='100' cy='100' r='10' fill='currentColor' opacity='0.5'/></svg>`,
    defaultWidth: 200,
    defaultHeight: 200,
  },
  {
    id: "corner-accent",
    name: "Corner Accent",
    category: "geometric",
    svg: `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><path d='M0 0 L80 0 L0 80 Z' fill='currentColor' opacity='0.4'/><path d='M0 0 L40 0 L0 40 Z' fill='currentColor' opacity='0.6'/></svg>`,
    defaultWidth: 200,
    defaultHeight: 200,
  },
];

export const SHAPE_CATEGORIES = [
  { id: "dividers" as const, label: "Dividers" },
  { id: "blobs" as const, label: "Blobs" },
  { id: "geometric" as const, label: "Geometric" },
] as const;

export function getShapeById(id: string): ShapePreset | undefined {
  return SHAPE_PRESETS.find((s) => s.id === id);
}

export function getShapesByCategory(category: string): ShapePreset[] {
  return SHAPE_PRESETS.filter((s) => s.category === category);
}
