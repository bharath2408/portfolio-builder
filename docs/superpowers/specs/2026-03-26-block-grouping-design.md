# Block Grouping (Figma-style) — Design Spec

**Date:** 2026-03-26
**Status:** Draft — to be implemented later

## Summary

Figma-style block grouping: select multiple blocks, group them (Ctrl+G) into a container that moves/resizes as a unit, has its own styles (background, border, padding), and shows as a collapsible node in the layers panel. Ungroup with Ctrl+Shift+G.

## Phases

This is a large feature. Implement in 4 phases, each producing working software.

---

## Phase 1: Data Model + Group Block Type

### Prisma Schema Changes

Add `parentId` to the Block model (self-referential, nullable):

```prisma
model Block {
  id          String   @id @default(cuid())
  sectionId   String
  section     Section  @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  parentId    String?
  parent      Block?   @relation("BlockChildren", fields: [parentId], references: [id], onDelete: Cascade)
  children    Block[]  @relation("BlockChildren")
  type        String
  sortOrder   Int      @default(0)
  isVisible   Boolean  @default(true)
  isLocked    Boolean  @default(false)
  content     Json     @default("{}")
  styles      Json     @default("{}")
  tabletStyles Json    @default("{}")
  mobileStyles Json    @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Block Registry

Register a new `group` block type:

```typescript
group: {
  label: "Group",
  icon: "Group",
  category: "layout",
  defaultContent: {},
  defaultStyles: {
    x: 0,
    y: 0,
    w: 400,
    h: 300,
    backgroundColor: "transparent",
    borderRadius: 0,
    overflow: "visible",
  },
}
```

### TypeScript Types

Update `BlockWithStyles` to include optional children:

```typescript
export type BlockWithStyles = Block & {
  content: Record<string, unknown>;
  styles: BlockStyles;
  tabletStyles: Partial<BlockStyles>;
  mobileStyles: Partial<BlockStyles>;
  children?: BlockWithStyles[];
};
```

### Migration

```bash
npx prisma migrate dev --name add-block-parent-id
```

### API Changes

Update block queries to include children:

```typescript
blocks: {
  where: { parentId: null },  // top-level only
  include: { children: true },
  orderBy: { sortOrder: "asc" },
}
```

---

## Phase 2: Layers Panel Nesting

### Recursive Layer Tree

The layers panel currently renders Section → Blocks (flat). Update to support recursive nesting:

```
├── Section (frame)
│   ├── Block A
│   ├── Group 1 [collapsible] ▶
│   │   ├── Block B
│   │   ├── Block C
│   │   └── Group 2 (nested) [collapsible] ▶
│   │       ├── Block D
│   │       └── Block E
│   └── Block F
```

### Component Changes

- Create a recursive `LayerNode` component that renders a block and its children
- Groups show a collapse/expand chevron
- Groups show a folder/group icon
- Indent children with left border (same pattern as current section → block)
- Drag-and-drop: blocks can be dropped into/out of groups via `@dnd-kit`

### Selection

- Clicking a group selects the group (not its children)
- Double-clicking a group "enters" it (selects children individually)
- Clicking outside the group exits it

---

## Phase 3: Canvas Rendering

### Group as Container on Canvas

A group block renders as a positioned container on the canvas. Its children are positioned relative to the group's top-left corner (same as blocks inside frames).

```tsx
<CanvasElement id={group.id} x={gx} y={gy} w={gw} h={gh} ...>
  {/* Group visual (background, border, etc.) */}
  <div style={{ background, border, borderRadius, padding, overflow }}>
    {group.children.map(child => (
      <CanvasElement key={child.id} ... />
    ))}
  </div>
</CanvasElement>
```

### Coordinate System

- Group has absolute position (x, y) within the frame
- Children have positions relative to the group's top-left
- Moving the group moves all children (children don't update — group position changes)
- Resizing the group does NOT resize children (container resize only)

### Selection Behavior

- Click group → selects group (bounding box around entire group)
- Double-click group → "enters" group, can select individual children
- Press Escape → exits group, back to selecting the group
- Drag group → moves entire group (children follow)
- Drag child inside group → moves child within group bounds

### Group Bounding Box

When a group is selected (not entered), show:
- 8 resize handles on the group boundary
- Dashed border indicating it's a group
- Group label above (like frame label)

---

## Phase 4: Group/Ungroup Commands

### Group (Ctrl+G)

1. Requires 2+ blocks selected in the same section
2. Creates a new `group` block in the section
3. Sets `parentId` on all selected blocks to the new group's ID
4. Group position = bounding box of selected blocks (min x, min y)
5. Group size = bounding box extent (max x+w - min x, max y+h - min y)
6. Children positions adjusted: `child.x -= group.x`, `child.y -= group.y` (now relative to group)
7. Group inherits `sortOrder` of the lowest selected block
8. Push undo snapshot

### Ungroup (Ctrl+Shift+G)

1. Requires a group block selected
2. Reparent all children back to the section (set `parentId = null`)
3. Adjust children positions: `child.x += group.x`, `child.y += group.y` (back to frame-relative)
4. Delete the group block
5. Select all former children
6. Push undo snapshot

### Nested Groups

- Groups can contain other groups (unlimited nesting)
- Ungrouping only ungroups one level (children groups stay grouped)
- Ctrl+G on a selection that includes groups → wraps everything in a new parent group

### Context Menu

Add to block right-click menu:
- **Group Selection** (Ctrl+G) — when 2+ blocks selected
- **Ungroup** (Ctrl+Shift+G) — when a group is selected

### Layers Panel Actions

- Drag block into a group → reparent (set parentId)
- Drag block out of a group → unparent (set parentId = null, adjust coords)

---

## Properties Panel

Groups get their own properties in the panel when selected:

- **Transform:** Position (X/Y), Size (W/H), Rotation, Opacity
- **Appearance:** Background color, Border, Border radius, Shadow
- **Spacing:** Padding (internal padding for children)
- **Layout:** Overflow (visible/hidden)

No typography, no content editor — groups are pure containers.

---

## Non-Goals

- Auto-layout within groups (flex/grid children) — future enhancement
- Group templates/presets
- Cross-section grouping (blocks must be in the same section)
- Group-level animations (apply animations to individual children)

---

## Files to Modify (Estimated)

| Phase | Files |
|-------|-------|
| 1 | `prisma/schema.prisma`, `src/types/index.ts`, `src/config/block-registry.ts`, API routes |
| 2 | `src/components/builder/builder-workspace.tsx` (layers panel), new `LayerNode` component |
| 3 | `src/components/builder/canvas-element.tsx`, `src/components/builder/builder-workspace.tsx` (rendering) |
| 4 | `src/components/builder/builder-workspace.tsx` (commands, shortcuts, context menu) |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+G | Group selected blocks |
| Ctrl+Shift+G | Ungroup selected group |
| Enter / Double-click | Enter group (select children) |
| Escape | Exit group (select group itself) |
