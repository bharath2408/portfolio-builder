# Studio Enhancements — Gradient Editor, Custom Fonts, Asset Library, Responsive Auto-Adapt

**Date:** 2026-03-28
**Status:** Approved

---

## 1. Gradient Editor

### Purpose
Visual multi-stop gradient builder for block and section/frame backgrounds. Replaces manually typing CSS gradient strings.

### Where it appears
- **Block properties panel** → Appearance section → new toggle to switch between solid color and gradient mode (next to existing background color picker)
- **Section/frame properties** → same location when a frame is selected

### UI Components

**GradientEditor component** (`src/components/builder/gradient-editor.tsx`):
- **Mode toggle**: Solid / Gradient switch
- **Gradient bar**: Horizontal preview bar showing the current gradient
  - Click on bar to add a new color stop (max 6 stops, min 2)
  - Drag stops to reposition (0–100%)
  - Click a stop to select it and edit its color
  - Double-click or delete key to remove a stop (if > 2 remain)
- **Selected stop color**: Reuses existing `AdvancedColorInput` component (supports theme tokens + hex)
- **Type selector**: Linear / Radial toggle buttons
- **Angle control**: Slider (0–360°) for linear gradients
- **Radial position**: 3×3 grid picker (top-left, center, bottom-right, etc.) for radial center
- **CSS output**: Read-only text showing the generated CSS string, with copy button
- **Presets**: 6–8 common gradient presets (e.g., sunset, ocean, aurora) for quick selection

### Data Model
No database changes. The gradient is stored as a CSS string in the existing fields:
- `BlockStyles.backgroundGradient` (already exists as `string | undefined`)
- `SectionStyles.backgroundGradient` (already exists as `string | undefined`)

### Gradient String Format
```
linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #f43f5e 100%)
radial-gradient(circle at center, #06b6d4 0%, transparent 70%)
```

### Integration Points
- `block-properties-panel.tsx` → Appearance section: add gradient toggle + GradientEditor
- `builder-workspace.tsx` → section properties (when frame is selected): add gradient toggle + GradientEditor
- `block-renderer.tsx` → `buildInlineStyles()` already handles `backgroundGradient` — no changes needed
- `portfolio-renderer.tsx` → already renders gradients — no changes needed

### Internal State Shape
```typescript
interface GradientStop {
  id: string;       // unique key for React
  color: string;    // hex or theme token
  position: number; // 0–100
}

interface GradientState {
  type: "linear" | "radial";
  angle: number;            // 0–360 (linear only)
  radialPosition: string;   // "center" | "top left" | etc. (radial only)
  stops: GradientStop[];    // min 2, max 6
}
```

The component converts this state to/from CSS gradient strings for storage.

---

## 2. Custom Fonts Upload

### Purpose
Allow users to upload custom .woff2/.woff/.ttf font files beyond the 10 built-in Google Fonts options.

### Database Changes

New model in `prisma/schema.prisma`:
```prisma
model CustomFont {
  id          String    @id @default(cuid())
  userId      String
  portfolioId String
  name        String    // Display name (e.g., "Satoshi Bold")
  url         String    // Cloudinary URL to font file
  format      String    // "woff2" | "woff" | "ttf"
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@unique([portfolioId, name])
  @@index([portfolioId])
}
```

Add `customFonts CustomFont[]` relation to both `User` and `Portfolio` models.

### Limits
- Max 5 custom fonts per portfolio
- Max file size: 2MB per font file
- Accepted formats: `.woff2`, `.woff`, `.ttf`

### API Routes

**`POST /api/portfolios/[id]/fonts`**
- Accepts: `{ name: string, url: string, format: string }`
- Validates: font count < 5, name uniqueness within portfolio
- Creates `CustomFont` record

**`GET /api/portfolios/[id]/fonts`**
- Returns all custom fonts for the portfolio

**`DELETE /api/portfolios/[id]/fonts/[fontId]`**
- Deletes the font record (Cloudinary file remains for CDN cache; optional cleanup)

### UI Integration

