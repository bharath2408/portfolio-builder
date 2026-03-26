# Visual Features — Implementation Specs

**Date:** 2026-03-27
**Status:** Ready to implement (in recommended order)

---

## Feature 1: Background Patterns (Recommended first)

**Complexity:** Low | **Time:** ~2h | **Schema changes:** SectionStyles only

### Summary
One-click background patterns for section frames — dots, grids, lines, hexagons, gradients, noise. Applied via CSS/SVG patterns with color, opacity, and scale controls.

### Data Model

Add to `SectionStyles` in `src/types/index.ts`:

```typescript
pattern?: {
  id: string;          // "dots", "grid", "hexagons", etc.
  color: string;       // "primary" | "#hex"
  opacity: number;     // 0-1 (default 0.1)
  scale: number;       // 0.5-3 (default 1)
};
```

### Pattern Library (16 patterns)

**Repeating patterns (CSS):**
- Dots, Horizontal Lines, Vertical Lines, Diagonal Lines, Grid, Crosshatch, Checkerboard, Diamonds

**Repeating patterns (SVG data URI):**
- Waves, Hexagons, Triangles, Plus Signs

**Gradient backgrounds:**
- Radial Glow, Corner Glow, Dual Glow, Gradient Mesh

**Overlays:**
- Noise / Grain

### Implementation Notes
- Utility function: `hexOpacity(opacity: number) => string` — avoids repeated `Math.round(opacity * 255).toString(16)` everywhere
- Pattern preview thumbnails in the panel (render small SVG preview per pattern)
- Pattern color resolves theme tokens (primary, secondary, accent) via existing `resolveColor`

### Files to Create/Modify
| Action | File |
|--------|------|
| Create | `src/config/background-patterns.ts` — pattern definitions |
| Modify | `src/types/index.ts` — add `pattern` to SectionStyles |
| Modify | `src/components/builder/block-properties-panel.tsx` or section properties — add pattern picker UI |
| Modify | `src/components/portfolio/portfolio-renderer.tsx` — apply pattern to section background |
| Modify | `src/components/builder/canvas-element.tsx` — show pattern in builder canvas frames |

---

## Feature 2: Shape Presets (Recommended second)

**Complexity:** Low | **Time:** ~2h | **Schema changes:** None (uses existing block system)

### Summary
Pre-built SVG decorative elements — wave dividers, blob backgrounds, geometric decorations. Users click to insert as blocks on the canvas.

### Shape Categories (24 shapes total)
- **Dividers (8):** Smooth Wave, Rough Wave, Diagonal Tilt, Soft Curve, Triangle Point, Zigzag, Layered Waves, Arrow Down
- **Blobs (5):** Organic Blob x3, Circle Gradient, Dual Blob
- **Geometric (6):** Dots Grid, Diagonal Lines, Concentric Circles, Corner Accent, Hexagon Grid, Plus Pattern
- **Abstract (3):** Grain Texture, Aurora Glow, Particle Field

### Data Structure
```typescript
{
  id: "wave-smooth",
  name: "Smooth Wave",
  category: "dividers",
  svg: "<svg viewBox='0 0 1440 120'>...</svg>",
  defaultWidth: 1440,
  defaultHeight: 120,
}
```

### Implementation Notes
- SVGs use `currentColor` for fill — color theming works via CSS `color` property
- SVG pattern IDs (`#dots`, `#hex`) must be prefixed with block ID to avoid conflicts when multiple shapes on same page
- All SVGs use `viewBox` for scalability, no fixed width/height
- Each SVG < 2KB
- Dividers: full-width `viewBox="0 0 1440 X"`
- Blobs: centered `viewBox="0 0 500 500"`
- Decorations: modular `viewBox="0 0 200 200"`

### When inserted
Creates block with existing `rectangle` or new `shape` block type:
```typescript
{
  type: "shape", // or extend rectangle
  content: { svgId: "wave-smooth", color: "primary" },
  styles: { x: 0, y: frameHeight - 120, w: 1440, h: 120 },
}
```

### User controls
- Move/resize on canvas
- Color picker (theme tokens + custom hex)
- Flip horizontal/vertical
- Opacity

### Files to Create/Modify
| Action | File |
|--------|------|
| Create | `src/config/shape-presets.ts` — SVG shape data |
| Create | `src/components/builder/shape-panel.tsx` — shapes panel UI |
| Modify | `src/types/index.ts` — add SHAPE to BLOCK_TYPES (if new type) |
| Modify | `src/config/block-registry.ts` — register shape block type |
| Modify | `src/components/builder/block-renderer.tsx` — render shape SVG |
| Modify | `src/components/builder/builder-workspace.tsx` — add Shapes tab to left panel |

---

## Feature 3: Icon Picker (Recommended third)

**Complexity:** Low-Medium | **Time:** ~2h | **Schema changes:** None

### Summary
Searchable modal with all Lucide icons (1400+). User searches/browses, clicks to insert as an icon block on the canvas.

