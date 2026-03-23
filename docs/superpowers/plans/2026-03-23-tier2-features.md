# Tier 2 Studio Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 features: section drag reorder, block drag reorder, portfolio duplicate, SEO settings, and custom subdomain support.

**Architecture:** Features 1-2 add DnD to the layers panel using @dnd-kit (already installed). Feature 3 adds a new API endpoint. Feature 4 extends the Prisma schema and adds UI. Feature 5 modifies middleware for subdomain routing.

**Tech Stack:** Next.js 15, React 19, Zustand, Prisma, @dnd-kit/core + @dnd-kit/sortable, Tailwind CSS, Zod

**Spec:** `docs/superpowers/specs/2026-03-23-studio-tier2-features-design.md`

---

## Feature 1: Section Drag Reorder

### Task 1.1: Add DnD to section list in layers panel

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

- [ ] **Step 1: Add DnD imports**

Add at the top of the file:
```typescript
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
```

- [ ] **Step 2: Create SortableSectionItem inline component**

Add above the main `BuilderWorkspace` component (after `LayerBlockItem`):

```tsx
const SortableSectionItem = memo(function SortableSectionItem({
  section,
  isSelected,
  isExpanded,
  blockCount,
  selectedBlockId,
  onSelect,
  onToggle,
  onDelete,
  children,
}: {
  section: SectionWithBlocks;
  isSelected: boolean;
  isExpanded: boolean;
  blockCount: number;
  selectedBlockId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/sec">
      <div
        className="builder-layer-item flex cursor-pointer items-center gap-1.5 px-2 py-[7px]"
        style={{
          backgroundColor: isSelected ? "var(--b-accent-soft)" : "transparent",
          color: isSelected ? "var(--b-accent)" : "var(--b-text-2)",
        }}
        onClick={() => onSelect(section.id)}
      >
        {/* Drag handle */}
        <button
          className="flex h-5 w-5 flex-shrink-0 cursor-grab items-center justify-center rounded active:cursor-grabbing"
          style={{ color: "var(--b-text-4)" }}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(section.id); }}
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
          style={{ color: "var(--b-text-4)" }}
        >
          <ChevronRight
            className="h-3 w-3 transition-transform duration-150"
            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0)" }}
          />
        </button>
        <Layout className="h-3.5 w-3.5 flex-shrink-0" style={{ color: isSelected ? "var(--b-accent)" : "var(--b-text-3)" }} />
        <span className="flex-1 truncate text-[11px] font-semibold">{section.name}</span>
        <span className="flex-shrink-0 text-[9px] font-medium" style={{ color: "var(--b-text-4)" }}>
          {blockCount}
        </span>
        {!section.isVisible && (
          <EyeOff className="h-2.5 w-2.5 flex-shrink-0" style={{ color: "var(--b-text-4)" }} />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(section.id); }}
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover/sec:opacity-40 hover:!opacity-100"
          style={{ color: "var(--b-danger)" }}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>
      {isExpanded && children}
    </div>
  );
});
```

- [ ] **Step 3: Wrap section list with DndContext**

In the layers tab, find the section mapping (`sortedSections.map`). Set up sensors and replace the section rendering:

Inside the component, add sensors:
```typescript
const sectionSensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
);
```

Add the drag end handler:
```typescript
const handleSectionDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
  const newIndex = sortedSections.findIndex((s) => s.id === over.id);
  if (oldIndex === -1 || newIndex === -1) return;
  const newOrder = [...sortedSections];
  const [moved] = newOrder.splice(oldIndex, 1);
  newOrder.splice(newIndex, 0, moved);
  portfolioStore.reorderSections(newOrder.map((s) => s.id));
  builderStore.setDirty(true);
  scheduleAutoSave();
};
```

Wrap the section list:
```tsx
<DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
  <SortableContext items={sortedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
    {sortedSections.map((section) => (
      <SortableSectionItem
        key={section.id}
        section={section}
        isSelected={selectedSectionId === section.id && !selectedBlockId}
        isExpanded={expandedSections.has(section.id)}
        blockCount={section.blocks.length}
        selectedBlockId={selectedBlockId}
        onSelect={selectSection}
        onToggle={toggleSection}
        onDelete={deleteSection}
      >
        {/* block children here */}
      </SortableSectionItem>
    ))}
  </SortableContext>
</DndContext>
```