**Theme Editor** (`theme-editor.tsx`):
- Font dropdowns (Heading, Body) get a divider after built-in fonts
- Below divider: list of custom fonts for this portfolio
- At the bottom: "Upload font" button
- Upload flow: file picker → client-side upload to Cloudinary → POST to API → font appears in dropdown

**Font Loading** (`portfolio-renderer.tsx`):
- Fetch custom fonts for the portfolio via API or include in portfolio data
- Inject `@font-face` declarations into a `<style>` tag:
  ```css
  @font-face {
    font-family: "Satoshi Bold";
    src: url("https://res.cloudinary.com/...") format("woff2");
    font-display: swap;
  }
  ```

**Block Renderer** (`block-renderer.tsx`):
- `resolveFontFamily()` already passes through non-token font names — custom font names work automatically

### Builder Preview
- Same `@font-face` injection in the builder workspace so fonts preview in real-time while editing

---

## 3. Asset/Media Library

### Purpose
Persistent image library panel. Upload once, reuse across all blocks and portfolios. Eliminates re-uploading the same image for different blocks.

### Database Changes

New model in `prisma/schema.prisma`:
```prisma
model Asset {
  id           String   @id @default(cuid())
  userId       String
  name         String   // Original filename or user-given name
  url          String   // Cloudinary URL
  thumbnailUrl String?  // Cloudinary thumbnail transformation URL
  type         String   // "image" | "svg" | "video"
  size         Int      // File size in bytes
  width        Int?     // Image width (from Cloudinary response)
  height       Int?     // Image height (from Cloudinary response)
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])
}
```

Add `assets Asset[]` relation to `User` model.

Assets are **per-user** (shared across all portfolios).

### API Routes

**`GET /api/assets`**
- Returns all assets for the authenticated user, ordered by `createdAt` desc
- Optional query params: `type` filter, `search` by name

**`POST /api/assets`**
- Accepts: `{ name, url, thumbnailUrl, type, size, width, height }`
- Creates `Asset` record after client-side Cloudinary upload

**`DELETE /api/assets/[id]`**
- Deletes asset record
- Does NOT delete from Cloudinary (may be in use by blocks)

**`PATCH /api/assets/[id]`**
- Rename asset

### UI: Assets Tab in Left Panel

**Location:** 4th tab in the left panel alongside Layers, Elements, Shapes.

**Layout:**
- **Header**: "Assets" label + upload button (Plus icon)
- **Upload area**: Drag-and-drop zone at top (collapsible)
- **Grid view**: 2-column grid of asset thumbnails with name below
- **Actions on hover**: Delete button, copy URL button
- **Click behavior**: Inserts an image block with the asset URL into the selected section (same as adding any block)
- **Search**: Filter input at top to search by filename
- **Empty state**: "Upload images to reuse across your portfolio" with upload icon

### Integration with Image Upload

**`image-upload.tsx` enhancement:**
- Add a "Library" tab alongside the current upload UI
- Shows the same asset grid (filtered to images)
- Click an asset → fills the image URL (same as pasting a URL)
- This appears anywhere an image block's source is being edited (properties panel)

