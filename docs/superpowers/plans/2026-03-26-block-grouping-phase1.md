# Block Grouping Phase 1: Data Model + Group Block Type

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `parentId` to the Block model for parent-child relationships, register a `group` block type, and update all API queries/batch save to handle the new field — laying the foundation for Figma-style block grouping.

**Architecture:** Add a nullable self-referential `parentId` field to Block in Prisma, run a migration, update the `BlockWithStyles` type to include optional children, register a `group` block type in the registry, and update the batch save API and all block queries to persist and return `parentId`.

**Tech Stack:** Prisma, PostgreSQL (Neon), Next.js API routes, TypeScript

---

### Task 1: Add parentId to Prisma Block model and migrate

**Files:**
- Modify: `prisma/schema.prisma:154-190`

- [ ] **Step 1: Add parentId field and self-relation to Block model**

In `prisma/schema.prisma`, update the Block model. Add `parentId`, `parent`, and `children` fields after `sectionId` (line 156):

```prisma
model Block {
  id        String  @id @default(cuid())
  sectionId String
  parentId  String?
  type      String
  sortOrder Int     @default(0)
  isVisible Boolean @default(true)
  isLocked  Boolean @default(false)

  content      Json @default("{}")
  styles       Json @default("{}")
  tabletStyles Json @default("{}")
  mobileStyles Json @default("{}")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  section  Section @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  parent   Block?  @relation("BlockChildren", fields: [parentId], references: [id], onDelete: SetNull)
  children Block[] @relation("BlockChildren")

  @@index([sectionId])
  @@index([sectionId, sortOrder])
  @@index([parentId])
  @@map("blocks")
}
```

Key changes:
- `parentId String?` — nullable foreign key to self
- `parent Block?` — optional parent relation
- `children Block[]` — child blocks
- `onDelete: SetNull` — if a group is deleted, children become top-level (not cascaded)
- `@@index([parentId])` — index for efficient child lookups

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add-block-parent-id
```

Expected: Migration succeeds, adds nullable `parentId` column with foreign key to `blocks.id`.

- [ ] **Step 3: Generate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add parentId self-relation to Block model"
```

---

### Task 2: Add GROUP to block types and registry

**Files:**
- Modify: `src/types/index.ts:44-81` (BLOCK_TYPES)
- Modify: `src/config/block-registry.ts`

- [ ] **Step 1: Add GROUP to BLOCK_TYPES**

In `src/types/index.ts`, add `GROUP` to the `BLOCK_TYPES` const after `LINE` (line 80):

```typescript
  LINE: "line",
  GROUP: "group",
} as const;
```

- [ ] **Step 2: Register group in block registry**

In `src/config/block-registry.ts`, add the group entry. Find the last block type entry (should be `line`) and add after it:

```typescript
  // ── Grouping ────────────────────────────────────────────────────
  group: {
    type: "group",
    label: "Group",
    icon: "Group",
    category: "layout",
    description: "Container that groups blocks together",
    defaultContent: {},
    defaultStyles: {
      x: 0,
      y: 0,
      w: 400,
      h: 300,
      backgroundColor: "transparent",
      overflow: "visible",
    },
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/config/block-registry.ts
git commit -m "feat: add group block type to registry"
```

---

### Task 3: Update BlockWithStyles type to support children

**Files:**
- Modify: `src/types/index.ts:250-255`

- [ ] **Step 1: Add parentId and children to BlockWithStyles**

In `src/types/index.ts`, update the `BlockWithStyles` type (lines 250-255):

```typescript
export type BlockWithStyles = Block & {
  content: Record<string, unknown>;
  styles: BlockStyles;
  tabletStyles: Partial<BlockStyles>;
  mobileStyles: Partial<BlockStyles>;
  parentId?: string | null;
  children?: BlockWithStyles[];
};
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add parentId and children to BlockWithStyles"
```

---

### Task 4: Update batch save API to persist parentId

**Files:**
- Modify: `src/app/api/portfolios/[id]/batch/route.ts:18-28` (BatchBlock interface)
- Modify: `src/app/api/portfolios/[id]/batch/route.ts:87-114` (upsert logic)

- [ ] **Step 1: Add parentId to BatchBlock interface**

In `src/app/api/portfolios/[id]/batch/route.ts`, update the `BatchBlock` interface (lines 18-28):

```typescript
interface BatchBlock {
  id: string;
  type: string;
  sortOrder: number;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  tabletStyles?: Record<string, unknown>;
  mobileStyles?: Record<string, unknown>;
  isVisible?: boolean;
  isLocked?: boolean;
  parentId?: string | null;
}
```

- [ ] **Step 2: Add parentId to the block upsert**

In the same file, update the block upsert operation (lines 87-114). Add `parentId` to both `update` and `create`:

