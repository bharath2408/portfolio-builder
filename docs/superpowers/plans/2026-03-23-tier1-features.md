# Tier 1 Studio Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 high-impact features: Undo/Redo, Mobile Preview, Import JSON, Portfolio Templates, and Portfolio Analytics.

**Architecture:** Each feature is independent and ships with its own commit. Features modify the Zustand stores, builder workspace, new portfolio page, and API routes. Analytics adds a new Prisma model. All features follow existing patterns (Zustand + Next.js App Router + Prisma).

**Tech Stack:** Next.js 15, React 19, Zustand, Prisma, PostgreSQL, Tailwind CSS, Zod, Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-23-studio-tier1-features-design.md`

---

## Feature 1: Undo/Redo

### Task 1.1: Rewrite builder store undo/redo logic

**Files:**
- Modify: `src/stores/builder-store.ts`
- Modify: `src/stores/portfolio-store.ts`

- [ ] **Step 1: Add `replacePortfolio` to portfolio store**

In `src/stores/portfolio-store.ts`, add to the interface (after line 43):

```typescript
replacePortfolio: (portfolio: PortfolioWithRelations) => void;
```

Add implementation (after `updateTheme`, before `reset` — around line 198):

```typescript
replacePortfolio: (portfolio) =>
  set({ currentPortfolio: portfolio }, false, "replacePortfolio"),
```

- [ ] **Step 2: Rewrite undo/redo in builder store**

In `src/stores/builder-store.ts`, replace the `BuilderSnapshot` interface (lines 40-44) with:

```typescript
interface BuilderSnapshot {
  type: string;
  portfolioState: PortfolioWithRelations;
  timestamp: number;
}
```

Add the import at the top:

```typescript
import type { PortfolioWithRelations } from "@/types";
import { usePortfolioStore } from "@/stores/portfolio-store";
```

Replace the `undo` method (lines 115-126) with:

```typescript
undo: () => {
  const { undoStack, redoStack } = get();
  if (undoStack.length === 0) return null;

  const currentPortfolio = usePortfolioStore.getState().currentPortfolio;
  if (!currentPortfolio) return null;

  const [snapshot, ...rest] = undoStack;

  // Push current state to redo stack
  const currentSnapshot: BuilderSnapshot = {
    type: "undo-save",
    portfolioState: structuredClone(currentPortfolio),
    timestamp: Date.now(),
  };

  set(
    { undoStack: rest, redoStack: [currentSnapshot, ...redoStack] },
    false,
    "undo",
  );

  // Restore the popped state
  usePortfolioStore.getState().replacePortfolio(snapshot.portfolioState);
  return snapshot;
},
```

Replace the `redo` method (lines 128-139) with:

```typescript
redo: () => {
  const { redoStack, undoStack } = get();
  if (redoStack.length === 0) return null;

  const currentPortfolio = usePortfolioStore.getState().currentPortfolio;
  if (!currentPortfolio) return null;

  const [snapshot, ...rest] = redoStack;

  const currentSnapshot: BuilderSnapshot = {
    type: "redo-save",
    portfolioState: structuredClone(currentPortfolio),
    timestamp: Date.now(),
  };

  set(
    { redoStack: rest, undoStack: [currentSnapshot, ...undoStack] },
    false,
    "redo",
  );

  usePortfolioStore.getState().replacePortfolio(snapshot.portfolioState);
  return snapshot;
},
```

Update `pushSnapshot` (lines 104-113) to accept the portfolio and clone it:

```typescript
pushSnapshot: (type: string) => {
  const currentPortfolio = usePortfolioStore.getState().currentPortfolio;
  if (!currentPortfolio) return;

  const snapshot: BuilderSnapshot = {
    type,
    portfolioState: structuredClone(currentPortfolio),
    timestamp: Date.now(),
  };

  set(
    (state) => ({
      undoStack: [snapshot, ...state.undoStack].slice(0, MAX_UNDO_STACK),
      redoStack: [],
      isDirty: true,
    }),
    false,
    "pushSnapshot",
  );
},
```

Update the `pushSnapshot` signature in the interface (line 32) to:

```typescript
pushSnapshot: (type: string) => void;
```

Also update `undo` and `redo` return types to remain `BuilderSnapshot | null`.

- [ ] **Step 3: Verify the store compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: No errors in builder-store.ts or portfolio-store.ts

- [ ] **Step 4: Commit**

```bash
git add src/stores/builder-store.ts src/stores/portfolio-store.ts
git commit -m "feat: rewrite undo/redo with correct state-swap logic"
```

---

### Task 1.2: Wire undo/redo in the workspace

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

- [ ] **Step 1: Add snapshot calls before mutations**

In `builder-workspace.tsx`, find every place that calls a mutation function and add `builderStore.pushSnapshot("description")` before it. The key mutations are:

1. `updateBlock` function (~line 348-358) — add before `portfolioStore.updateBlockInSection`:
```typescript
builderStore.pushSnapshot("update-block");
```

2. `deleteBlock` function (~line 360) — add at the start:
```typescript
builderStore.pushSnapshot("delete-block");
```

3. `addBlock` function (wherever `addBlockToSection` is called) — add before:
```typescript
builderStore.pushSnapshot("add-block");
```

4. `addSection` function — add before `portfolioStore.addSection`:
```typescript
builderStore.pushSnapshot("add-section");
```

5. `deleteSection` function — add at the start:
```typescript
builderStore.pushSnapshot("delete-section");
```

6. `duplicateBlock` — add before the duplicate call:
```typescript
builderStore.pushSnapshot("duplicate-block");
```

7. `onToggleVisibility` and `onToggleLock` handlers — add before each:
```typescript
builderStore.pushSnapshot("toggle-visibility");
builderStore.pushSnapshot("toggle-lock");
```

- [ ] **Step 2: Wire undo/redo toolbar buttons**

Find the existing undo/redo buttons in the toolbar (they use `Undo2` and `Redo2` icons). Update their `onClick` handlers and disabled states:

```tsx
<button
  onClick={() => {
    const result = builderStore.undo();
    if (result) builderStore.setDirty(true);
  }}
  disabled={builderStore.undoStack.length === 0}
  className="builder-toolbar-btn ..."
  title="Undo (Ctrl+Z)"
