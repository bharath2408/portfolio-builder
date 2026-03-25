# Community Templates — Design Spec

**Date:** 2026-03-25
**Status:** Approved

---

## Overview

Users can publish their portfolio as a community template directly from the "Update & Publish" dialog. Other users can browse community templates on the landing page and inside the dashboard, then clone any template into a new portfolio with one click.

---

## 1. Publish Dialog — Tab 2: Share as Template

### UI Change
The existing "Update & Publish" dialog gains a **pill/segmented toggle** at the top with two tabs:
- **Publish** (left, default) — existing flow, no changes
- **Share as Template** (right) — new tab

### Precondition
A portfolio must have `status === 'PUBLISHED'` before it can be shared as a template. If the portfolio is a DRAFT, the "Share as Template" tab shows a notice: "Publish your portfolio first before sharing it as a template."

### Template Tab Fields

| Field | Type | Validation |
|---|---|---|
| Template Name | text input | Required, max 80 chars. Pre-filled with portfolio title. |
| Description | textarea | Required, max 300 chars |
| Category | select | Required. Options: Developer, Designer, Writer, Other |
| Color Theme | select | Required. Options: Dark, Light (maps to ThemeMode DARK / LIGHT) |
| Tags | tag input | Optional. Max 5 tags, each max 20 chars, alphanumeric + hyphens only |

### Behavior
- "Share Template" button POSTs to `POST /api/community-templates`
- Template goes **live immediately** — no approval step
- Thumbnail sourced from `portfolio.ogImageUrl`. If `null`, `thumbnail` is stored as `null` and all card renderers show a gradient placeholder.
- On success: show inline success state ("Template shared to community!") then dismiss after 3s
- A portfolio can only have **one active community template** — re-submitting upserts the existing entry

---

## 2. Data Model

New Prisma model: `CommunityTemplate`

```prisma
model CommunityTemplate {
  id          String   @id @default(cuid())
  portfolioId String   @unique
  userId      String
  name        String
  description String
  category    CommunityTemplateCategory
  isDark      Boolean  @default(true)   // true = Dark theme, false = Light
  tags        String[]
  thumbnail   String?
  useCount    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum CommunityTemplateCategory {
  DEVELOPER
  DESIGNER
  WRITER
  OTHER
}
```

The `User` model in `schema.prisma` must also add the back-relation:
```prisma
// inside model User { ... }
communityTemplates CommunityTemplate[]
```

Notes:
- `isDark` boolean instead of a new enum — avoids conflict with the existing `ThemeMode` enum (LIGHT | DARK | CUSTOM) in the schema
- `portfolioId @unique` enforces one template per portfolio at the database level
- `thumbnail: String?` — null is valid; all renderers must handle it with a gradient placeholder

---

## 3. API Endpoints

### `POST /api/community-templates`

Create or update a community template.

**Auth:** Required (session user must own the portfolio)

**Validation (Zod):**
```ts
z.object({
  portfolioId: z.string().cuid(),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  category: z.enum(['DEVELOPER', 'DESIGNER', 'WRITER', 'OTHER']),
  isDark: z.boolean(),
  tags: z.array(z.string().max(20).regex(/^[a-z0-9-]+$/)).max(5).default([]),
})
```

**Pre-checks:**
1. Portfolio must exist and belong to the session user → 403 if not
2. `portfolio.status === 'PUBLISHED'` → 400 with message "Portfolio must be published first" if not

**Logic:** Upsert on `portfolioId`. Set `thumbnail` from `portfolio.ogImageUrl ?? null`.

**Response:** Created/updated `CommunityTemplate` object.

---

### `GET /api/community-templates`

Fetch community templates for browse pages.

**Auth:** Public (no auth required)

**Query params:**
| param | type | notes |
|---|---|---|
| `category` | string | Filter by CommunityTemplateCategory |
| `isDark` | boolean | Filter by theme |
| `tag` | string | Filter by tag |
| `sort` | string | `most_used` (default) \| `newest` |
| `search` | string | Keyword search on name + description. Ignored if < 2 chars. Case-insensitive (`mode: 'insensitive'` in Prisma). Special chars stripped before query. |
| `limit` | number | Default 12, max 24 |
| `cursor` | string | Cursor-based pagination |

**Response:** `{ templates: CommunityTemplate & { user: { username: string | null, name: string | null } }[], nextCursor: string | null }`

The `user` sub-object (`username` and `name` only) must be joined and included so template cards can render the author display name without a second request.

---

### `POST /api/community-templates/[id]/use`

Clone a community template into a new portfolio for the authenticated user.

**Auth:** Required

**Pre-checks:**
1. `CommunityTemplate` must exist → 404 if not
2. Check `MAX_PORTFOLIOS_PER_USER` limit for session user. If at limit → return 409 with message: "You've reached the maximum number of portfolios. Delete one to continue."