### Limits
- Max 100 assets per user
- Max file size: 10MB (matches current Cloudinary upload limit)
- Supported types: image/*, .svg

---

## 4. Responsive Auto-Adapt

### Purpose
One-click generation of tablet and mobile layouts from the desktop layout. Eliminates the tedious manual process of repositioning every block for each breakpoint.

### Where it appears
- **Toolbar**: New "Auto-adapt" button (Wand2 icon) in the device preview toggle area
- Only enabled when currently viewing **desktop** mode
- Disabled state with tooltip when viewing tablet/mobile: "Switch to desktop view first"

### Confirm Dialog
Before applying, show a confirm dialog:
> **Auto-generate responsive layouts?**
>
> This will create tablet (768px) and mobile (375px) layouts based on your desktop design.
> Blocks that already have manual responsive overrides will be skipped.
>
> [Cancel] [Generate]

### Algorithm

**Input:** All blocks in the current page's visible sections (desktop styles only).

**Step 1 — Row Detection:**
- Sort blocks by Y position, then X
- Group blocks into "visual rows": blocks whose Y ranges overlap by > 50% are in the same row
- Within each row, sort blocks left-to-right by X

**Step 2 — Tablet Layout (768px):**
- Scale factor: `768 / frameWidth` (typically 768/1440 ≈ 0.533)
- For each block:
  - `x = desktop.x * scaleFactor`
  - `y` = recalculated based on scaled row positions
  - `w = desktop.w * scaleFactor`
  - `h` = keep original (auto-height for text blocks) or scale proportionally
  - `fontSize` = `desktop.fontSize * 0.85` (15% reduction) if set
  - Padding/margin scaled by same factor

**Step 3 — Mobile Layout (375px):**
- For each visual row, stack blocks vertically (full-width):
  - `x = padding` (default 16px)
  - `w = 375 - (padding * 2)` = 343px
  - `y` = cumulative height of previous blocks + gap (16px between blocks)
  - `fontSize` = `desktop.fontSize * 0.75` (25% reduction) if set
  - Blocks that were side-by-side now stack top-to-bottom in their left-to-right order

**Step 4 — Write Overrides:**
- For each block, write computed values to `tabletStyles` / `mobileStyles`
- **Skip blocks** that already have non-empty `tabletStyles` / `mobileStyles` (preserve manual work)
- Push undo snapshot before applying

### Section Frame Adjustment
- Tablet: frame width set to 768, frame height recalculated based on content
- Mobile: frame width set to 375, frame height recalculated based on stacked content

### Implementation Location
- New utility: `src/lib/utils/responsive-adapt.ts`
  - Pure function: `generateResponsiveLayouts(blocks, frameWidth, frameHeight) → { tabletOverrides, mobileOverrides, tabletFrame, mobileFrame }`
- Integration in `builder-workspace.tsx`:
  - Button handler calls the utility, applies results via `portfolioStore.updateBlockInSection()`
  - Wrapped in undo snapshot

### Edge Cases
- Hidden blocks (`isVisible: false`): skip
- Locked blocks (`isLocked: true`): skip
- Group blocks: adapt the group container, children positions stay relative
- Zero-height blocks (auto-height text): use estimated height of 40px for layout calc
- Single block in a row: just scale width, keep centered if it was centered

---

## File Inventory

### New Files
| File | Purpose |
|------|---------|
| `src/components/builder/gradient-editor.tsx` | Visual gradient builder component |
| `src/app/api/portfolios/[id]/fonts/route.ts` | Custom font CRUD (GET, POST) |
| `src/app/api/portfolios/[id]/fonts/[fontId]/route.ts` | Delete custom font |
| `src/app/api/assets/route.ts` | Asset library CRUD (GET, POST) |
| `src/app/api/assets/[id]/route.ts` | Asset delete/rename (DELETE, PATCH) |
| `src/lib/utils/responsive-adapt.ts` | Auto-adapt layout algorithm |

### Modified Files
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `CustomFont` and `Asset` models |
| `src/types/index.ts` | Add `CustomFont`, `Asset` type interfaces |
| `src/components/builder/block-properties-panel.tsx` | Add gradient toggle + GradientEditor in Appearance section |
| `src/components/builder/theme-editor.tsx` | Add custom font upload + display in font dropdown |
| `src/components/builder/builder-workspace.tsx` | Add Assets tab in left panel, Auto-adapt button in toolbar, section gradient editor |
| `src/components/common/image-upload.tsx` | Add "Library" tab for asset picker |
| `src/components/portfolio/portfolio-renderer.tsx` | Inject `@font-face` for custom fonts |
| `src/config/constants.ts` | Add gradient presets |

---

## Implementation Order

1. **Gradient Editor** — self-contained UI component, no DB changes, lowest risk
2. **Asset Library** — DB migration + new panel + image-upload integration
3. **Custom Fonts** — DB migration + theme editor changes + font-face injection
4. **Responsive Auto-Adapt** — pure algorithm + toolbar button, most complex logic

Each feature is independent and can be shipped incrementally.