>
  <Undo2 className="h-3.5 w-3.5" />
</button>
<button
  onClick={() => {
    const result = builderStore.redo();
    if (result) builderStore.setDirty(true);
  }}
  disabled={builderStore.redoStack.length === 0}
  className="builder-toolbar-btn ..."
  title="Redo (Ctrl+Shift+Z)"
>
  <Redo2 className="h-3.5 w-3.5" />
</button>
```

- [ ] **Step 3: Add keyboard shortcuts**

Find the existing keyboard handler `useEffect` in the workspace (the one handling Ctrl+S, Ctrl+E, etc.). Add:

```typescript
// Ctrl+Z — Undo
if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
  e.preventDefault();
  const result = builderStore.undo();
  if (result) builderStore.setDirty(true);
  return;
}
// Ctrl+Shift+Z — Redo
if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
  e.preventDefault();
  const result = builderStore.redo();
  if (result) builderStore.setDirty(true);
  return;
}
```

- [ ] **Step 4: Test manually**

Run: `npm run dev`
1. Open a portfolio in the studio
2. Add a block — verify undo button becomes enabled
3. Press Ctrl+Z — block should disappear
4. Press Ctrl+Shift+Z — block should reappear
5. Make several changes, undo multiple times, verify state is correct

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/builder-workspace.tsx
git commit -m "feat: wire undo/redo buttons and keyboard shortcuts in studio"
```

---

## Feature 2: Mobile/Tablet Preview

### Task 2.1: Add device preview state to builder store

**Files:**
- Modify: `src/stores/builder-store.ts`

- [ ] **Step 1: Add device preview state**

Add to `BuilderState` interface (after `activeRightTab` line ~15):

```typescript
devicePreview: "desktop" | "tablet" | "mobile";
```

Add action to interface:

```typescript
setDevicePreview: (device: "desktop" | "tablet" | "mobile") => void;
```

Add to `initialState`:

```typescript
devicePreview: "desktop" as const,
```

Add implementation:

```typescript
setDevicePreview: (device) =>
  set({ devicePreview: device }, false, "setDevicePreview"),
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/builder-store.ts
git commit -m "feat: add device preview state to builder store"
```

---

### Task 2.2: Add device preview toggle and canvas constraint

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

- [ ] **Step 1: Add device toggle to toolbar**

Import `Monitor, Tablet, Smartphone` from lucide-react (some may already be imported).

In the toolbar right section, between the zoom controls and the light/dark toggle, add:

```tsx
{/* Device preview toggle */}
<div
  className="flex items-center gap-0.5 rounded-lg p-0.5"
  style={{ backgroundColor: "var(--b-surface)" }}
>
  {([
    { id: "desktop" as const, icon: <Monitor className="h-3.5 w-3.5" />, title: "Desktop" },
    { id: "tablet" as const, icon: <Tablet className="h-3.5 w-3.5" />, title: "Tablet (768px)" },
    { id: "mobile" as const, icon: <Smartphone className="h-3.5 w-3.5" />, title: "Mobile (375px)" },
  ]).map((device) => (
    <button
      key={device.id}
      onClick={() => builderStore.setDevicePreview(device.id)}
      className="flex h-7 w-7 items-center justify-center rounded-md transition-all"
      style={{
        backgroundColor: builderStore.devicePreview === device.id ? "var(--b-accent-soft)" : "transparent",
        color: builderStore.devicePreview === device.id ? "var(--b-accent)" : "var(--b-text-3)",
      }}
      title={device.title}
    >
      {device.icon}
    </button>
  ))}
</div>
<div className="mx-1 h-4 w-px" style={{ backgroundColor: "var(--b-border)" }} />
```

- [ ] **Step 2: Wrap canvas children with viewport constraint**