- [ ] **Step 4: Verify compilation**
Run: `npx tsc --noEmit 2>&1 | head -10`

- [ ] **Step 5: Commit**

---

## Feature 2: Block Drag Reorder

### Task 2.1: Add DnD to block list within sections

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

- [ ] **Step 1: Create SortableBlockItem component**

Update `LayerBlockItem` to use `useSortable`. Add the sortable wrapper:

```tsx
const SortableBlockItem = memo(function SortableBlockItem({
  block, isSelected, onSelect, onDelete,
}: {
  block: BlockWithStyles; isSelected: boolean; onSelect: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <LayerBlockItem
        block={block}
        isSelected={isSelected}
        onSelect={onSelect}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
});
```

Update `LayerBlockItem` to accept and use `dragHandleProps`:
```tsx
const LayerBlockItem = memo(function LayerBlockItem({
  block, isSelected, onSelect, onDelete, dragHandleProps,
}: {
  block: BlockWithStyles; isSelected: boolean; onSelect: () => void; onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  // ... existing code, but change the GripVertical to use dragHandleProps:
  <GripVertical
    className="h-2.5 w-2.5 flex-shrink-0 cursor-grab"
    {...(dragHandleProps ?? {})}
  />
```

- [ ] **Step 2: Wrap block list with SortableContext**

Add a block drag end handler:
```typescript
const handleBlockDragEnd = (sectionId: string) => (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const section = portfolio.sections.find((s) => s.id === sectionId);
  if (!section) return;
  const blocks = [...section.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
  const oldIndex = blocks.findIndex((b) => b.id === active.id);
  const newIndex = blocks.findIndex((b) => b.id === over.id);
  if (oldIndex === -1 || newIndex === -1) return;
  const [moved] = blocks.splice(oldIndex, 1);
  blocks.splice(newIndex, 0, moved);
  portfolioStore.reorderBlocksInSection(sectionId, blocks.map((b) => b.id));
  builderStore.setDirty(true);
  scheduleAutoSave();
};
```

In each section's expanded block area, wrap with:
```tsx
<DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd(section.id)}>
  <SortableContext items={sortedBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
    {sortedBlocks.map((block) => (
      <SortableBlockItem
        key={block.id}
        block={block}
        isSelected={block.id === selectedBlockId}
        onSelect={() => selectBlock(block.id, false)}
        onDelete={() => deleteBlock(block.id, section.id)}
      />
    ))}
  </SortableContext>
</DndContext>
```

- [ ] **Step 3: Verify and commit**

---

## Feature 3: Portfolio Duplicate

### Task 3.1: Create duplicate API endpoint

