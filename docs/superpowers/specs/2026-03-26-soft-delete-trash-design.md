# Soft Delete & Trash Page — Design + Implementation Plan

**Date:** 2026-03-26
**Status:** Ready to implement

## Summary

Replace permanent portfolio deletion with soft delete. Deleted portfolios move to trash and can be recovered within 30 days. After 30 days, a cron job permanently deletes them. New `/dashboard/trash` page shows trashed portfolios with restore/permanent-delete actions.

---

## Phase 1: Schema + API Changes

### 1.1 Add `deletedAt` to Portfolio model

In `prisma/schema.prisma`, add to the Portfolio model:

```prisma
model Portfolio {
  // ... existing fields ...
  deletedAt      DateTime?       // null = active, set = soft-deleted
  // ... rest of model ...
}
```

Migration SQL:
```sql
ALTER TABLE "portfolios" ADD COLUMN "deletedAt" TIMESTAMP;
CREATE INDEX "portfolios_deletedAt_idx" ON "portfolios"("deletedAt");
```

Run: `npx prisma generate`

### 1.2 Update DELETE endpoint to soft delete

In `src/app/api/portfolios/[id]/route.ts`, change the DELETE handler:

**Before:**
```typescript
await db.portfolio.delete({ where: { id } });
```

**After:**
```typescript
await db.portfolio.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

### 1.3 Filter out trashed portfolios from all queries

Every query that fetches portfolios for display needs `deletedAt: null`:

| File | Change |
|------|--------|
| `src/app/api/portfolios/[id]/route.ts` (GET, PATCH) | Add `deletedAt: null` to `where` |
| `src/app/api/portfolios/route.ts` (GET list) | Add `deletedAt: null` to `where` |
| `src/app/api/public/[username]/route.ts` | Add `deletedAt: null` to `where` |
| `src/app/api/portfolios/[id]/duplicate/route.ts` | Add `deletedAt: null` to source query |

### 1.4 Create Trash API endpoints

**`src/app/api/trash/route.ts`** — GET trashed portfolios:

```typescript
// GET /api/trash
const trashed = await db.portfolio.findMany({
  where: { userId: user.id, deletedAt: { not: null } },
  orderBy: { deletedAt: "desc" },
  select: {
    id: true,
    title: true,
    slug: true,
    status: true,
    deletedAt: true,
    updatedAt: true,
    _count: { select: { sections: true } },
  },
});
```

**`src/app/api/trash/[id]/restore/route.ts`** — POST restore:

```typescript
// POST /api/trash/:id/restore
await db.portfolio.update({
  where: { id, userId: user.id, deletedAt: { not: null } },
  data: { deletedAt: null },
});
```

**`src/app/api/trash/[id]/route.ts`** — DELETE permanently:

```typescript
// DELETE /api/trash/:id (permanent delete)
await db.portfolio.delete({
  where: { id, userId: user.id, deletedAt: { not: null } },
});
```

**`src/app/api/trash/empty/route.ts`** — POST empty trash:

```typescript
// POST /api/trash/empty
await db.portfolio.deleteMany({
  where: { userId: user.id, deletedAt: { not: null } },
});
```

---

## Phase 2: Trash Page UI

### 2.1 Create `/dashboard/trash` page

**File:** `src/app/dashboard/trash/page.tsx`

**Design:** Follow the same gradient header pattern as other dashboard pages.

- **Header:** Gradient banner with Trash2 icon (red/orange accent), title "Trash", subtitle "Deleted portfolios are kept for 30 days before permanent removal."
- **Empty state:** Large trash icon, "Trash is empty", "Deleted portfolios will appear here."
- **Portfolio list:** Similar to portfolios page rows but with:
  - Portfolio title + status badge
  - "Deleted X days ago" with days remaining ("Y days left")
  - **Restore** button (primary action)
  - **Delete Forever** button (danger, with confirm dialog)
- **Header actions:**
  - "Empty Trash" button (danger, deletes all permanently, with confirm dialog)
- **Skeleton loader:** Shimmer cards matching the list layout

### 2.2 Component structure

```tsx
export default function TrashPage() {
  // Fetch trashed portfolios from /api/trash
  // State: portfolios, loading, restoringId, deletingId
  // Actions: restore(id), permanentDelete(id), emptyTrash()

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Gradient header */}
      {/* Empty state OR portfolio list */}
      {/* Confirm dialogs for permanent delete and empty trash */}
    </div>
  );
}
```

### 2.3 Each trashed portfolio row

```
┌─────────────────────────────────────────────────────────────┐
│ ● Portfolio Title          PUBLISHED   Deleted 3d ago       │
│   4 sections                           27 days left         │
│                                     [Restore] [Delete Forever] │
└─────────────────────────────────────────────────────────────┘
```

- **Days remaining** calculated as: `30 - daysSinceDeleted`
- When < 7 days left, show in red
- Restore button: teal gradient (matches "New Portfolio" style)
- Delete Forever: red outline button with confirm dialog

---

## Phase 3: Navigation + Integration

### 3.1 Add Trash to sidebar navigation

In `src/components/layout/dashboard-layout.tsx`:

Add to `mainNav` array (after Community):
```typescript
{ name: "Trash", href: "/dashboard/trash", icon: Trash2 },
```

Add to `breadcrumbMap`:
```typescript
"/dashboard/trash": "Trash",
```

Import `Trash2` from lucide-react.

### 3.2 Update portfolios page delete flow

In `src/app/dashboard/portfolios/page.tsx`, update the confirm dialog text:

**Before:** "This will permanently delete the portfolio..."
**After:** "This portfolio will be moved to trash. You can restore it within 30 days."

Change confirm button from "Delete" to "Move to Trash".

### 3.3 Update usePortfolioMutations hook

In `src/hooks/use-portfolio.ts`, the `deletePortfolio` function should show a toast saying "Moved to trash" instead of "Deleted" and include an "Undo" action that calls restore.

---

## Phase 4: Auto-cleanup (Optional / Future)

A cron job or scheduled function that permanently deletes portfolios where `deletedAt < now() - 30 days`:

```typescript
await db.portfolio.deleteMany({
  where: {
    deletedAt: { not: null, lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  },
});
```

This can be a Vercel Cron, a daily API route, or manual cleanup. Not required for the initial implementation — the 30-day label is informational, and you can add auto-cleanup later.

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` — add `deletedAt` to Portfolio |
| Modify | `src/app/api/portfolios/[id]/route.ts` — soft delete + filter |
| Modify | `src/app/api/portfolios/route.ts` — filter trashed |
| Modify | `src/app/api/public/[username]/route.ts` — filter trashed |
| Create | `src/app/api/trash/route.ts` — GET trashed |
| Create | `src/app/api/trash/[id]/restore/route.ts` — POST restore |
| Create | `src/app/api/trash/[id]/route.ts` — DELETE permanent |
| Create | `src/app/api/trash/empty/route.ts` — POST empty trash |
| Create | `src/app/dashboard/trash/page.tsx` — trash page UI |
| Modify | `src/components/layout/dashboard-layout.tsx` — add nav item |
| Modify | `src/app/dashboard/portfolios/page.tsx` — update delete confirm text |

---

## Non-Goals

- Trash for individual sections or blocks (only portfolios)
- Version history for trashed items
- Sharing trashed portfolios
- Automated 30-day cleanup (manual for now, add cron later)