Find the `<CanvasEngine>` component rendering. Wrap its children in a constraining div:

```tsx
const deviceWidths = { desktop: undefined, tablet: 768, mobile: 375 };
const previewWidth = deviceWidths[builderStore.devicePreview];
```

Then around the canvas content (the sections being rendered inside CanvasEngine), wrap with:

```tsx
<div
  style={{
    width: previewWidth ? `${previewWidth}px` : "100%",
    margin: previewWidth ? "0 auto" : undefined,
    border: previewWidth ? "1px solid var(--b-border)" : "none",
    borderRadius: previewWidth ? "12px" : undefined,
    boxShadow: previewWidth ? "0 4px 24px rgba(0,0,0,0.15)" : "none",
    transition: "width 0.3s ease, box-shadow 0.3s ease",
    overflow: previewWidth ? "hidden" : undefined,
    position: "relative",
  }}
>
  {/* existing section frames here */}
</div>
```

- [ ] **Step 3: Test manually**

Run: `npm run dev`
1. Open studio, click Tablet icon — canvas should narrow to 768px with a border
2. Click Mobile — narrows to 375px
3. Click Desktop — returns to full width
4. Verify blocks are still selectable/editable in all modes

- [ ] **Step 4: Commit**

```bash
git add src/components/builder/builder-workspace.tsx
git commit -m "feat: add mobile/tablet/desktop preview toggle in studio"
```

---

## Feature 3: Import JSON

### Task 3.1: Create import validation schema

**Files:**
- Create: `src/lib/validations/import.ts`

- [ ] **Step 1: Create the validation schema**

```typescript
import { z } from "zod";

const blockSchema = z.object({
  type: z.string().min(1),
  sortOrder: z.number().int().min(0).optional().default(0),
  content: z.record(z.unknown()).default({}),
  styles: z.record(z.unknown()).default({}),
  isVisible: z.boolean().optional().default(true),
  isLocked: z.boolean().optional().default(false),
});

const sectionSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).optional().default(0),
  styles: z.record(z.unknown()).default({}),
  isVisible: z.boolean().optional().default(true),
  isLocked: z.boolean().optional().default(false),
  blocks: z.array(blockSchema).default([]),
});

const themeSchema = z.object({
  mode: z.enum(["LIGHT", "DARK", "CUSTOM"]).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  surfaceColor: z.string().optional(),
  textColor: z.string().optional(),
  mutedColor: z.string().optional(),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  fontMono: z.string().optional(),
  borderRadius: z.string().optional(),
}).optional();

export const importPortfolioSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().max(300).optional().default(""),
  theme: themeSchema,
  sections: z.array(sectionSchema).min(0).max(30),
});

export type ImportPortfolioData = z.infer<typeof importPortfolioSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/import.ts
git commit -m "feat: add Zod validation schema for portfolio import"
```

---

### Task 3.2: Extend portfolio creation API for import

**Files:**
- Modify: `src/app/api/portfolios/route.ts`

- [ ] **Step 1: Add import handling to POST route**

Add import at top:

```typescript
import { importPortfolioSchema } from "@/lib/validations/import";
```

In the `POST` function, after slug uniqueness check (after line 73), before the `db.portfolio.create` call, add:

```typescript
// ── Import mode ──────────────────────────────────────────────
if (body.importData) {
  const importParsed = importPortfolioSchema.safeParse(body.importData);
  if (!importParsed.success) return validationErrorResponse(importParsed.error);

  const importData = importParsed.data;

  const portfolio = await db.$transaction(async (tx) => {
    const p = await tx.portfolio.create({
      data: {
        userId: session.user.id,
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description ?? importData.description,
        isDefault: isFirst,
        theme: {
          create: {
            mode: importData.theme?.mode ?? "DARK",
            primaryColor: importData.theme?.primaryColor ?? "#6366f1",
            secondaryColor: importData.theme?.secondaryColor ?? "#8b5cf6",
            accentColor: importData.theme?.accentColor ?? "#06b6d4",
            backgroundColor: importData.theme?.backgroundColor ?? "#0f172a",
            textColor: importData.theme?.textColor ?? "#f8fafc",
            fontHeading: importData.theme?.fontHeading ?? "Outfit",
            fontBody: importData.theme?.fontBody ?? "DM Sans",
            borderRadius: importData.theme?.borderRadius ?? "0.5rem",
          },
        },
      },
    });

    // Create sections and blocks
    for (const section of importData.sections) {
      const s = await tx.section.create({
        data: {
          portfolioId: p.id,
          name: section.name,
          sortOrder: section.sortOrder ?? 0,
          styles: section.styles as object,
          isVisible: section.isVisible ?? true,
          isLocked: section.isLocked ?? false,
        },
      });

      if (section.blocks.length > 0) {
        await tx.block.createMany({
          data: section.blocks.map((block) => ({
            sectionId: s.id,
            type: block.type,
            sortOrder: block.sortOrder ?? 0,
            content: block.content as object,
            styles: block.styles as object,
            isVisible: block.isVisible ?? true,
            isLocked: block.isLocked ?? false,
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
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/portfolios/route.ts
git commit -m "feat: add import mode to portfolio creation API"
```