```typescript
    for (const block of section.blocks) {
      operations.push(
        db.block.upsert({
          where: { id: block.id },
          update: {
            type: block.type,
            sortOrder: block.sortOrder,
            content: block.content as Prisma.InputJsonValue,
            styles: block.styles as Prisma.InputJsonValue,
            tabletStyles: (block.tabletStyles ?? {}) as Prisma.InputJsonValue,
            mobileStyles: (block.mobileStyles ?? {}) as Prisma.InputJsonValue,
            isVisible: block.isVisible ?? true,
            isLocked: block.isLocked ?? false,
            parentId: block.parentId ?? null,
          },
          create: {
            id: block.id,
            sectionId: section.id,
            type: block.type,
            sortOrder: block.sortOrder,
            content: block.content as Prisma.InputJsonValue,
            styles: block.styles as Prisma.InputJsonValue,
            tabletStyles: (block.tabletStyles ?? {}) as Prisma.InputJsonValue,
            mobileStyles: (block.mobileStyles ?? {}) as Prisma.InputJsonValue,
            isVisible: block.isVisible ?? true,
            isLocked: block.isLocked ?? false,
            parentId: block.parentId ?? null,
          },
        }),
      );
    }
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/portfolios/[id]/batch/route.ts
git commit -m "feat: persist parentId in batch save API"
```

---

### Task 5: Update all block queries to return parentId

**Files:**
- Modify: `src/app/api/portfolios/[id]/route.ts:17`
- Modify: `src/app/api/portfolios/[id]/route.ts:57`
- Modify: `src/app/api/portfolios/[id]/sections/route.ts:17`
- Modify: `src/app/api/portfolios/[id]/sections/[sectionId]/blocks/route.ts:14`
- Modify: `src/app/api/public/[username]/route.ts:34`
- Modify: `src/app/api/portfolios/[id]/duplicate/route.ts:33`
- Modify: `src/app/api/portfolios/[id]/versions/route.ts:39`

Prisma already returns all scalar fields by default (including `parentId` now that it's in the schema). So `parentId` is already returned in query results — no changes needed to the `include` clauses.

However, the duplicate endpoint needs to preserve `parentId` relationships when cloning. Let me check that.

- [ ] **Step 1: Verify parentId is returned by default**

Prisma returns all scalar fields unless `select` is used to restrict them. Since all block queries use `include: { blocks: { orderBy: ... } }` without a `select`, `parentId` is automatically included in the response.

No code changes needed for GET endpoints.

- [ ] **Step 2: Update the duplicate endpoint to remap parentId**

Read `src/app/api/portfolios/[id]/duplicate/route.ts` and check if it clones blocks. If it generates new block IDs, `parentId` values need to be remapped to the new IDs.

Read the file first, then update. The key change: after cloning blocks with new IDs, build an `oldId → newId` map and update `parentId` on children.

This is a deferred concern — duplication of grouped blocks can be handled in Phase 4. For now, cloned blocks will have `parentId: null` which is safe (they just won't be grouped in the duplicate).

- [ ] **Step 3: Commit (if any changes were made)**

```bash
git add -u
git commit -m "feat: ensure parentId flows through API queries"
```

---

### Task 6: Update portfolio store to include parentId in batch save payload

**Files:**
- Modify: `src/stores/portfolio-store.ts` (find the batchSave / serialize function)

- [ ] **Step 1: Find the batch save serialization**

Search `src/stores/portfolio-store.ts` or `src/components/builder/builder-workspace.tsx` for the function that serializes the portfolio state into the batch save payload. It maps sections and blocks into the `BatchPayload` shape.

- [ ] **Step 2: Add parentId to the block serialization**

Wherever blocks are serialized for the batch save payload, add `parentId`:

```typescript
blocks: section.blocks.map((b) => ({
  id: b.id,
  type: b.type,
  sortOrder: b.sortOrder,
  content: b.content,
  styles: b.styles,
  tabletStyles: b.tabletStyles ?? {},
  mobileStyles: b.mobileStyles ?? {},
  isVisible: b.isVisible,
  isLocked: b.isLocked,
  parentId: b.parentId ?? null,
})),
```

The exact location depends on where `batchSave` constructs the payload. Search for `sections.map` near `batchSave` or `handleSave`.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "feat: include parentId in batch save payload"
```

---

### Task 7: TypeScript check and verification

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Verify the migration applied correctly**

```bash
npx prisma db push --accept-data-loss
```

Or if using a dev database:

```bash
npx prisma migrate status
```

Expected: All migrations applied.

- [ ] **Step 3: Verify the app starts**

```bash
npm run dev
```

Open the builder. Existing portfolios should load without errors. No visible UI changes — this phase only adds the data model foundation.

- [ ] **Step 4: Commit any fixes**

```bash
git add -u
git commit -m "fix: phase 1 verification fixes"
```
