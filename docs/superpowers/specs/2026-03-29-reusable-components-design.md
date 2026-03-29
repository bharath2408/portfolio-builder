# Reusable Component Instances

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Reusable components allow users to create a master block/group/section, save it as a component, and insert linked instances across their portfolio. Instances sync with the master but support per-instance overrides (any property), layer show/hide, and named variants. Similar to Figma's component system.

## Architecture Decisions

- **Scope:** Blocks, groups, AND sections can be components
- **Overrides:** Any property can be overridden per-instance (Figma model)
- **Layer control:** Instances can show/hide individual children
- **Variants:** Named variants with different default property sets
- **UI:** Right-click to create, Add tab + Command Palette to insert, no new panel
- **Storage:** Master data as JSON snapshot on Component model, overrides as dot-path notation on instance block

---

## 1. Database Model

```prisma
model Component {
  id          String   @id @default(cuid())
  userId      String
  portfolioId String
  name        String
  icon        String   @default("Component")
  sourceType  String   // "block" | "group" | "section"
  masterData  Json     // full block/group/section tree snapshot
  variants    Json     // VariantDef[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@unique([portfolioId, name])
  @@index([portfolioId])
}
```

Add `components Component[]` relation to both User and Portfolio models.

---

## 2. Type Definitions

```typescript
interface VariantDef {
  name: string;                        // "Default" | "Dark" | "Compact"
  overrides: Record<string, unknown>;  // dot-path overrides from base master
}

interface ComponentDef {
  id: string;
  userId: string;
  portfolioId: string;
  name: string;
  icon: string;
  sourceType: "block" | "group" | "section";
  masterData: Record<string, unknown>;  // snapshot of block tree
  variants: VariantDef[];
  createdAt: Date;
  updatedAt: Date;
}

// Block content for type "component_instance"
interface ComponentInstanceContent {
  componentId: string;
  variantName: string;
  overrides: Record<string, unknown>;  // dot-path: value
  hiddenLayers: string[];              // child IDs to hide
}
```

---

## 3. Override System

### Dot-path Notation

Overrides track specific changed properties using dot paths:
- `content.text` — text content of the root block
- `styles.backgroundColor` — background color
- `styles.fontSize` — font size
- `children.0.content.text` — text of first child block
- `children.2.styles.color` — color of third child block

### Resolution Order

