# Studio Tier 2 Features — Design Spec

**Date:** 2026-03-23
**Scope:** 5 features — drag reorder, portfolio duplicate, SEO settings, custom subdomains
**Status:** Approved

---

## 1. Section Drag Reorder in Layers Panel

### Purpose
Users cannot reorder sections (frames) in the layers panel. They must delete and recreate to change order.

### Design

**Library:** `@dnd-kit/core` + `@dnd-kit/sortable` (already installed, `sortable-section.tsx` exists but unused in current layers panel)

**Implementation:**
- Wrap the section list in the layers tab with `DndContext` + `SortableContext` (vertical list strategy)
- Each section row becomes a `useSortable` item with `GripVertical` as the drag handle
- On `onDragEnd`: extract `active.id` and `over.id`, compute new order, call `portfolioStore.reorderSections(newOrderedIds)` (already exists)
- Mark dirty + trigger auto-save
- Canvas frame Y positions auto-recalculate since they're derived from `sortOrder` + section index

**Files to modify:**
- `src/components/builder/builder-workspace.tsx` — wrap section list with DnD providers, make section rows sortable

**No new API endpoints.** Batch save persists `sortOrder`.

---

## 2. Block Drag Reorder in Layers Panel

### Purpose
Users cannot reorder blocks within a section by dragging in the layers panel.

### Design

**Same library:** `@dnd-kit/sortable` nested inside each expanded section.

**Implementation:**
- Each expanded section's block list gets its own `SortableContext`
- Each `LayerBlockItem` becomes a sortable item using `useSortable`
- `GripVertical` icon (already present) becomes the drag handle
- On `onDragEnd`: compute new block order, call `portfolioStore.reorderBlocksInSection(sectionId, newOrderedBlockIds)` (already exists)
- Mark dirty + auto-save
- No cross-section dragging — blocks stay within their parent section

**Files to modify:**
- `src/components/builder/builder-workspace.tsx` — wrap block lists with sortable context, update `LayerBlockItem` to use `useSortable`

**No new API endpoints.** Batch save persists block `sortOrder`.

---

## 3. Portfolio Duplicate

### Purpose
Users want to clone a portfolio to create variations without starting from scratch.

### Design

**UI:**
- "Duplicate" button in portfolio actions on `/dashboard/portfolios` page (next to Edit, Analytics, Delete)
- Copy icon + "Duplicate" label
- Shows loading state while duplicating

**API:** `POST /api/portfolios/[id]/duplicate`
- Requires auth + ownership check
- Checks `MAX_PORTFOLIOS_PER_USER` limit
- Reads source portfolio with all sections, blocks, and theme
- Creates new portfolio:
  - Title: `"{original title} (Copy)"`
  - Slug: `"{original-slug}-copy"` with counter if slug exists (`-copy-2`, `-copy-3`)
  - Status: `DRAFT` (always, even if source was published)
  - `isDefault: false`
- Copies all sections with new IDs preserving `sortOrder`, `styles`, `name`
- Copies all blocks with new IDs preserving `type`, `sortOrder`, `content`, `styles`
- Copies theme with new ID preserving all color/font settings
- All in a single Prisma transaction
- Returns the new portfolio (same select shape as list)

**After duplicate:** Add to local store, optionally redirect to studio or stay on list.

**Files to create:**
- `src/app/api/portfolios/[id]/duplicate/route.ts`

**Files to modify:**
- `src/app/dashboard/portfolios/page.tsx` — add Duplicate button
- `src/hooks/use-portfolio.ts` — add `duplicatePortfolio` mutation

---

## 4. SEO Settings per Portfolio

### Purpose
Published portfolios have weak SEO. Users need control over meta title, description, and OG image.

### Design

**Schema changes** (add to `Portfolio` model):
```prisma
seoTitle       String?   // Custom meta title (max 60 chars)
seoDescription String?   // Custom meta description (max 160 chars)
ogImageUrl     String?   // Custom Open Graph image URL
```

**Validation:** Add to `updatePortfolioSchema`:
```typescript
seoTitle: z.string().max(60).optional(),
seoDescription: z.string().max(160).optional(),
ogImageUrl: z.string().url().optional().or(z.literal("")),
```

**UI:** New "SEO" section in the studio right panel, accessible via a tab or within the theme editor:
- Meta Title input (60 char limit with counter)
- Meta Description textarea (160 char limit with counter)
- OG Image URL input with thumbnail preview
- Google search result preview (title in blue, URL in green, description in gray)
- Social card preview (OG image + title + description)

**API:** `PATCH /api/portfolios/[id]` already accepts partial updates. Just add the fields to the schema + validation.

**Public page update:** In `generateMetadata`:
```typescript
const title = portfolio.seoTitle ?? `${portfolio.title} — ${portfolio.user.name}`;
const description = portfolio.seoDescription ?? portfolio.description ?? `${portfolio.user.name}'s portfolio`;
const ogImage = portfolio.ogImageUrl ?? undefined;
```

**Files to modify:**
- `prisma/schema.prisma` — add 3 fields to Portfolio
- `src/lib/validations/portfolio.ts` — add fields to updatePortfolioSchema
- `src/components/builder/builder-workspace.tsx` — add SEO section/tab in right panel
- `src/app/portfolio/[username]/[slug]/page.tsx` — use SEO fields in generateMetadata
- `src/app/portfolio/[username]/page.tsx` — same for default portfolio page

---

## 5. Custom Subdomain Support

### Purpose
Users want a cleaner URL like `username.foliocraft.com` instead of `/portfolio/username/slug`.

### Design

**Subdomain-only** — no custom domains (requires SSL provisioning per domain). Users get `username.foliocraft.com` automatically based on their username.

**Middleware logic** (modify `src/middleware.ts`):
1. Extract hostname from request
2. Parse subdomain: `alexchen.foliocraft.com` → `alexchen`
3. Skip reserved subdomains: `www`, `api`, `app`, `dashboard`, empty
4. If valid subdomain detected: rewrite request internally to `/portfolio/[username]`
5. URL stays as `alexchen.foliocraft.com` (no redirect)

**Environment:** Add `NEXT_PUBLIC_ROOT_DOMAIN` env var (e.g., `foliocraft.com`). Middleware uses this to detect subdomains.

**DNS requirements:**
- Wildcard `*.foliocraft.com` A record → Vercel
- Add wildcard domain in Vercel project settings

**User-facing UI:**
- In Settings page, show "Your site: username.foliocraft.com" with a copy button
- In portfolio list, show subdomain URL for published portfolios

**Files to modify:**
- `src/middleware.ts` — add subdomain detection and rewrite
- `src/app/dashboard/settings/page.tsx` — show subdomain URL
- `src/app/dashboard/portfolios/page.tsx` — show subdomain in portfolio actions

**No new API endpoints.**

---

## Implementation Order

1. **Section Drag Reorder** — small, self-contained, uses existing store methods
2. **Block Drag Reorder** — builds on #1's DnD setup
3. **Portfolio Duplicate** — independent, new API endpoint
4. **SEO Settings** — schema change + UI + metadata
5. **Custom Subdomain** — middleware change, needs domain configuration

---

## Non-Goals

- Custom user-owned domains (SSL provisioning)
- Cross-section block dragging
- Drag reorder on the canvas itself (only in layers panel)
- Auto-generated OG images (users provide URLs)
- Subdomain for individual portfolios (subdomain = username, shows default portfolio)