---

### Task 3.3: Add import UI to new portfolio page

**Files:**
- Modify: `src/app/dashboard/portfolios/new/page.tsx`

- [ ] **Step 1: Add import tab and file upload**

Add a `mode` state at the top of the component:

```typescript
const [mode, setMode] = useState<"create" | "import">("create");
const [importData, setImportData] = useState<Record<string, unknown> | null>(null);
const [importError, setImportError] = useState<string | null>(null);
```

Add a file handler:

```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setImportError(null);

  if (file.size > 2 * 1024 * 1024) {
    setImportError("File is too large. Maximum size is 2MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const json = JSON.parse(ev.target?.result as string);
      if (!json.title || !json.sections) {
        setImportError("Invalid portfolio JSON. Must have 'title' and 'sections'.");
        return;
      }
      setImportData(json);
      // Pre-fill form from imported data
      if (json.title) {
        setValue("title", json.title);
        setValue("slug", slugify(json.title));
      }
    } catch {
      setImportError("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
};
```

Add mode toggle buttons above the form:

```tsx
<div className="flex gap-2 mb-6">
  <button
    type="button"
    onClick={() => { setMode("create"); setImportData(null); }}
    className={cn("flex-1 rounded-lg border-2 p-3 text-center text-[13px] font-semibold transition-all",
      mode === "create" ? "border-teal-500 bg-teal-500/[0.04]" : "border-border/50 hover:border-border")}
  >
    Create New
  </button>
  <button
    type="button"
    onClick={() => setMode("import")}
    className={cn("flex-1 rounded-lg border-2 p-3 text-center text-[13px] font-semibold transition-all",
      mode === "import" ? "border-teal-500 bg-teal-500/[0.04]" : "border-border/50 hover:border-border")}
  >
    Import JSON
  </button>
</div>
```

When `mode === "import"`, show a file upload zone before the form fields:

```tsx
{mode === "import" && !importData && (
  <div className="mb-6 rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
    <Upload className="mx-auto h-8 w-8 text-muted-foreground/40" />
    <p className="mt-2 text-[13px] text-muted-foreground">Drop a .json file or click to browse</p>
    <input type="file" accept=".json" onChange={handleFileUpload} className="absolute inset-0 cursor-pointer opacity-0" />
    {importError && <p className="mt-2 text-[12px] text-red-500">{importError}</p>}
  </div>
)}
{mode === "import" && importData && (
  <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
    <p className="text-[13px] font-medium text-emerald-600">File loaded: {(importData as { title?: string }).title}</p>
    <p className="text-[11px] text-muted-foreground">{((importData as { sections?: unknown[] }).sections ?? []).length} sections</p>
  </div>
)}
```

Update the `onSubmit` to pass `importData`:

```typescript
const onSubmit = async (data: CreatePortfolioInput) => {
  setError(null);
  try {
    const payload = mode === "import" && importData
      ? { ...data, importData }
      : data;
    const portfolio = await createPortfolio(payload);
    router.push(`/dashboard/portfolios/${portfolio.id}/edit`);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to create portfolio");
  }
};
```

Import `Upload` from lucide-react.

- [ ] **Step 2: Update `usePortfolioMutations` to pass importData**

In `src/hooks/use-portfolio.ts`, update the `createPortfolio` callback type to accept the extended payload:

```typescript
const createPortfolio = useCallback(
  async (input: CreatePortfolioInput & { importData?: Record<string, unknown> }) => {
```

The `apiPost` call already passes the full `input` object to the API.

- [ ] **Step 3: Test manually**

