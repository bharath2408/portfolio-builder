# Studio Tier 1 Features — Design Spec
we
**Date:** 2026-03-23
**Scope:** 5 high-impact features for the portfolio builder studio
**Status:** Approved

---

## 1. Mobile/Tablet Preview in Studio

### Purpose
Users need to see how their portfolio renders on different devices without leaving the editor or opening browser DevTools.

### Design

**UI:** A 3-button toggle group in the studio top toolbar, positioned between the zoom controls and the light/dark theme toggle (right section of toolbar).

| Button | Viewport Width | Label |
|--------|---------------|-------|
| Desktop | 100% (full canvas) | Monitor icon |
| Tablet | 768px | Tablet icon |
| Mobile | 375px | Smartphone icon |

**Behavior:**
- Clicking a device button constrains the **children container inside the canvas engine** (not the engine itself) to that viewport width, centered horizontally with a subtle device-frame outline (rounded border, shadow)
- The editing panels (left layers, right properties) remain unchanged — only the canvas area resizes
- Block selection and editing continue to work during device preview
- Default is Desktop (no constraint)
- Device selection is stored in builder store as session state (not persisted to DB)

**Files to modify:**
- `src/stores/builder-store.ts` — add `devicePreview: "desktop" | "tablet" | "mobile"` state
- `src/components/builder/builder-workspace.tsx` — add toggle group to toolbar, wrap canvas children with a width-constraining container div
- No changes to `canvas-engine.tsx` — the constraint is applied to the content wrapper inside, not the engine

**No new API endpoints required.**

---

## 2. Undo/Redo with UI Buttons

### Purpose
The builder store already has undo/redo stacks (max 50 snapshots) but they are never populated and the toolbar buttons are not connected. Users cannot recover from mistakes.

### Design

**What exists:**
- `undoStack` and `redoStack` in builder store
- `pushSnapshot` method (clears redoStack on push — correct behavior)
- `Undo2` and `Redo2` icons already imported in workspace

**Critical: The existing `undo()` and `redo()` methods must be rewritten.** The current implementation pushes the popped snapshot to the opposite stack instead of the current state. Correct logic:

1. **Undo:** Capture current portfolio state → push to `redoStack` → pop from `undoStack` → restore popped state
2. **Redo:** Capture current portfolio state → push to `undoStack` → pop from `redoStack` → restore popped state

**Snapshot strategy:**
- Snapshots store a deep clone of `currentPortfolio` sections, blocks, and theme only (exclude `user` and `template` relations — they never change during editing)
- Use `structuredClone()` for deep cloning to prevent reference-sharing mutations
- Max 50 snapshots at ~10-50KB each = ~0.5-2.5MB memory (acceptable)

**What needs to happen:**

1. **Snapshot capture:** Call `pushSnapshot` before every mutation:
   - Block content/style update
   - Block add/delete/duplicate
   - Section add/delete
   - Section style update
   - Theme changes

2. **Toolbar wiring:**
   - Undo button calls undo action, disabled when `undoStack.length === 0`
   - Redo button calls redo action, disabled when `redoStack.length === 0`

3. **Keyboard shortcuts:** `Ctrl+Z` (undo), `Ctrl+Shift+Z` (redo) — add to existing keyboard handler.

4. **Stack clear:** Already clears on save (implemented).

**Files to modify:**
- `src/stores/builder-store.ts` — rewrite `undo()` and `redo()` actions with correct state-swap logic, update snapshot data type to exclude user/template
- `src/stores/portfolio-store.ts` — add `replacePortfolio(portfolio)` action for state restoration
- `src/components/builder/builder-workspace.tsx` — call `pushSnapshot` before mutations, wire toolbar buttons, add keyboard shortcuts

**No new API endpoints required.**

---

## 3. Portfolio Templates

### Purpose
New users see a blank canvas and don't know where to start. Starter templates give them a pre-built structure they can customize.

### Design

**Template Gallery UI:**
- Shown on the New Portfolio page (`/dashboard/portfolios/new`) as the first step
- Grid of template cards: thumbnail image, name, short description
- Options: "Developer", "Designer", "Freelancer", "Minimal", "Creative", plus "Blank Canvas"
- Selecting a template highlights it, then user proceeds to the title/slug form
- Selected template ID is submitted alongside title/slug/description