When rendering an instance:
1. Start with `masterData` (base component)
2. Apply variant overrides (if variant is not "Default")
3. Apply instance overrides (user's per-instance changes)
4. Remove hidden layers from children
5. Render final merged result

### Detecting Overrides

When a user edits an instance property:
- Compare new value against the resolved master+variant value
- If different → store in instance `overrides`
- If same as master → remove from `overrides` (it's not an override anymore)

---

## 4. Variant System

Variants stored on Component as JSON array:

```json
[
  { "name": "Default", "overrides": {} },
  { "name": "Dark", "overrides": { "styles.backgroundColor": "#1a1a2e", "styles.color": "#f0f0f0" } },
  { "name": "Compact", "overrides": { "styles.paddingTop": 12, "styles.paddingBottom": 12, "styles.fontSize": 13 } }
]
```

Every component starts with one "Default" variant (empty overrides). Users add variants via right-click → "Add Variant" on the component in the Add tab.

---

## 5. Component Resolver

Pure function in `src/lib/utils/component-resolver.ts`:

```typescript
function resolveComponentInstance(
  masterData: Record<string, unknown>,
  variant: VariantDef,
  instanceOverrides: Record<string, unknown>,
  hiddenLayers: string[],
): Record<string, unknown>
```

- Deep clones masterData
- Applies variant overrides via dot-path set
- Applies instance overrides via dot-path set
- Filters out children whose IDs are in hiddenLayers
- Returns fully resolved block data ready for rendering

Utility functions needed:
- `getByPath(obj, path)` — get value at dot path
- `setByPath(obj, path, value)` — set value at dot path
- `deepClone(obj)` — structured clone

---

## 6. API Routes

### `GET /api/components?portfolioId=xxx`
List all components for a portfolio. Returns array with name, icon, sourceType, variant count.

### `POST /api/components`
Create component. Body: `{ portfolioId, name, sourceType, masterData }`. Auto-creates "Default" variant. Limit: 50 components per portfolio.

### `GET /api/components/[id]`
Get single component with full masterData and variants.

### `PATCH /api/components/[id]`
Update component. Can update: name, icon, masterData (edit master), variants (add/edit/remove).

### `DELETE /api/components/[id]`
Delete component. Instances on canvas become "orphaned" — they keep their last resolved state but lose the link.

---

## 7. UI Integration

### Creating Components

**Context menu** (right-click on block/group/section):
- "Create Component" option
- Prompts for component name
- Saves master data snapshot
- The original block stays on canvas (becomes the first instance, or stays as a regular block)

### Inserting Instances

**Add tab** — new "My Components" category at the top (before Typography):
- Grid of component cards showing name + source type icon
- Click to insert as `component_instance` block at default position
- Empty state: "Right-click any block and select 'Create Component' to start"

**Command Palette** (Ctrl+K):
- Components appear with prefix: "Insert: My Card", "Insert: Feature Block"
- Search by component name

### Instance Properties (Right Panel)

When a `component_instance` block is selected:

**Header:**
- "Component: {name}" label
- Variant dropdown picker
- "Detach" button (converts to regular blocks, breaks link)
- "Edit Master" button (navigates to master for editing)
- "Reset Overrides" button

**Property editing:**
- Shows the resolved properties (master + variant + overrides merged)
- Editing any value auto-tracks it as an override
- Override indicator: small dot next to overridden properties
- Right-click property label → "Reset to master" (removes that override)

**Layer toggles:**
- For group/section components: list of children with eye icon toggles
- Hidden children are excluded from rendering

### Managing Components

**Right-click on component in Add tab:**
- Rename
- Add Variant (prompts for name, optionally copy from existing variant)
- Delete

**Right-click on instance:**
- Edit Master Component
- Switch Variant → submenu of variant names
- Detach from Component
- Reset All Overrides

---

## 8. Master Editing

When user clicks "Edit Master":
1. Find the Component record
2. Load masterData into a temporary editing state
3. User edits blocks normally
4. On save: update `masterData` on the Component record
5. All instances re-render (they read from master on each render)

For simplicity in v1: "Edit Master" creates a temporary frame on canvas with the master blocks. User edits, clicks "Save Master", blocks are snapshot back to Component. The temporary frame is removed.

---

## 9. Block Registry Entry

```typescript
component_instance: {
  type: "component_instance",
  label: "Component",
  icon: "Component",
  category: "layout",
  description: "Instance of a reusable component",
  defaultContent: { componentId: "", variantName: "Default", overrides: {}, hiddenLayers: [] },
  defaultStyles: { marginBottom: 16 },
}
```

---

## 10. File Structure

### New Files
| File | Purpose |
|------|---------|
| `src/app/api/components/route.ts` | Component list + create |
| `src/app/api/components/[id]/route.ts` | Component get/update/delete |
| `src/lib/utils/component-resolver.ts` | Merge master + variant + overrides → final data |

### Modified Files
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add Component model |
| `src/types/index.ts` | Add ComponentDef, VariantDef, ComponentInstanceContent types |
| `src/config/block-registry.ts` | Add `component_instance` block type |
| `src/components/builder/block-renderer.tsx` | Render component instances with resolver |
| `src/components/builder/builder-workspace.tsx` | Add "My Components" to Add tab, context menu, instance panel |
| `src/config/commands.ts` | Add component-related commands |

---

## 11. Implementation Order

1. **DB + Types** — Component model, migrate, type interfaces
2. **Component resolver** — dot-path utilities + merge function
3. **API routes** — CRUD endpoints
4. **Create component** — context menu handler + save snapshot
5. **Add tab components section** — grid of saved components
6. **Insert instance** — add component_instance block to canvas
7. **Instance rendering** — block-renderer with resolver integration
8. **Instance properties** — right panel with variant picker + override tracking
9. **Layer toggles** — show/hide children per instance
10. **Edit master** — temporary editing mode + save back
11. **Variant management** — add/edit/delete variants via context menu
12. **Command palette** — add component search/insert commands

---

## 12. Limits

- Max 50 components per portfolio
- Max 10 variants per component
- Max 20 children per component (group/section depth)
- Nested component instances not supported in v1 (a component cannot contain another component instance)

---

## 13. Edge Cases

- **Orphaned instances**: If component is deleted, instances keep their last resolved state as static blocks (auto-detach)
- **Circular references**: Not possible since nested instances are disallowed
- **Cross-portfolio**: Components are per-portfolio, not shared across portfolios in v1
- **Undo/redo**: Master edits are tracked in the undo stack like any other change
- **Version mismatch**: If masterData structure changes (field added/removed), resolver handles missing paths gracefully (returns undefined for missing, ignores extra)