### UI Layout
```
┌─────────────────────────────────────┐
│ Search icons...                      │
├─────────────────────────────────────┤
│ [All] [Popular] [Dev] [Social] ...   │
├─────────────────────────────────────┤
│ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻             │
│ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻             │
│        (virtualized grid)            │
├─────────────────────────────────────┤
│ Selected: Github          [Insert]   │
└─────────────────────────────────────┘
```

### Categories (curated subsets)
- **Popular (18):** Github, Linkedin, Twitter, Mail, Phone, MapPin, Globe, ArrowRight, Star, Heart, Code, Terminal, Briefcase, GraduationCap, Award, Zap, Sparkles, Rocket
- **Arrows (13):** ArrowRight, ArrowLeft, ChevronRight, ExternalLink, etc.
- **Development (16):** Code, Terminal, GitBranch, Database, Server, Cloud, etc.
- **Social (11):** Github, Linkedin, Twitter, Facebook, Instagram, etc.
- **Communication (9):** Mail, Phone, MessageCircle, Send, Bell, etc.
- **Media (12):** Image, Camera, Video, Music, Play, Monitor, etc.
- **Files (9):** File, FileText, Folder, Download, Upload, etc.
- **General (18):** Home, Search, Settings, User, Heart, Star, Rocket, etc.

### Implementation Notes
- **Performance:** Don't import all of `lucide-react` at once (~200KB). Use dynamic import or render icons by name from a pre-built map.
- **Virtualization:** Use `react-window` or CSS `overflow-y: auto` with `content-visibility: auto` for smooth scrolling of 1400+ icons.
- **Search:** Filter by icon name (case-insensitive substring match).
- **Recent icons:** Last 10 used, stored in `localStorage`.
- **Size selector:** 16, 20, 24, 32, 40, 48px.

### When inserted
```typescript
{
  type: "icon", // already exists in block registry
  content: { name: "Github", size: 24, color: "primary" },
  styles: { x: ..., y: ..., w: 48, h: 48 },
}
```

### Files to Create/Modify
| Action | File |
|--------|------|
| Create | `src/components/builder/icon-picker.tsx` — modal component |
| Create | `src/config/icon-categories.ts` — category mappings |
| Modify | `src/components/builder/block-properties-panel.tsx` — add icon picker trigger for icon blocks |
| Modify | `src/components/builder/block-renderer.tsx` — improve icon block rendering |

---

## Feature 4: SVG Import (Recommended last)

**Complexity:** Medium | **Time:** ~3h | **Schema changes:** New block type

### Summary
Upload custom SVG files or paste SVG code. Sanitized and placed on the canvas as a new block.

### Upload Flow
1. User clicks "Import SVG" in toolbar or Assets panel
2. Option A: File picker (.svg only, max 100KB)
3. Option B: Paste SVG code in textarea
4. SVG is sanitized (security critical)
5. Block created on canvas

### SVG Sanitization (Security Critical)

```typescript
function sanitizeSvg(rawSvg: string): string {
  // 1. Parse with DOMParser
  // 2. Remove: <script>, <foreignObject>, <iframe>, <embed>, <object>
  // 3. Remove: <style> tags (can contain @import)
  // 4. Remove: all on* event attributes (onclick, onload, etc.)
  // 5. Remove: href/xlink:href with javascript: or external URLs
  // 6. Remove: <use> pointing to external files
  // 7. Strip: data: URIs that aren't image/png or image/jpeg
  // 8. Whitelist tags: svg, g, path, rect, circle, ellipse, line,
  //    polyline, polygon, text, tspan, defs, clipPath,
  //    linearGradient, radialGradient, stop, pattern, mask,
  //    filter, feGaussianBlur, feOffset, feMerge, feMergeNode
  // 9. Return cleaned SVG string
}
```

### When imported
```typescript
{
  type: "custom_svg",
  content: {
    svg: "<svg>...sanitized...</svg>",
    originalFilename: "logo.svg",
    viewBox: "0 0 200 200",
  },
  styles: {
    x: center_of_viewport,
    y: center_of_viewport,
    w: extracted_width || 200,
    h: extracted_height || 200,
    color: "primary",
  },
}
```

### User controls
- Move/resize (proportional by default, shift to unconstrain)
- Color overlay (applies via CSS `color` + `currentColor`)
- Opacity
- Max file size: 100KB

### Files to Create/Modify
| Action | File |
|--------|------|
| Create | `src/lib/utils/sanitize-svg.ts` — SVG sanitizer |
| Create | `src/components/builder/svg-import-dialog.tsx` — upload/paste modal |
| Modify | `src/types/index.ts` — add CUSTOM_SVG to BLOCK_TYPES |
| Modify | `src/config/block-registry.ts` — register custom_svg block type |
| Modify | `src/components/builder/block-renderer.tsx` — render custom SVG |
| Modify | `src/components/builder/builder-workspace.tsx` — add import button to toolbar |

---

## Build Order

```
1. Background Patterns  →  Biggest visual impact, least code
2. Shape Presets         →  Mostly data, one new panel
3. Icon Picker           →  Useful across app, moderate effort
4. SVG Import            →  Most complex (security), save for last
```

Each feature is independent — can be built and shipped separately.