Run: `npm run dev`
1. Open an existing portfolio in studio, press Ctrl+E to export JSON
2. Go to New Portfolio page, click "Import JSON"
3. Upload the exported file
4. Verify title pre-fills, section count shows
5. Click "Create & Open Studio" — should create portfolio with all sections/blocks

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/portfolios/new/page.tsx src/hooks/use-portfolio.ts
git commit -m "feat: add import JSON option to new portfolio page"
```

---

## Feature 4: Portfolio Templates

### Task 4.1: Create templates API endpoint

**Files:**
- Create: `src/app/api/templates/route.ts`

- [ ] **Step 1: Create the GET endpoint**

```typescript
import { successResponse, internalErrorResponse } from "@/lib/api/response";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const templates = await db.template.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        config: true,
        isPremium: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(templates);
  } catch (error) {
    console.error("[GET /api/templates]", error);
    return internalErrorResponse();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/templates/route.ts
git commit -m "feat: add GET /api/templates endpoint"
```

---

### Task 4.2: Add template-based creation to portfolio API

**Files:**
- Modify: `src/app/api/portfolios/route.ts`

- [ ] **Step 1: Add template handling before the import handling block**

In the `POST` function, after the slug uniqueness check and before the `importData` check, add:

```typescript
// ── Template mode ────────────────────────────────────────────
if (parsed.data.templateId) {
  const template = await db.template.findUnique({
    where: { id: parsed.data.templateId, isActive: true },
  });

  if (!template) {
    return conflictResponse("Template not found");
  }

  const config = template.config as {
    theme?: Record<string, string>;
    sections?: Array<{
      name: string;
      sortOrder?: number;
      styles?: object;
      blocks?: Array<{ type: string; sortOrder?: number; content?: object; styles?: object }>;
    }>;
  };

  const portfolio = await db.$transaction(async (tx) => {
    const p = await tx.portfolio.create({
      data: {
        userId: session.user.id,
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        templateId: template.id,
        isDefault: isFirst,
        theme: {
          create: {
            mode: (config.theme?.mode as "LIGHT" | "DARK" | "CUSTOM") ?? "DARK",
            primaryColor: config.theme?.primaryColor ?? "#6366f1",
            secondaryColor: config.theme?.secondaryColor ?? "#8b5cf6",
            accentColor: config.theme?.accentColor ?? "#06b6d4",
            backgroundColor: config.theme?.backgroundColor ?? "#0f172a",
            textColor: config.theme?.textColor ?? "#f8fafc",
            fontHeading: config.theme?.fontHeading ?? "Outfit",
            fontBody: config.theme?.fontBody ?? "DM Sans",
            borderRadius: config.theme?.borderRadius ?? "0.5rem",
          },
        },
      },
    });

    for (const section of config.sections ?? []) {
      const s = await tx.section.create({
        data: {
          portfolioId: p.id,
          name: section.name,
          sortOrder: section.sortOrder ?? 0,
          styles: (section.styles ?? {}) as object,
        },
      });

      const blocks = section.blocks ?? [];
      if (blocks.length > 0) {
        await tx.block.createMany({
          data: blocks.map((block) => ({
            sectionId: s.id,
            type: block.type,
            sortOrder: block.sortOrder ?? 0,
            content: (block.content ?? {}) as object,
            styles: (block.styles ?? {}) as object,
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
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/portfolios/route.ts
git commit -m "feat: add template-based portfolio creation to API"
```

---

### Task 4.3: Update seed script with template configs

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Update existing templates with full configs**

Find the template creation section in `prisma/seed.ts` and replace the empty `config: {}` objects with full template configurations. Create at least 3 templates: "Developer", "Designer", "Minimal". Each should have 4-5 sections (Hero, About, Skills, Projects, Contact) with blocks containing realistic placeholder content.

Example for the Developer template config:

```typescript
{
  theme: {
    mode: "DARK",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
    backgroundColor: "#0f172a",
    textColor: "#f8fafc",
    fontHeading: "Outfit",
    fontBody: "DM Sans",
    borderRadius: "0.5rem",
  },
  sections: [
    {
      name: "Hero",
      sortOrder: 0,
      styles: { layout: "centered", padding: "lg", minHeight: "80vh" },
      blocks: [
        { type: "heading", sortOrder: 0, content: { text: "Hi, I'm a Developer", level: 1 }, styles: { fontSize: 48, fontWeight: 700, textAlign: "center" } },
        { type: "text", sortOrder: 1, content: { text: "Full-stack developer passionate about building great products" }, styles: { fontSize: 18, textAlign: "center", opacity: 0.7, maxWidth: "600px" } },
        { type: "button", sortOrder: 2, content: { text: "View My Work", url: "#projects", variant: "solid", size: "lg" }, styles: { textAlign: "center" } },
      ],
    },
    {
      name: "About",
      sortOrder: 1,
      styles: { layout: "centered", padding: "lg" },
      blocks: [
        { type: "heading", sortOrder: 0, content: { text: "About Me", level: 2 }, styles: { fontSize: 32, fontWeight: 700 } },
        { type: "text", sortOrder: 1, content: { text: "Write about yourself, your experience, and what drives you." }, styles: { fontSize: 16, lineHeight: 1.7, opacity: 0.8 } },
      ],
    },
    {
      name: "Skills",
      sortOrder: 2,
      styles: { layout: "centered", padding: "lg" },
      blocks: [
        { type: "heading", sortOrder: 0, content: { text: "Skills", level: 2 }, styles: { fontSize: 32, fontWeight: 700 } },
        { type: "skill_bar", sortOrder: 1, content: { name: "JavaScript", level: 90, showPercentage: true }, styles: {} },
        { type: "skill_bar", sortOrder: 2, content: { name: "React", level: 85, showPercentage: true }, styles: {} },
        { type: "skill_bar", sortOrder: 3, content: { name: "Node.js", level: 80, showPercentage: true }, styles: {} },
      ],
    },
    {
      name: "Projects",
      sortOrder: 3,
      styles: { layout: "centered", padding: "lg" },
      blocks: [
        { type: "heading", sortOrder: 0, content: { text: "Projects", level: 2 }, styles: { fontSize: 32, fontWeight: 700 } },
        { type: "project_card", sortOrder: 1, content: { title: "Project One", description: "A brief description of your project.", techStack: ["React", "Node.js"], liveUrl: "", repoUrl: "" }, styles: {} },
      ],
    },
    {
      name: "Contact",
      sortOrder: 4,
      styles: { layout: "centered", padding: "lg" },
      blocks: [
        { type: "heading", sortOrder: 0, content: { text: "Get In Touch", level: 2 }, styles: { fontSize: 32, fontWeight: 700 } },
        { type: "contact_form", sortOrder: 1, content: { fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "email", label: "Email", type: "email", required: true }, { name: "message", label: "Message", type: "textarea", required: true }], submitText: "Send Message" }, styles: {} },
      ],
    },
  ],
}
```

Create similar configs for "Designer" (more visual, with image blocks and testimonials) and "Minimal" (fewer sections, clean).

- [ ] **Step 2: Run the seed**

```bash
npx prisma db seed
```

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add full template configs to seed script"
```

---

### Task 4.4: Add template gallery to new portfolio page

**Files:**
- Modify: `src/app/dashboard/portfolios/new/page.tsx`

- [ ] **Step 1: Fetch templates and add gallery**

Add template fetching state:

```typescript
const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string | null; thumbnail: string | null }>>([]);
const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

useEffect(() => {
  apiGet<Array<{ id: string; name: string; description: string | null; thumbnail: string | null }>>("/templates")
    .then(setTemplates)
    .catch(() => {});
}, []);
```

Add the template gallery before the form, extending the existing mode toggle to include 3 options: "Template" | "Blank" | "Import":

```tsx
{mode === "create" && templates.length > 0 && (
  <div className="mb-6">
    <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">Start from a template</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <button
        type="button"
        onClick={() => setSelectedTemplate(null)}
        className={cn("rounded-xl border-2 p-4 text-left transition-all",
          !selectedTemplate ? "border-teal-500 bg-teal-500/[0.04]" : "border-border/50 hover:border-border")}
      >
        <Plus className="mb-2 h-5 w-5 text-muted-foreground/40" />
        <p className="text-[13px] font-semibold text-foreground">Blank</p>
        <p className="text-[11px] text-muted-foreground/60">Start from scratch</p>
      </button>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setSelectedTemplate(t.id)}
          className={cn("rounded-xl border-2 p-4 text-left transition-all",
            selectedTemplate === t.id ? "border-teal-500 bg-teal-500/[0.04]" : "border-border/50 hover:border-border")}
        >
          <Sparkles className="mb-2 h-5 w-5 text-teal-500" />
          <p className="text-[13px] font-semibold text-foreground">{t.name}</p>
          <p className="text-[11px] text-muted-foreground/60">{t.description}</p>
        </button>
      ))}
    </div>
  </div>
)}
```

Update `onSubmit` to include `templateId`:

```typescript
const payload = mode === "import" && importData
  ? { ...data, importData }
  : selectedTemplate
    ? { ...data, templateId: selectedTemplate }
    : data;
```

Import `apiGet` from `@/lib/api`.

- [ ] **Step 2: Test manually**

Run: `npm run dev`
1. Go to New Portfolio, verify template cards appear
2. Select a template, fill in title, submit
3. Verify studio opens with pre-populated sections/blocks

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/portfolios/new/page.tsx
git commit -m "feat: add template gallery to new portfolio page"
```

---

## Feature 5: Portfolio Analytics

### Task 5.1: Add PortfolioView model to database

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the PortfolioView model**

Add at the end of the schema, before the `Template` model:

```prisma
model PortfolioView {
  id          String   @id @default(cuid())
  portfolioId String
  viewedAt    DateTime @default(now())
  referrer    String?
  deviceType  String?

  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@index([portfolioId])
  @@index([portfolioId, viewedAt])
  @@map("portfolio_views")
}
```

Add `views PortfolioView[]` to the Portfolio model's relations (alongside `sections`, `theme`).

- [ ] **Step 2: Push schema changes**

```bash
npx prisma db push
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add PortfolioView model for analytics tracking"
```

---

### Task 5.2: Update public portfolio page to track views

**Files:**
- Modify: `src/app/portfolio/[username]/[slug]/page.tsx`

- [ ] **Step 1: Fix double-count bug and add view tracking**

Separate the data-fetching from the view tracking. The `getPortfolioBySlug` function should NOT increment views. Instead, create a separate function:

```typescript
async function getPortfolioData(
  username: string,
  slug: string,
): Promise<PortfolioWithRelations | null> {
  const user = await db.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) return null;

  const portfolio = await db.portfolio.findFirst({
    where: { userId: user.id, slug, status: "PUBLISHED" },
    include: {
      sections: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        include: { blocks: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
      },
      theme: true,
      template: true,
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  return portfolio as PortfolioWithRelations | null;
}

function parseDeviceType(userAgent: string | null): string {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/mobile|iphone|android.*mobile/.test(ua)) return "mobile";
  if (/tablet|ipad|android(?!.*mobile)/.test(ua)) return "tablet";
  return "desktop";
}

function parseReferrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname;
  } catch {
    return null;
  }
}

async function trackView(portfolioId: string, headers: Headers) {
  const userAgent = headers.get("user-agent");
  const referrer = headers.get("referer");

  // Fire-and-forget
  Promise.all([
    db.portfolioView.create({
      data: {
        portfolioId,
        deviceType: parseDeviceType(userAgent),
        referrer: parseReferrerHost(referrer),
      },
    }),
    db.portfolio.update({
      where: { id: portfolioId },
      data: { viewCount: { increment: 1 } },
    }),
  ]).catch(() => {});
}
```

Update `generateMetadata` to use `getPortfolioData` (no view tracking).

Update the page component to use `getPortfolioData` AND call `trackView`:

```typescript
export default async function PortfolioBySlugPage({ params }: Props) {
  const { username, slug } = await params;
  const portfolio = await getPortfolioData(username, slug);
  if (!portfolio) notFound();

  // Track view (fire-and-forget, only in page component)
  trackView(portfolio.id, new Headers());

  return <PortfolioRenderer portfolio={portfolio} />;
}
```

Note: To get request headers in a server component, import `headers` from `next/headers`:

```typescript
import { headers } from "next/headers";
```

And use:

```typescript
const headersList = await headers();
trackView(portfolio.id, headersList);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/portfolio/[username]/[slug]/page.tsx
git commit -m "feat: add PortfolioView tracking, fix double-count bug"
```

---

### Task 5.3: Create analytics API endpoint

**Files:**
- Create: `src/app/api/portfolios/[id]/analytics/route.ts`

- [ ] **Step 1: Create the analytics endpoint**

```typescript
import { successResponse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;

    // Verify ownership
    const portfolio = await db.portfolio.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true, viewCount: true },
    });
    if (!portfolio) return unauthorizedResponse();

    const url = new URL(request.url);
    const range = parseInt(url.searchParams.get("range") ?? "30", 10);
    const since = new Date();
    since.setDate(since.getDate() - range);

    const [periodViews, dailyViews, referrers, devices] = await Promise.all([
      // Period total
      db.portfolioView.count({
        where: { portfolioId: id, viewedAt: { gte: since } },
      }),
      // Daily breakdown
      db.$queryRaw<Array<{ date: string; views: bigint }>>`
        SELECT DATE("viewedAt") as date, COUNT(*) as views
        FROM portfolio_views
        WHERE "portfolioId" = ${id} AND "viewedAt" >= ${since}
        GROUP BY DATE("viewedAt")
        ORDER BY date ASC
      `,
      // Top referrers
      db.$queryRaw<Array<{ source: string; count: bigint }>>`
        SELECT referrer as source, COUNT(*) as count
        FROM portfolio_views
        WHERE "portfolioId" = ${id} AND "viewedAt" >= ${since} AND referrer IS NOT NULL
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
      `,
      // Device breakdown
      db.$queryRaw<Array<{ device: string; count: bigint }>>`
        SELECT "deviceType" as device, COUNT(*) as count
        FROM portfolio_views
        WHERE "portfolioId" = ${id} AND "viewedAt" >= ${since} AND "deviceType" IS NOT NULL
        GROUP BY "deviceType"
      `,
    ]);

    return successResponse({
      total: portfolio.viewCount,
      period: { views: periodViews, range: `${range}d` },
      daily: dailyViews.map((d) => ({ date: d.date, views: Number(d.views) })),
      referrers: referrers.map((r) => ({ source: r.source, count: Number(r.count) })),
      devices: Object.fromEntries(devices.map((d) => [d.device, Number(d.count)])),
    });
  } catch (error) {
    console.error("[GET /api/portfolios/[id]/analytics]", error);
    return internalErrorResponse();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/portfolios/[id]/analytics/route.ts
git commit -m "feat: add analytics API endpoint with daily/referrer/device aggregation"
```

---

### Task 5.4: Create SVG line chart component

**Files:**
- Create: `src/components/common/svg-line-chart.tsx`

- [ ] **Step 1: Create a minimal SVG line chart**

```tsx
"use client";

interface DataPoint {
  label: string;
  value: number;
}

interface SvgLineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

export function SvgLineChart({ data, height = 200, color = "hsl(var(--primary))" }: SvgLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border/50 bg-card" style={{ height }}>
        <p className="text-[12px] text-muted-foreground/50">No data yet</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - (d.value / maxValue) * chartHeight,
    ...d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Y-axis labels (4 ticks)
  const yTicks = Array.from({ length: 4 }, (_, i) => {
    const value = Math.round((maxValue / 3) * i);
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return { value, y };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y}
            stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" opacity={0.5}
          />
          <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))" opacity={0.5}>
            {tick.value}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaD} fill={color} opacity={0.08} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}

      {/* X-axis labels (show every few) */}
      {points.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((p, i) => (
        <text key={i} x={p.x} y={height - 8} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))" opacity={0.5}>
          {p.label}
        </text>
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/svg-line-chart.tsx
git commit -m "feat: add minimal SVG line chart component"
```

---

### Task 5.5: Create analytics dashboard page

**Files:**
- Create: `src/app/dashboard/portfolios/[id]/analytics/page.tsx`
- Create: `src/app/dashboard/portfolios/[id]/analytics/loading.tsx`

- [ ] **Step 1: Create the analytics page**

```tsx
"use client";

import { ArrowLeft, BarChart3, Eye, Globe, Monitor, Smartphone, Tablet, TrendingUp } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { SvgLineChart } from "@/components/common/svg-line-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  total: number;
  period: { views: number; range: string };
  daily: Array<{ date: string; views: number }>;
  referrers: Array<{ source: string; count: number }>;
  devices: Record<string, number>;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function AnalyticsPage({ params }: Props) {
  const { id } = use(params);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    setLoading(true);
    apiGet<AnalyticsData>(`/portfolios/${id}/analytics?range=${range}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, range]);

  const dailyAvg = data ? Math.round(data.period.views / range) : 0;
  const topReferrer = data?.referrers[0]?.source ?? "Direct";
  const totalDevices = data ? Object.values(data.devices).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/portfolios"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-[20px] font-bold text-foreground">Analytics</h1>
            <p className="text-[12px] text-muted-foreground/60">Portfolio performance overview</p>
          </div>
        </div>

        {/* Range selector */}
        <div className="flex gap-1 rounded-lg border border-border/50 p-1">
          {[7, 30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3 py-1 text-[11px] font-semibold transition-all",
                range === r
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-14" />
              <Skeleton className="mt-1 h-3 w-28" />
            </div>
          ))
        ) : (
          <>
            <StatCard icon={<Eye className="h-4 w-4" />} label="Total Views" value={data?.total ?? 0} sub="All time" color="teal" />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Period Views" value={data?.period.views ?? 0} sub={`Last ${range} days`} color="cyan" />
            <StatCard icon={<BarChart3 className="h-4 w-4" />} label="Daily Average" value={dailyAvg} sub={`Over ${range} days`} color="violet" />
            <StatCard icon={<Globe className="h-4 w-4" />} label="Top Source" value={topReferrer} sub="Most visitors from" color="emerald" isText />
          </>
        )}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">
          Views Over Time
        </h2>
        {loading ? (
          <Skeleton className="h-[200px] w-full rounded-lg" />
        ) : (
          <SvgLineChart
            data={(data?.daily ?? []).map((d) => ({
              label: new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
              value: d.views,
            }))}
          />
        )}
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referrers */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">
            Top Referrers
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : (data?.referrers ?? []).length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground/50">No referrer data yet</p>
          ) : (
            <div className="space-y-2.5">
              {data?.referrers.map((r) => {
                const maxCount = data.referrers[0]?.count ?? 1;
                return (
                  <div key={r.source} className="flex items-center gap-3">
                    <span className="w-28 truncate text-[12px] font-medium text-foreground">{r.source}</span>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${(r.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">{r.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Devices */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">
            Devices
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : totalDevices === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground/50">No device data yet</p>
          ) : (
            <div className="space-y-3">
              {[
                { key: "desktop", label: "Desktop", icon: <Monitor className="h-4 w-4" /> },
                { key: "mobile", label: "Mobile", icon: <Smartphone className="h-4 w-4" /> },
                { key: "tablet", label: "Tablet", icon: <Tablet className="h-4 w-4" /> },
              ].map((device) => {
                const count = data?.devices[device.key] ?? 0;
                const pct = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
                return (
                  <div key={device.key} className="flex items-center gap-3">
                    <span className="flex w-24 items-center gap-2 text-[12px] font-medium text-foreground">
                      {device.icon} {device.label}
                    </span>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, isText }: {
  icon: React.ReactNode; label: string; value: number | string; sub: string; color: string; isText?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-[24px] font-bold tracking-tight text-foreground">
        {isText ? value : typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground/60">{sub}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create loading skeleton**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-1 h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-14" />
            <Skeleton className="mt-1 h-3 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[260px] rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add Analytics link to portfolios page**

In `src/app/dashboard/portfolios/page.tsx`, in the portfolio actions section (where Edit and View buttons are), add:

```tsx
<Link
  href={`/dashboard/portfolios/${portfolio.id}/analytics`}
  className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
  title="Analytics"
>
  <BarChart3 className="h-3.5 w-3.5" />
  Analytics
</Link>
```

Import `BarChart3` from lucide-react.

- [ ] **Step 4: Test manually**

Run: `npm run dev`
1. Visit a published portfolio in an incognito tab to create view records
2. Go to Dashboard > Portfolios > click Analytics on that portfolio
3. Verify stats cards, chart, referrers, and device breakdown render
4. Toggle between 7d/30d/90d ranges

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/portfolios/[id]/analytics/ src/components/common/svg-line-chart.tsx src/app/dashboard/portfolios/page.tsx
git commit -m "feat: add portfolio analytics dashboard with views chart, referrers, and device breakdown"
```
