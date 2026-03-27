// ─── Background Patterns ─────────────────────────────────────────
// CSS/SVG-based repeating patterns for section frames.

/** Convert 0-1 opacity to a 2-char hex pair (e.g. 0.1 → "1a") */
export function hexOpacity(opacity: number): string {
  return Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
}

export interface PatternDef {
  id: string;
  name: string;
  category: "repeating" | "gradient" | "overlay";
  generate: (color: string, opacity: number, scale: number) => {
    backgroundImage: string;
    backgroundSize?: string;
    backgroundPosition?: string;
  };
}

function svgDataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export const BACKGROUND_PATTERNS: PatternDef[] = [
  // ─── None ──────────────────────────────────────────────
  {
    id: "none",
    name: "None",
    category: "repeating",
    generate: () => ({ backgroundImage: "none" }),
  },

  // ─── Dots ──────────────────────────────────────────────
  {
    id: "dots",
    name: "Dots",
    category: "repeating",
    generate: (color, opacity, scale) => {
      const c = `${color}${hexOpacity(opacity)}`;
      const size = Math.round(20 * scale);
      return {
        backgroundImage: `radial-gradient(circle, ${c} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      };
    },
  },

  // ─── Grid ──────────────────────────────────────────────
  {
    id: "grid",
    name: "Grid",
    category: "repeating",
    generate: (color, opacity, scale) => {
      const c = `${color}${hexOpacity(opacity)}`;
      const size = Math.round(40 * scale);
      return {
        backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      };
    },
  },

  // ─── Diagonal Lines ────────────────────────────────────
  {
    id: "diagonal-lines",
    name: "Diagonal Lines",
    category: "repeating",
    generate: (color, opacity, scale) => {
      const c = `${color}${hexOpacity(opacity)}`;
      const size = Math.round(16 * scale);
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${c} 0, ${c} 1px, transparent 0, transparent 50%)`,
        backgroundSize: `${size}px ${size}px`,
      };
    },
  },

  // ─── Crosshatch ────────────────────────────────────────
  {
    id: "crosshatch",
    name: "Crosshatch",
    category: "repeating",
    generate: (color, opacity, scale) => {
      const c = `${color}${hexOpacity(opacity)}`;
      const size = Math.round(16 * scale);
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${c} 0, ${c} 1px, transparent 0, transparent 50%), repeating-linear-gradient(-45deg, ${c} 0, ${c} 1px, transparent 0, transparent 50%)`,
        backgroundSize: `${size}px ${size}px`,
      };
    },
  },

  // ─── Checkerboard ──────────────────────────────────────
  {
    id: "checkerboard",
    name: "Checkerboard",
    category: "repeating",
    generate: (color, opacity, scale) => {
      const c = `${color}${hexOpacity(opacity)}`;
      const half = Math.round(20 * scale);
      const full = half * 2;
      return {
        backgroundImage: `linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%, ${c}), linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%, ${c})`,
        backgroundSize: `${full}px ${full}px`,
        backgroundPosition: `0 0, ${half}px ${half}px`,
      };
    },
  },

  // ─── Hexagons (SVG) ────────────────────────────────────
  {
    id: "hexagons",
    name: "Hexagons",
    category: "repeating",
    generate: (color, opacity, scale) => {
      const c = `${color}${hexOpacity(opacity)}`;
      const size = Math.round(28 * scale);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size * 2}' height='${Math.round(size * 1.73)}' viewBox='0 0 28 16.17'><polygon fill='none' stroke='${c}' stroke-width='0.5' points='14 0.5 27.5 8.08 14 15.67 0.5 8.08'/></svg>`;
      return {
        backgroundImage: svgDataUri(svg),
        backgroundSize: `${size * 2}px ${Math.round(size * 1.73)}px`,
      };
    },
  },

  // ─── Plus Signs (SVG) ──────────────────────────────────
  {
    id: "plus-signs",
    name: "Plus Signs",
    category: "repeating",
    generate: (color, opacity, scale) => {
      const c = `${color}${hexOpacity(opacity)}`;
      const size = Math.round(24 * scale);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24'><path d='M11 4h2v16h-2zM4 11h16v2H4z' fill='${c}'/></svg>`;
      return {
        backgroundImage: svgDataUri(svg),
        backgroundSize: `${size}px ${size}px`,
      };
    },
  },

  // ─── Radial Glow ───────────────────────────────────────
  {
    id: "radial-glow",
    name: "Radial Glow",
    category: "gradient",
    generate: (color, opacity) => {
      const c = `${color}${hexOpacity(opacity)}`;
      return {
        backgroundImage: `radial-gradient(ellipse at 50% 50%, ${c} 0%, transparent 70%)`,
      };
    },
  },

  // ─── Corner Glow ───────────────────────────────────────
  {
    id: "corner-glow",
    name: "Corner Glow",
    category: "gradient",
    generate: (color, opacity) => {
      const c = `${color}${hexOpacity(opacity)}`;
      return {
        backgroundImage: `radial-gradient(ellipse at 0% 0%, ${c} 0%, transparent 60%)`,
      };
    },
  },

  // ─── Gradient Mesh ─────────────────────────────────────
  {
    id: "gradient-mesh",
    name: "Gradient Mesh",
    category: "gradient",
    generate: (color, opacity) => {
      const c = `${color}${hexOpacity(opacity)}`;
      const c2 = `${color}${hexOpacity(opacity * 0.5)}`;
      return {
        backgroundImage: `radial-gradient(at 20% 80%, ${c} 0%, transparent 50%), radial-gradient(at 80% 20%, ${c2} 0%, transparent 50%), radial-gradient(at 50% 50%, ${c2} 0%, transparent 70%)`,
      };
    },
  },

  // ─── Noise / Grain ─────────────────────────────────────
  {
    id: "noise",
    name: "Noise / Grain",
    category: "overlay",
    generate: (_color, opacity) => {
      // Tiny SVG fractal noise filter
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='${opacity}'/></svg>`;
      return {
        backgroundImage: svgDataUri(svg),
        backgroundSize: "200px 200px",
      };
    },
  },
];

/** Look up a pattern by its id */
export function getPatternById(id: string): PatternDef | undefined {
  return BACKGROUND_PATTERNS.find((p) => p.id === id);
}

/** Generate CSS styles for a pattern config */
export function generatePatternStyles(
  patternId: string,
  color: string,
  opacity: number,
  scale: number,
): React.CSSProperties {
  const pattern = getPatternById(patternId);
  if (!pattern || patternId === "none") return {};
  const result = pattern.generate(color, opacity, scale);
  const css: React.CSSProperties = {};
  if (result.backgroundImage) css.backgroundImage = result.backgroundImage;
  if (result.backgroundSize) css.backgroundSize = result.backgroundSize;
  if (result.backgroundPosition) css.backgroundPosition = result.backgroundPosition;
  return css;
}