**Template Data:**
- Uses existing `Template` model in Prisma schema (already has `name`, `description`, `thumbnail`, `config` JSON, `isActive`, `isPremium`)
- `config` JSON structure:
  ```json
  {
    "theme": { "mode": "DARK", "primaryColor": "#6366f1", ... },
    "sections": [
      {
        "name": "Hero",
        "sortOrder": 0,
        "styles": { ... },
        "blocks": [
          { "type": "heading", "sortOrder": 0, "content": { ... }, "styles": { ... } },
          ...
        ]
      },
      ...
    ]
  }
  ```

**Seed Script:**
- `prisma/seed.ts` already exists with placeholder templates (empty `config: {}`). Modify it to fill in full template configs.
- Each template has 4-6 sections with realistic placeholder content
- Create `public/templates/` directory with placeholder thumbnail images

**Template Theme Override:**
- When a template includes a `theme` object in its config, use it instead of the hardcoded default dark theme in the create API
- If no theme in template config, fall back to the existing default

**API Changes:**
- `GET /api/templates` — returns all active templates (public, no auth required)
- `POST /api/portfolios` — when `templateId` provided:
  1. Fetch template config
  2. Validate config structure
  3. Create portfolio + sections + blocks + theme in a single Prisma transaction
  4. Template theme overrides default theme; if template has no theme, use existing defaults

**Create flow:**
1. User picks template (or blank)
2. Fills in title/slug/description
3. API creates portfolio from template config
4. Redirects to studio

**Future-proofing:**
- `Template` model already has `isPremium` flag for future gating
- Adding `userId` field later enables community templates
- `isActive` flag allows hiding templates without deletion

**Files to create:**
- `src/app/api/templates/route.ts` — GET templates endpoint
- `public/templates/` — directory with template thumbnail images

**Files to modify:**
- `prisma/seed.ts` — fill in full template configs (file already exists)
- `src/app/dashboard/portfolios/new/page.tsx` — add template selection step
- `src/app/api/portfolios/route.ts` — handle `templateId` with template config application
- `src/hooks/index.ts` — update `usePortfolioMutations` to support `templateId` parameter

---

## 4. Portfolio Analytics Dashboard

### Purpose
Users only see a single view count number. They need to understand traffic trends, where visitors come from, and what devices they use.

### Design

**New Database Model:**

```prisma
model PortfolioView {
  id          String   @id @default(cuid())
  portfolioId String
  viewedAt    DateTime @default(now())
  referrer    String?
  deviceType  String?  // "desktop" | "mobile" | "tablet"

  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@index([portfolioId])
  @@index([portfolioId, viewedAt])
  @@map("portfolio_views")
}
```

Add `views PortfolioView[]` relation to Portfolio model.

**Privacy & data considerations:**
- Do NOT store raw `userAgent` strings (PII-adjacent). Parse device type server-side and store only the category ("desktop"/"mobile"/"tablet").
- Store `referrer` as just the hostname (e.g., "linkedin.com"), not full URL.
- Future: add a cleanup job or TTL index to prune records older than 90 days.

**Preventing duplicate view counts:**
- The current codebase has a bug: both `generateMetadata` and the page component call `getPortfolioBySlug`, which double-counts views. Fix: move view tracking out of the shared data-fetching function and into a dedicated server action called only from the page component (not from `generateMetadata`).

**Public Page Update:**
- Insert a row into `PortfolioView` with parsed device type and referrer hostname
- Also increment `viewCount` as denormalized counter for dashboard stats
- Non-blocking (fire-and-forget, no await)

**Analytics API:**
- `GET /api/portfolios/[id]/analytics?range=7|30|90`
- Returns:
  ```json
  {
    "total": 1234,
    "period": { "views": 89, "range": "7d" },
    "daily": [{ "date": "2026-03-17", "views": 12 }, ...],
    "referrers": [{ "source": "linkedin.com", "count": 45 }, ...],
    "devices": { "desktop": 60, "mobile": 35, "tablet": 5 }
  }
  ```
- Aggregates from `PortfolioView` table with date filtering
- Requires auth + ownership check

**Analytics Page:**
- Route: `/dashboard/portfolios/[id]/analytics`
- Layout:
  - **Header:** Portfolio title, date range selector (7d / 30d / 90d)
  - **Stat cards row:** Total views, views in period, daily average, top referrer
  - **Line chart:** Views per day for selected range — minimal SVG (just the line + dots, no interactivity in v1). Keep to ~100 lines.
  - **Two columns below:**
    - Left: Top referrers list (source + count + bar)
    - Right: Device breakdown (desktop/mobile/tablet with percentage bars)