**Files:**
- Create: `src/app/api/portfolios/[id]/duplicate/route.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import {
  createdResponse,
  unauthorizedResponse,
  conflictResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_PORTFOLIOS_PER_USER } from "@/config/constants";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;

    // Check portfolio limit
    const count = await db.portfolio.count({
      where: { userId: session.user.id },
    });
    if (count >= MAX_PORTFOLIOS_PER_USER) {
      return conflictResponse(`Maximum ${MAX_PORTFOLIOS_PER_USER} portfolios allowed`);
    }

    // Fetch source portfolio with all relations
    const source = await db.portfolio.findFirst({
      where: { id, userId: session.user.id },
      include: {
        sections: {
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
        theme: true,
      },
    });

    if (!source) return notFoundResponse("Portfolio");

    // Generate unique slug
    let slug = `${source.slug}-copy`;
    let counter = 1;
    while (await db.portfolio.findUnique({ where: { userId_slug: { userId: session.user.id, slug } } })) {
      counter++;
      slug = `${source.slug}-copy-${counter}`;
    }

    // Duplicate in a transaction
    const portfolio = await db.$transaction(async (tx) => {
      const p = await tx.portfolio.create({
        data: {
          userId: session.user.id,
          title: `${source.title} (Copy)`,
          slug,
          description: source.description,
          status: "DRAFT",
          isDefault: false,
          seoTitle: source.seoTitle,
          seoDescription: source.seoDescription,
          ogImageUrl: source.ogImageUrl,
          theme: source.theme ? {
            create: {
              mode: source.theme.mode,
              primaryColor: source.theme.primaryColor,
              secondaryColor: source.theme.secondaryColor,
              accentColor: source.theme.accentColor,
              backgroundColor: source.theme.backgroundColor,
              surfaceColor: source.theme.surfaceColor,
              textColor: source.theme.textColor,
              mutedColor: source.theme.mutedColor,
              fontHeading: source.theme.fontHeading,
              fontBody: source.theme.fontBody,
              fontMono: source.theme.fontMono,
              borderRadius: source.theme.borderRadius,
            },
          } : undefined,
        },
      });

      for (const section of source.sections) {
        const s = await tx.section.create({
          data: {
            portfolioId: p.id,
            name: section.name,
            sortOrder: section.sortOrder,
            styles: section.styles as object,
            isVisible: section.isVisible,
            isLocked: section.isLocked,
          },
        });

        if (section.blocks.length > 0) {
          await tx.block.createMany({
            data: section.blocks.map((block) => ({
              sectionId: s.id,
              type: block.type,
              sortOrder: block.sortOrder,
              content: block.content as object,
              styles: block.styles as object,
              isVisible: block.isVisible,
              isLocked: block.isLocked,
            })),
          });
        }
      }

      return tx.portfolio.findUnique({
        where: { id: p.id },
        select: {
          id: true, title: true, slug: true, status: true,
          viewCount: true, updatedAt: true, isDefault: true,
          template: { select: { name: true, thumbnail: true } },
          _count: { select: { sections: true } },
        },
      });
    });

    return createdResponse(portfolio);
  } catch (error) {
    console.error("[POST /api/portfolios/[id]/duplicate]", error);
    return internalErrorResponse();
  }
}
```

Note: This references `seoTitle`, `seoDescription`, `ogImageUrl` fields which will be added in Task 4. If implementing in order, these lines will error until Task 4 is done. Either implement Task 4 first, or temporarily comment out those 3 lines and uncomment after Task 4.

- [ ] **Step 2: Commit**

### Task 3.2: Add duplicate button to portfolios page

**Files:**
- Modify: `src/app/dashboard/portfolios/page.tsx`
- Modify: `src/hooks/use-portfolio.ts`

- [ ] **Step 1: Add duplicatePortfolio to hooks**

In `src/hooks/use-portfolio.ts`, add inside `usePortfolioMutations`:

```typescript
const duplicatePortfolio = useCallback(
  async (id: string) => {
    setError(null);
    try {
      const data = await apiPost<PortfolioListItem>(`/portfolios/${id}/duplicate`, {});
      store.addPortfolio(data);
      return data;
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to duplicate portfolio";
      setError(message);
      throw err;
    }
  },
  [store],
);
```

Add `duplicatePortfolio` to the return object.

- [ ] **Step 2: Add Duplicate button to portfolios page**

In `src/app/dashboard/portfolios/page.tsx`, add `Copy` to lucide imports. Add `duplicatePortfolio` to the destructured hook. Add a duplicate button in the actions area:

```tsx
<button
  onClick={async () => {
    try {
      await duplicatePortfolio(portfolio.id);
    } catch { /* error shown via hook */ }
  }}
  className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
  title="Duplicate"
>
  <Copy className="h-3.5 w-3.5" />
  Duplicate
</button>
```

- [ ] **Step 3: Commit**

---

## Feature 4: SEO Settings