**Clone logic (all in one transaction):**
1. Load source `CommunityTemplate` → load its `Portfolio` with all `Section` + `Block` records (including `tabletStyles` and `mobileStyles` on each block)
2. Create a new `Portfolio` for the current user (`status: DRAFT`, `title: template.name`)
3. Deep-clone all sections (new IDs, same `name`, `sortOrder`, `styles`, `isVisible`, `isLocked`)
4. Deep-clone all blocks (new IDs, same `type`, `sortOrder`, `content`, `styles`, `tabletStyles`, `mobileStyles`, `isVisible`, `isLocked`)
5. Clone the source `Theme` if one exists (new record linked to new portfolio)
6. Generate slug for new portfolio using template name, with collision loop (`[slug]-copy`, `[slug]-copy-2`, etc.) — same pattern as the existing duplicate route (`src/app/api/portfolios/[id]/duplicate/route.ts` lines 42–47)
7. Increment `CommunityTemplate.useCount` inside the same transaction (atomic with portfolio creation — no double-count risk)
8. Return `{ portfolioId: newPortfolio.id }`

**Client:** On success, redirect to `/dashboard/portfolios/[newPortfolioId]/edit`

---

## 4. Landing Page — Community Showcase Section

### Location
New section on the marketing landing page, after the existing features section.

### Content
- Section badge: "COMMUNITY"
- Heading: **"Built by the Community"**
- Subheading: "Browse portfolios shared by real users and start from a great foundation"
- Grid of **4–8 templates** — sorted by `useCount` descending
- "Browse all templates →" CTA links to `/community`

### Template Card
- Thumbnail image (or gradient placeholder if `thumbnail` is null)
- Template name
- Author: display `user.username ?? user.name ?? "Anonymous"`
- Use count ("24 uses")
- "Use Template →" button

### Unauthenticated "Use Template" flow
1. User clicks "Use Template →" on landing page without being signed in
2. Redirect to `/login?callbackUrl=/community/use/[templateId]`
3. After login, NextAuth redirects to `/community/use/[templateId]`
4. That route (server component or API route handler) calls the clone logic, then redirects to `/dashboard/portfolios/[newId]/edit`

### Route
`/community` — public page with full search + filter experience (no dashboard chrome).

**Middleware:** `/community` and `/community/use/[id]` must be added to `publicRoutes` in `src/middleware.ts` so unauthenticated users can browse templates freely. The `/community/use/[id]` handler checks for a session itself and redirects to login if not authenticated.

---

## 5. Dashboard Community Page

### Route
`/dashboard/community`

### Navigation
New item in the dashboard sidebar/header nav (label: "Community", icon: `Users` from Lucide).

### Features
- **Search bar** — keyword search, debounced 300ms, minimum 2 chars before triggering API call
- **Filter pills** — All, Developer, Designer, Writer, Dark, Light, Most Used, Newest
- **Template grid** — 4-column layout on desktop, infinite scroll (cursor-based pagination)
- **Template card actions:**
  - **Use** — calls `POST /api/community-templates/[id]/use`, redirects to new portfolio editor. If user is at portfolio limit, shows toast: "You've reached the max portfolio limit. Delete one to continue."
  - **Preview** — opens the source portfolio public URL (`/portfolio/[username]/[slug]`) in a new tab. Button is hidden if the source portfolio is no longer published or the author has no username.

### Design Quality
Implementation must use the `frontend-design` skill for polished UI. Match the aesthetic of the existing dashboard portfolio card components (`src/components/dashboard/`).

---

## 6. Author Display

Everywhere an author name is shown (landing page cards, dashboard community cards):
- Display `user.username` if set
- Else display `user.name` if set
- Else display `"Anonymous"`

---

## 7. User Flows

### Publish as Template
1. User opens "Update & Publish" dialog from editor (portfolio must be PUBLISHED)
2. Clicks "Share as Template" pill tab
3. Fills in name (pre-filled), description, category, color theme, tags
4. Clicks "Share Template"
5. API validates and upserts `CommunityTemplate` record
6. Success state shown in dialog, auto-dismisses after 3s

### Use a Template (logged in)
1. User sees template card on landing page, `/community`, or `/dashboard/community`
2. Clicks "Use Template"
3. If at portfolio limit → toast error, no redirect
4. Else → API clones portfolio → redirects to `/dashboard/portfolios/[newId]/edit`

### Use a Template (not logged in, landing page)
1. User clicks "Use Template" on landing page
2. Redirected to `/login?callbackUrl=/community/use/[templateId]`
3. After auth, NextAuth redirects to `/community/use/[templateId]`
4. Route handler clones portfolio and redirects to `/dashboard/portfolios/[newId]/edit`

---

## 8. Out of Scope (this iteration)
- Admin moderation/approval flow
- Template ratings or comments
- Premium/paid templates
- User profile pages showing submitted templates
- Template versioning
- Rate limiting on template submission endpoints (deferred — platform-level protection assumed)