- Loading skeleton matches the layout

**Navigation:**
- Add "Analytics" button to portfolio actions on `/dashboard/portfolios` page
- Add "Analytics" link in studio toolbar dropdown menu

**Files to create:**
- `src/app/dashboard/portfolios/[id]/analytics/page.tsx`
- `src/app/dashboard/portfolios/[id]/analytics/loading.tsx`
- `src/app/api/portfolios/[id]/analytics/route.ts`
- `src/components/common/svg-line-chart.tsx` — minimal SVG chart (~100 lines)

**Files to modify:**
- `prisma/schema.prisma` — add `PortfolioView` model, add relation to `Portfolio` (requires migration)
- `src/app/portfolio/[username]/[slug]/page.tsx` — fix double-count bug, add PortfolioView insert
- `src/app/dashboard/portfolios/page.tsx` — add Analytics action button
- `src/components/builder/builder-workspace.tsx` — add Analytics link in menu

---

## 5. Import JSON

### Purpose
Export exists (`Ctrl+E`) but there's no import. Users can't restore backups, migrate portfolios, or duplicate across accounts.

### Design

**Import UI:**
- New option on the New Portfolio page alongside templates: "Import from JSON"
- Shows a file upload dropzone (drag-and-drop or click to browse)
- Accepts only `.json` files
- On file select: parses JSON, validates structure, shows preview (title, section count, block count)
- On validation failure: shows clear error message describing what's wrong
- Pre-fills title and slug from the imported data (editable)
- User submits the form to create portfolio from imported data

**Export/Import parity note:** The current export does not include `description`. The import should handle its absence gracefully (default to empty string). Future: add `description` to the export format for full roundtrip.

**Validation (client-side + server-side):**
- Must be valid JSON
- Must have `title` (string)
- Must have `sections` (array)
- Each section must have `name`, `blocks` (array)
- Each block must have `type` (valid block type from BLOCK_REGISTRY), `content`, `styles`
- Optional: `theme` object
- Rejects files over 2MB (enforced both client-side and server-side)
- Server-side: sanitize `content.html` fields to prevent XSS
- Server-side: validate `styles` values against allowed types

**Import API:**
- `POST /api/portfolios` — extended to accept an `importData` field
- When `importData` is provided:
  1. Validates structure server-side
  2. Sanitizes content fields
  3. Creates portfolio with provided title/slug
  4. Creates all sections with new IDs
  5. Creates all blocks with new IDs
  6. Creates theme if included
  7. All in a single Prisma transaction
- Returns the new portfolio (same as normal create)

**Note on route complexity:** After features 3 and 5, `POST /api/portfolios` handles three creation modes: blank, from template, and from import. Extract each mode into a helper function to keep the route handler clean:
- `createBlankPortfolio(data, userId)`
- `createFromTemplate(data, userId, templateId)`
- `createFromImport(data, userId, importData)`

**Files to create:**
- `src/lib/validations/import.ts` — Zod schema for validating import JSON structure

**Files to modify:**
- `src/app/dashboard/portfolios/new/page.tsx` — add import tab/option with file upload (note: templates feature will have already modified this file)
- `src/app/api/portfolios/route.ts` — handle `importData` in POST, extract helper functions
- `src/hooks/index.ts` — update `usePortfolioMutations` to support `importData` parameter

---

## Implementation Order

Build in this sequence (each feature is independent but this order maximizes value at each step):

1. **Undo/Redo** — smallest scope, purely client-side, immediately improves editing experience
2. **Mobile/Tablet Preview** — small scope, high visibility, no API changes
3. **Import JSON** — moderate scope, completes the export feature
4. **Portfolio Templates** — moderate scope, needs seed data + UI (builds on import's changes to new portfolio page and POST route)
5. **Portfolio Analytics** — largest scope, requires schema migration + new model + API + page + chart component

Note: Steps 3 and 4 both modify the new portfolio page and POST API route. Doing import first means templates can build on top. Step 4 should expect `importData` handling already present in the route.

---

## Non-Goals

- Real-time collaboration
- Community template marketplace (designed for, not built)
- Advanced analytics (heatmaps, click tracking, A/B testing)
- Custom domains
- SEO optimization tools
- User-agent string storage (privacy concern)

These are explicitly deferred to future tiers.