### Task 4.1: Add SEO fields to schema and validation

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/validations/portfolio.ts`

- [ ] **Step 1: Add fields to Portfolio model**

In `prisma/schema.prisma`, add to the Portfolio model (after `viewCount`):

```prisma
seoTitle       String?
seoDescription String?
ogImageUrl     String?
```

- [ ] **Step 2: Push schema**

```bash
npx prisma db push
npx prisma generate
```

- [ ] **Step 3: Add to validation schema**

In `src/lib/validations/portfolio.ts`, add to `updatePortfolioSchema`:

```typescript
seoTitle: z.string().max(60, "SEO title must be under 60 characters").optional().or(z.literal("")),
seoDescription: z.string().max(160, "SEO description must be under 160 characters").optional().or(z.literal("")),
ogImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
```

- [ ] **Step 4: Commit**

### Task 4.2: Add SEO section to studio right panel

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

- [ ] **Step 1: Add SEO editor in the right panel**

In the right panel area, add a new tab option "seo" to the `rightPanel` state type, or add an SEO section within the existing theme editor area. The simplest approach: add an SEO section below the theme editor when `rightPanel === "theme"`.

Create an inline SEO editor component that:
- Fetches current portfolio SEO values from `portfolio.seoTitle`, `portfolio.seoDescription`, `portfolio.ogImageUrl`
- Has three inputs with character counters
- Saves via `apiPatch(`/portfolios/${portfolio.id}`, { seoTitle, seoDescription, ogImageUrl })`
- Shows a Google search preview and OG card preview

- [ ] **Step 2: Commit**

### Task 4.3: Update public page metadata

**Files:**
- Modify: `src/app/portfolio/[username]/[slug]/page.tsx`
- Modify: `src/app/portfolio/[username]/page.tsx`

- [ ] **Step 1: Use SEO fields in generateMetadata**

Update the `generateMetadata` function to prefer SEO fields:

```typescript
const title = portfolio.seoTitle ?? `${portfolio.title} — ${portfolio.user.name ?? username}`;
const description = portfolio.seoDescription ?? portfolio.description ?? `${portfolio.user.name}'s portfolio`;
```

Add OG image if available:
```typescript
openGraph: {
  title,
  description,
  type: "website",
  url: `${APP_URL}/portfolio/${username}/${slug}`,
  siteName: APP_NAME,
  ...(portfolio.ogImageUrl ? { images: [{ url: portfolio.ogImageUrl }] } : {}),
},
```

Apply same changes to both `[slug]/page.tsx` and `[username]/page.tsx`.

- [ ] **Step 2: Update portfolio data query to include SEO fields**

In `getPortfolioData`, the query uses `include` which returns all fields, so `seoTitle`, `seoDescription`, `ogImageUrl` are already included. No query changes needed.

- [ ] **Step 3: Commit**

---

## Feature 5: Custom Subdomain Support

### Task 5.1: Update middleware for subdomain detection

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add subdomain detection and rewrite**

Read the current middleware. Add subdomain logic at the very top of the function, before any other checks:

```typescript
const host = req.headers.get("host") ?? "";
const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";

if (rootDomain && host !== rootDomain && host.endsWith(`.${rootDomain}`)) {
  const subdomain = host.replace(`.${rootDomain}`, "");
  const reserved = ["www", "api", "app", "dashboard", "admin"];

  if (subdomain && !reserved.includes(subdomain)) {
    // Rewrite to portfolio page (URL stays as subdomain)
    return NextResponse.rewrite(new URL(`/portfolio/${subdomain}`, req.url));
  }
}
```

This goes at the very beginning of the middleware function, before the cookie check and route matching.

- [ ] **Step 2: Commit**

### Task 5.2: Show subdomain URL in settings and portfolios

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`
- Modify: `src/app/dashboard/portfolios/page.tsx`

- [ ] **Step 1: Show subdomain in settings**

In the Account section of settings, add after the Role field:

```tsx
{session?.user?.username && process.env.NEXT_PUBLIC_ROOT_DOMAIN && (
  <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6">
    <label className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
      <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />
      Your Site
    </label>
    <div className="flex items-center gap-2">
      <code className="rounded-md bg-muted px-2 py-1 text-[12px]">
        {session.user.username}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN}
      </code>
      <button
        onClick={() => navigator.clipboard.writeText(`https://${session.user.username}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)}
        className="text-[11px] text-muted-foreground hover:text-foreground"
      >
        Copy
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 2: Commit**