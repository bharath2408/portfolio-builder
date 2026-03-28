# Headless CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an internal headless CMS with schema builder, content studio, TipTap rich text editor, dashboard UI, studio Content tab, and CMS block type.

**Architecture:** User-defined content types store field schemas as JSON. Content entries store field values as JSON matching their type's schema. TipTap (free/MIT) provides rich text editing. Dashboard page at `/dashboard/cms` for management, studio left panel Content tab for browsing/inserting content blocks.

**Tech Stack:** Next.js 15, React 19, Prisma 6, TipTap (free), Tailwind CSS, Zustand, Lucide React.

**Spec:** `docs/superpowers/specs/2026-03-29-headless-cms-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/cms/cms-presets.ts` | 4 pre-built collection template definitions |
| `src/components/cms/field-renderer.tsx` | Renders a single form field by type |
| `src/components/cms/entry-editor.tsx` | Full entry form rendered from schema |
| `src/components/cms/schema-editor.tsx` | Field list editor for content types |
| `src/components/cms/entry-table.tsx` | Entry list table with search/status |
| `src/components/cms/tiptap-editor.tsx` | TipTap rich text block editor |
| `src/components/cms/tiptap-renderer.tsx` | TipTap JSON → themed HTML |
| `src/app/dashboard/cms/page.tsx` | CMS dashboard page |
| `src/app/api/cms/types/route.ts` | Content type list + create |
| `src/app/api/cms/types/[typeId]/route.ts` | Content type get/update/delete |
| `src/app/api/cms/types/[typeId]/entries/route.ts` | Entry list + create |
| `src/app/api/cms/entries/[entryId]/route.ts` | Entry get/update/delete |
| `src/app/api/cms/init/route.ts` | Initialize preset collections |

### Modified Files
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add ContentType + ContentEntry models |
| `src/types/index.ts` | Add CMS interfaces |
| `src/components/layout/dashboard-layout.tsx` | Add CMS nav link |
| `src/components/builder/builder-workspace.tsx` | Add Content tab in left panel |
| `src/config/block-registry.ts` | Add `cms_entry` block type |
| `src/components/builder/block-renderer.tsx` | Add `cms_entry` render case |
| `package.json` | Add TipTap dependencies |

---

## Task 1: Database Models and Types

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add ContentType and ContentEntry models to schema.prisma**

Add after the existing `CustomFont` model:

```prisma
model ContentType {
  id          String   @id @default(cuid())
  userId      String
  portfolioId String
  name        String
  slug        String
  icon        String   @default("FileText")
  fields      Json
  isPreset    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolio Portfolio      @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  entries   ContentEntry[]

  @@unique([portfolioId, slug])
  @@index([portfolioId])
}

model ContentEntry {
  id            String    @id @default(cuid())
  contentTypeId String
  portfolioId   String
  title         String
  slug          String
  data          Json
  status        String    @default("DRAFT")
  publishedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  contentType ContentType @relation(fields: [contentTypeId], references: [id], onDelete: Cascade)
  portfolio   Portfolio   @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@unique([contentTypeId, slug])
  @@index([contentTypeId])
  @@index([portfolioId])
}
```

Add relations to existing models:
- In `User` model add: `contentTypes ContentType[]`
- In `Portfolio` model add: `contentTypes ContentType[]` and `contentEntries ContentEntry[]`

- [ ] **Step 2: Add CMS type interfaces to `src/types/index.ts`**

Add after the existing `CustomFont` interface:

```typescript
// ─── CMS ────────────────────────────────────────────────────────
export type FieldType = "text" | "richtext" | "number" | "boolean" | "image" | "date" | "select" | "url" | "color";

export interface FieldDefinition {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ContentType {
  id: string;
  userId: string;
  portfolioId: string;
  name: string;
  slug: string;
  icon: string;
  fields: FieldDefinition[];
  isPreset: boolean;
  createdAt: Date;
  updatedAt: Date;
  entries?: ContentEntry[];
  _count?: { entries: number };
}

export interface ContentEntry {
  id: string;
  contentTypeId: string;
  portfolioId: string;
  title: string;
  slug: string;
  data: Record<string, unknown>;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contentType?: ContentType;
}
```

- [ ] **Step 3: Generate Prisma client and push schema**

```bash
npx prisma generate && npx prisma db push
```

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add prisma/schema.prisma src/types/index.ts
git commit -m "feat(cms): add ContentType and ContentEntry database models and types"
```

---

## Task 2: CMS Presets and API Routes

**Files:**
- Create: `src/components/cms/cms-presets.ts`
- Create: `src/app/api/cms/types/route.ts`
- Create: `src/app/api/cms/types/[typeId]/route.ts`
- Create: `src/app/api/cms/types/[typeId]/entries/route.ts`
- Create: `src/app/api/cms/entries/[entryId]/route.ts`
- Create: `src/app/api/cms/init/route.ts`

- [ ] **Step 1: Create CMS preset templates**

Create `src/components/cms/cms-presets.ts`:

```typescript
import type { FieldDefinition } from "@/types";

interface CollectionPreset {
  name: string;
  slug: string;
  icon: string;
  fields: FieldDefinition[];
}

export const CMS_PRESETS: CollectionPreset[] = [
  {
    name: "Blog Post",
    slug: "blog-post",
    icon: "FileText",
    fields: [
      { id: "1", name: "Title", key: "title", type: "text", required: true },
      { id: "2", name: "Slug", key: "slug", type: "text", required: true },
      { id: "3", name: "Cover Image", key: "coverImage", type: "image", required: false },
      { id: "4", name: "Excerpt", key: "excerpt", type: "text", required: false, placeholder: "Brief summary..." },
      { id: "5", name: "Body", key: "body", type: "richtext", required: true },
      { id: "6", name: "Tags", key: "tags", type: "text", required: false, placeholder: "comma-separated" },
      { id: "7", name: "Published Date", key: "publishedAt", type: "date", required: false },
    ],
  },
  {
    name: "Project",
    slug: "project",
    icon: "FolderKanban",
    fields: [
      { id: "1", name: "Title", key: "title", type: "text", required: true },
      { id: "2", name: "Slug", key: "slug", type: "text", required: true },
      { id: "3", name: "Cover Image", key: "coverImage", type: "image", required: false },
      { id: "4", name: "Description", key: "description", type: "text", required: false },
      { id: "5", name: "Body", key: "body", type: "richtext", required: false },
      { id: "6", name: "Tech Stack", key: "techStack", type: "text", required: false, placeholder: "React, Node.js, ..." },
      { id: "7", name: "Live URL", key: "liveUrl", type: "url", required: false },
      { id: "8", name: "Repo URL", key: "repoUrl", type: "url", required: false },
      { id: "9", name: "Featured", key: "featured", type: "boolean", required: false },
    ],
  },
  {
    name: "Testimonial",
    slug: "testimonial",
    icon: "MessageSquareQuote",
    fields: [
      { id: "1", name: "Quote", key: "quote", type: "text", required: true },
      { id: "2", name: "Author", key: "author", type: "text", required: true },
      { id: "3", name: "Role", key: "role", type: "text", required: false },
      { id: "4", name: "Company", key: "company", type: "text", required: false },
      { id: "5", name: "Avatar", key: "avatar", type: "image", required: false },
      { id: "6", name: "Rating", key: "rating", type: "number", required: false },
    ],
  },
  {
    name: "FAQ",
    slug: "faq",
    icon: "HelpCircle",
    fields: [
      { id: "1", name: "Question", key: "question", type: "text", required: true },
      { id: "2", name: "Answer", key: "answer", type: "richtext", required: true },
      { id: "3", name: "Category", key: "category", type: "text", required: false },
      { id: "4", name: "Sort Order", key: "sortOrder", type: "number", required: false },
    ],
  },
];
```

- [ ] **Step 2: Create content type API routes**

Create `src/app/api/cms/types/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { successResponse, withErrorHandler, requireAuth } from "@/lib/api/response";
import { db } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const portfolioId = req.nextUrl.searchParams.get("portfolioId");
  if (!portfolioId) return NextResponse.json({ error: "portfolioId required" }, { status: 400 });

  const types = await db.contentType.findMany({
    where: { portfolioId, userId: user.id },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: "asc" },
  });

  return successResponse(types);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const body = await req.json();
  const { portfolioId, name, slug, icon, fields, isPreset } = body;

  if (!portfolioId || !name || !slug || !fields) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const count = await db.contentType.count({ where: { portfolioId, userId: user.id } });
  if (count >= 10) {
    return NextResponse.json({ error: "Max 10 content types per portfolio" }, { status: 400 });
  }

  const contentType = await db.contentType.create({
    data: {
      userId: user.id,
      portfolioId,
      name,
      slug,
      icon: icon ?? "FileText",
      fields: fields ?? [],
      isPreset: isPreset ?? false,
    },
    include: { _count: { select: { entries: true } } },
  });

  return NextResponse.json(contentType, { status: 201 });
});
```

Create `src/app/api/cms/types/[typeId]/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { successResponse, notFoundResponse, noContentResponse, withErrorHandler, requireAuth } from "@/lib/api/response";
import { db } from "@/lib/db";

export const GET = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<{ typeId: string }> }) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;

  const contentType = await db.contentType.findFirst({
    where: { id: typeId, userId: user.id },
    include: { _count: { select: { entries: true } } },
  });
  if (!contentType) return notFoundResponse();

  return successResponse(contentType);
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ typeId: string }> }) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;
  const body = await req.json();

  const existing = await db.contentType.findFirst({ where: { id: typeId, userId: user.id } });
  if (!existing) return notFoundResponse();

  const updated = await db.contentType.update({
    where: { id: typeId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.slug && { slug: body.slug }),
      ...(body.icon && { icon: body.icon }),
      ...(body.fields && { fields: body.fields }),
    },
    include: { _count: { select: { entries: true } } },
  });

  return successResponse(updated);
});

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<{ typeId: string }> }) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;

  const existing = await db.contentType.findFirst({ where: { id: typeId, userId: user.id } });
  if (!existing) return notFoundResponse();

  await db.contentType.delete({ where: { id: typeId } });
  return noContentResponse();
});
```

- [ ] **Step 3: Create entry API routes**

Create `src/app/api/cms/types/[typeId]/entries/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { successResponse, notFoundResponse, withErrorHandler, requireAuth } from "@/lib/api/response";
import { db } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ typeId: string }> }) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");

  const contentType = await db.contentType.findFirst({ where: { id: typeId, userId: user.id } });
  if (!contentType) return notFoundResponse();

  const entries = await db.contentEntry.findMany({
    where: {
      contentTypeId: typeId,
      ...(status && { status }),
      ...(search && { title: { contains: search, mode: "insensitive" as const } }),
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(entries);
});

export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ typeId: string }> }) => {
  const user = await requireAuth();
  const { typeId } = await ctx.params;
  const body = await req.json();

  const contentType = await db.contentType.findFirst({ where: { id: typeId, userId: user.id } });
  if (!contentType) return notFoundResponse();

  const entryCount = await db.contentEntry.count({ where: { contentTypeId: typeId } });
  if (entryCount >= 100) {
    return NextResponse.json({ error: "Max 100 entries per collection" }, { status: 400 });
  }

  const entry = await db.contentEntry.create({
    data: {
      contentTypeId: typeId,
      portfolioId: contentType.portfolioId,
      title: body.title ?? "Untitled",
      slug: body.slug ?? crypto.randomUUID().slice(0, 8),
      data: body.data ?? {},
      status: body.status ?? "DRAFT",
      publishedAt: body.status === "PUBLISHED" ? new Date() : null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
});
```

Create `src/app/api/cms/entries/[entryId]/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { successResponse, notFoundResponse, noContentResponse, withErrorHandler, requireAuth } from "@/lib/api/response";
import { db } from "@/lib/db";

export const GET = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<{ entryId: string }> }) => {
  const user = await requireAuth();
  const { entryId } = await ctx.params;

  const entry = await db.contentEntry.findFirst({
    where: { id: entryId },
    include: { contentType: true },
  });
  if (!entry) return notFoundResponse();

  const contentType = await db.contentType.findFirst({ where: { id: entry.contentTypeId, userId: user.id } });
  if (!contentType) return notFoundResponse();

  return successResponse(entry);
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ entryId: string }> }) => {
  const user = await requireAuth();
  const { entryId } = await ctx.params;
  const body = await req.json();

  const entry = await db.contentEntry.findFirst({
    where: { id: entryId },
    include: { contentType: true },
  });
  if (!entry) return notFoundResponse();

  const contentType = await db.contentType.findFirst({ where: { id: entry.contentTypeId, userId: user.id } });
  if (!contentType) return notFoundResponse();

  const updated = await db.contentEntry.update({
    where: { id: entryId },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.slug && { slug: body.slug }),
      ...(body.data && { data: body.data }),
      ...(body.status && {
        status: body.status,
        publishedAt: body.status === "PUBLISHED" ? new Date() : entry.publishedAt,
      }),
    },
  });

  return successResponse(updated);
});

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<{ entryId: string }> }) => {
  const user = await requireAuth();
  const { entryId } = await ctx.params;

  const entry = await db.contentEntry.findFirst({ where: { id: entryId } });
  if (!entry) return notFoundResponse();

  const contentType = await db.contentType.findFirst({ where: { id: entry.contentTypeId, userId: user.id } });
  if (!contentType) return notFoundResponse();

  await db.contentEntry.delete({ where: { id: entryId } });
  return noContentResponse();
});
```

- [ ] **Step 4: Create init endpoint**

Create `src/app/api/cms/init/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { withErrorHandler, requireAuth } from "@/lib/api/response";
import { db } from "@/lib/db";
import { CMS_PRESETS } from "@/components/cms/cms-presets";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const { portfolioId } = await req.json();
  if (!portfolioId) return NextResponse.json({ error: "portfolioId required" }, { status: 400 });

  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

  const existing = await db.contentType.findMany({ where: { portfolioId, isPreset: true } });
  const existingSlugs = new Set(existing.map((t) => t.slug));

  const created = [];
  for (const preset of CMS_PRESETS) {
    if (existingSlugs.has(preset.slug)) continue;
    const ct = await db.contentType.create({
      data: {
        userId: user.id,
        portfolioId,
        name: preset.name,
        slug: preset.slug,
        icon: preset.icon,
        fields: preset.fields,
        isPreset: true,
      },
      include: { _count: { select: { entries: true } } },
    });
    created.push(ct);
  }

  return NextResponse.json(created, { status: 201 });
});
```

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add src/components/cms/cms-presets.ts src/app/api/cms/
git commit -m "feat(cms): add preset templates and all CMS API routes"
```

---

## Task 3: Install TipTap and Build Editor

**Files:**
- Modify: `package.json` (via npm install)
- Create: `src/components/cms/tiptap-editor.tsx`
- Create: `src/components/cms/tiptap-renderer.tsx`

- [ ] **Step 1: Install TipTap packages**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder
```

- [ ] **Step 2: Create TipTap editor component**

Create `src/components/cms/tiptap-editor.tsx`:

```typescript
"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Image as ImageIcon,
  Link as LinkIconLucide, Undo2, Redo2, Minus,
} from "lucide-react";
import { useCallback } from "react";

interface TipTapEditorProps {
  value: JSONContent | undefined;
  onChange: (json: JSONContent) => void;
  placeholder?: string;
}

export function TipTapEditor({ value, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing..." }),
    ],
    content: value ?? "",
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none outline-none min-h-[120px] px-3 py-2",
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt("Image URL:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt("Link URL:");
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const btnClass = "flex h-7 w-7 items-center justify-center rounded transition-colors";

  const ToolBtn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={btnClass}
      style={{
        backgroundColor: active ? "var(--b-accent-soft, rgba(6,182,212,0.08))" : "transparent",
        color: active ? "var(--b-accent, #06b6d4)" : "var(--b-text-3, #71717a)",
      }}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--b-border, rgba(255,255,255,0.08))", backgroundColor: "var(--b-surface, #18181b)" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1" style={{ borderBottom: "1px solid var(--b-border, rgba(255,255,255,0.08))" }}>
        <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="mx-0.5 h-4 w-px" style={{ backgroundColor: "var(--b-border, rgba(255,255,255,0.08))" }} />
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="mx-0.5 h-4 w-px" style={{ backgroundColor: "var(--b-border, rgba(255,255,255,0.08))" }} />
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="mx-0.5 h-4 w-px" style={{ backgroundColor: "var(--b-border, rgba(255,255,255,0.08))" }} />
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
          <Code className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="mx-0.5 h-4 w-px" style={{ backgroundColor: "var(--b-border, rgba(255,255,255,0.08))" }} />
        <ToolBtn onClick={addImage} title="Image">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("link")} onClick={addLink} title="Link">
          <LinkIconLucide className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="flex-1" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo2 className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>
      {/* Editor */}
      <div style={{ color: "var(--b-text, #e4e4e7)" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create TipTap renderer component**

Create `src/components/cms/tiptap-renderer.tsx`:

```typescript
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import type { JSONContent } from "@tiptap/react";

interface TipTapRendererProps {
  content: JSONContent;
  className?: string;
}

export function TipTapRenderer({ content, className }: TipTapRendererProps) {
  const html = generateHTML(content, [
    StarterKit,
    ImageExtension,
    LinkExtension,
  ]);

  return (
    <div
      className={`prose prose-sm max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add package.json package-lock.json src/components/cms/tiptap-editor.tsx src/components/cms/tiptap-renderer.tsx
git commit -m "feat(cms): add TipTap rich text editor and renderer"
```

---

## Task 4: Field Renderer and Entry Editor

**Files:**
- Create: `src/components/cms/field-renderer.tsx`
- Create: `src/components/cms/entry-editor.tsx`

- [ ] **Step 1: Create field renderer**

Create `src/components/cms/field-renderer.tsx` — renders a single form field based on its type:

```typescript
"use client";

import type { FieldDefinition } from "@/types";
import type { JSONContent } from "@tiptap/react";
import { TipTapEditor } from "@/components/cms/tiptap-editor";
import { ImageUpload } from "@/components/common/image-upload";
import { AdvancedColorInput } from "@/components/builder/color-picker";

interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const inputClass = "h-8 w-full rounded-md border px-2.5 text-[13px] outline-none transition-colors focus:border-primary";
  const inputStyle = { backgroundColor: "var(--b-surface, #f0ede8)", borderColor: "var(--b-border, rgba(0,0,0,0.07))", color: "var(--b-text, #1c1917)" };

  switch (field.type) {
    case "text":
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
          style={inputStyle}
        />
      );

    case "richtext":
      return (
        <TipTapEditor
          value={value as JSONContent | undefined}
          onChange={onChange}
          placeholder={field.placeholder}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={field.placeholder}
          className={inputClass}
          style={inputStyle}
        />
      );

    case "boolean":
      return (
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={(value as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          <span className="text-[13px]" style={{ color: "var(--b-text-2, #44403c)" }}>
            {field.name}
          </span>
        </label>
      );

    case "image":
      return (
        <ImageUpload
          value={(value as string) ?? ""}
          onChange={(url) => onChange(url)}
          compact
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      );

    case "select":
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={inputStyle}
        >
          <option value="">Select...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case "url":
      return (
        <input
          type="url"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "https://..."}
          className={inputClass}
          style={inputStyle}
        />
      );

    case "color":
      return (
        <AdvancedColorInput
          value={(value as string) ?? ""}
          onChange={(c) => onChange(c)}
        />
      );

    default:
      return null;
  }
}
```

- [ ] **Step 2: Create entry editor**

Create `src/components/cms/entry-editor.tsx`:

```typescript
"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Save, Loader2, Globe, FileEdit } from "lucide-react";
import { apiPost, apiPatch } from "@/lib/api";
import { FieldRenderer } from "@/components/cms/field-renderer";
import type { ContentEntry, ContentType, FieldDefinition } from "@/types";

interface EntryEditorProps {
  contentType: ContentType;
  entry: ContentEntry | null;
  onSave: (entry: ContentEntry) => void;
  onBack: () => void;
}

export function EntryEditor({ contentType, entry, onSave, onBack }: EntryEditorProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [slug, setSlug] = useState(entry?.slug ?? "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(entry?.status ?? "DRAFT");
  const [data, setData] = useState<Record<string, unknown>>(entry?.data ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = contentType.fields as unknown as FieldDefinition[];

  const updateField = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const autoSlug = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!entry) setSlug(autoSlug(val));
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required";
    for (const field of fields) {
      if (field.required && !data[field.key]) {
        return `${field.name} is required`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(null);
    setSaving(true);
    try {
      const payload = { title, slug: slug || autoSlug(title), data, status };
      let saved: ContentEntry;
      if (entry) {
        saved = await apiPatch<ContentEntry>(`/cms/entries/${entry.id}`, payload);
      } else {
        saved = await apiPost<ContentEntry>(`/cms/types/${contentType.id}/entries`, payload);
      }
      onSave(saved);
    } catch {
      setError("Failed to save");
    }
    setSaving(false);
  };

  const inputClass = "h-8 w-full rounded-md border px-2.5 text-[13px] outline-none transition-colors focus:border-primary";
  const inputStyle = { backgroundColor: "var(--b-surface, #f0ede8)", borderColor: "var(--b-border, rgba(0,0,0,0.07))", color: "var(--b-text, #1c1917)" };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-[14px] font-bold">{entry ? "Edit Entry" : `New ${contentType.name}`}</h2>
            <p className="text-[11px] text-muted-foreground">{contentType.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status toggle */}
          <button
            onClick={() => setStatus(status === "DRAFT" ? "PUBLISHED" : "DRAFT")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              backgroundColor: status === "PUBLISHED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
              color: status === "PUBLISHED" ? "#10b981" : "#f59e0b",
            }}
          >
            {status === "PUBLISHED" ? <Globe className="h-3.5 w-3.5" /> : <FileEdit className="h-3.5 w-3.5" />}
            {status}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</div>
      )}

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Entry title..."
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated-from-title"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Dynamic fields */}
          {fields.map((field) => (
            <div key={field.id}>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {field.name}{field.required ? " *" : ""}
              </label>
              <FieldRenderer
                field={field}
                value={data[field.key]}
                onChange={(val) => updateField(field.key, val)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/components/cms/field-renderer.tsx src/components/cms/entry-editor.tsx
git commit -m "feat(cms): add dynamic field renderer and entry editor"
```

---

## Task 5: Schema Editor

**Files:**
- Create: `src/components/cms/schema-editor.tsx`

- [ ] **Step 1: Create schema editor component**

Create `src/components/cms/schema-editor.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import { apiPatch } from "@/lib/api";
import type { ContentType, FieldDefinition, FieldType } from "@/types";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "richtext", label: "Rich Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "image", label: "Image" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "url", label: "URL" },
  { value: "color", label: "Color" },
];

interface SchemaEditorProps {
  contentType: ContentType;
  onUpdate: (updated: ContentType) => void;
  onClose: () => void;
}

export function SchemaEditor({ contentType, onUpdate, onClose }: SchemaEditorProps) {
  const [fields, setFields] = useState<FieldDefinition[]>(
    (contentType.fields as unknown as FieldDefinition[]) ?? []
  );
  const [saving, setSaving] = useState(false);

  const addField = () => {
    if (fields.length >= 20) return;
    const newField: FieldDefinition = {
      id: crypto.randomUUID(),
      name: "",
      key: "",
      type: "text",
      required: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FieldDefinition>) => {
    setFields(fields.map((f) => {
      if (f.id !== id) return f;
      const updated = { ...f, ...updates };
      if (updates.name && !f.key) {
        updated.key = updates.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      }
      return updated;
    }));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiPatch<ContentType>(`/cms/types/${contentType.id}`, { fields });
      onUpdate(updated);
      onClose();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const inputClass = "h-7 rounded-md border px-2 text-[12px] outline-none transition-colors focus:border-primary";
  const inputStyle = { backgroundColor: "var(--b-surface, #f0ede8)", borderColor: "var(--b-border, rgba(0,0,0,0.07))", color: "var(--b-text, #1c1917)" };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-3">
        <div>
          <h2 className="text-[14px] font-bold">Schema: {contentType.name}</h2>
          <p className="text-[11px] text-muted-foreground">{fields.length}/20 fields</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Schema
          </button>
        </div>
      </div>

      {/* Fields list */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-2">
          {contentType.isPreset && (
            <p className="mb-4 rounded-lg bg-primary/5 px-3 py-2 text-[11px] text-primary">
              This is a preset template. You can customize its fields.
            </p>
          )}
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-2 rounded-lg border p-2.5"
              style={{ borderColor: "var(--b-border, rgba(0,0,0,0.07))" }}
            >
              <GripVertical className="h-3.5 w-3.5 flex-shrink-0 cursor-grab text-muted-foreground" />
              <input
                type="text"
                value={field.name}
                onChange={(e) => updateField(field.id, { name: e.target.value })}
                placeholder="Field name"
                className={`${inputClass} flex-1`}
                style={inputStyle}
              />
              <select
                value={field.type}
                onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                className={`${inputClass} w-28`}
                style={inputStyle}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <label className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  className="h-3 w-3 rounded"
                />
                Req
              </label>
              <button onClick={() => removeField(field.id)} className="flex-shrink-0 text-destructive transition-opacity hover:opacity-70">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {fields.length < 20 && (
            <button
              onClick={addField}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/components/cms/schema-editor.tsx
git commit -m "feat(cms): add schema editor for content type field management"
```

---

## Task 6: Entry Table Component

**Files:**
- Create: `src/components/cms/entry-table.tsx`

- [ ] **Step 1: Create entry table component**

Create `src/components/cms/entry-table.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Plus, Search, Trash2, Edit, MoreHorizontal } from "lucide-react";
import type { ContentEntry } from "@/types";

interface EntryTableProps {
  entries: ContentEntry[];
  collectionName: string;
  onEdit: (entry: ContentEntry) => void;
  onDelete: (entryId: string) => void;
  onNew: () => void;
}

export function EntryTable({ entries, collectionName, onEdit, onDelete, onNew }: EntryTableProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? entries.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    : entries;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-3">
        <h2 className="text-[16px] font-bold">{collectionName}</h2>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" />
          New Entry
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 border-b px-6 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-[13px] outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-[13px] font-medium text-muted-foreground">
              {search ? "No entries match your search" : `No ${collectionName.toLowerCase()} yet`}
            </p>
            {!search && (
              <button
                onClick={onNew}
                className="rounded-lg bg-primary/10 px-4 py-2 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                Create your first entry
              </button>
            )}
          </div>
        )}
        <div className="divide-y">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="flex cursor-pointer items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/50"
              onClick={() => onEdit(entry)}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-medium">{entry.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(entry.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className="flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: entry.status === "PUBLISHED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  color: entry.status === "PUBLISHED" ? "#10b981" : "#f59e0b",
                }}
              >
                {entry.status}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                className="flex-shrink-0 text-muted-foreground transition-opacity hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/components/cms/entry-table.tsx
git commit -m "feat(cms): add entry table component with search and status badges"
```

---

## Task 7: CMS Dashboard Page

**Files:**
- Create: `src/app/dashboard/cms/page.tsx`
- Modify: `src/components/layout/dashboard-layout.tsx`

- [ ] **Step 1: Create CMS dashboard page**

Create `src/app/dashboard/cms/page.tsx`:

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FileText, FolderKanban, MessageSquareQuote, HelpCircle,
  Plus, Settings, Loader2, Sparkles,
} from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { EntryTable } from "@/components/cms/entry-table";
import { EntryEditor } from "@/components/cms/entry-editor";
import { SchemaEditor } from "@/components/cms/schema-editor";
import type { ContentType, ContentEntry } from "@/types";

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-4 w-4" />,
  FolderKanban: <FolderKanban className="h-4 w-4" />,
  MessageSquareQuote: <MessageSquareQuote className="h-4 w-4" />,
  HelpCircle: <HelpCircle className="h-4 w-4" />,
};

export default function CmsPage() {
  const { data: session } = useSession();
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Array<{ id: string; title: string }>>([]);
  const [types, setTypes] = useState<ContentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit" | "schema">("list");
  const [editingEntry, setEditingEntry] = useState<ContentEntry | null>(null);
  const [initializing, setInitializing] = useState(false);

  // Load portfolios
  useEffect(() => {
    apiGet<Array<{ id: string; title: string }>>("/portfolios")
      .then((p) => {
        setPortfolios(p);
        if (p.length > 0) setPortfolioId(p[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load content types when portfolio changes
  useEffect(() => {
    if (!portfolioId) return;
    apiGet<ContentType[]>(`/cms/types?portfolioId=${portfolioId}`)
      .then((t) => {
        setTypes(t);
        if (t.length > 0 && !selectedTypeId) setSelectedTypeId(t[0].id);
      })
      .catch(() => {});
  }, [portfolioId]);

  // Load entries when selected type changes
  useEffect(() => {
    if (!selectedTypeId) { setEntries([]); return; }
    apiGet<ContentEntry[]>(`/cms/types/${selectedTypeId}/entries`)
      .then(setEntries)
      .catch(() => {});
  }, [selectedTypeId]);

  const selectedType = types.find((t) => t.id === selectedTypeId) ?? null;

  const handleInitPresets = async () => {
    if (!portfolioId) return;
    setInitializing(true);
    try {
      const created = await apiPost<ContentType[]>("/cms/init", { portfolioId });
      setTypes((prev) => [...prev, ...created]);
      if (created.length > 0 && !selectedTypeId) setSelectedTypeId(created[0].id);
    } catch { /* ignore */ }
    setInitializing(false);
  };

  const handleNewCollection = async () => {
    if (!portfolioId) return;
    const name = window.prompt("Collection name:");
    if (!name) return;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      const ct = await apiPost<ContentType>("/cms/types", {
        portfolioId, name, slug, fields: [], icon: "FileText",
      });
      setTypes((prev) => [...prev, ct]);
      setSelectedTypeId(ct.id);
    } catch { /* ignore */ }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await apiDelete(`/cms/entries/${entryId}`);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch { /* ignore */ }
  };

  const handleSaveEntry = (saved: ContentEntry) => {
    setEntries((prev) => {
      const exists = prev.find((e) => e.id === saved.id);
      if (exists) return prev.map((e) => (e.id === saved.id ? saved : e));
      return [saved, ...prev];
    });
    setView("list");
    setEditingEntry(null);
  };

  const handleUpdateType = (updated: ContentType) => {
    setTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="flex w-56 flex-shrink-0 flex-col border-r bg-card">
        {/* Portfolio selector */}
        {portfolios.length > 1 && (
          <div className="border-b p-3">
            <select
              value={portfolioId ?? ""}
              onChange={(e) => { setPortfolioId(e.target.value); setSelectedTypeId(null); }}
              className="h-8 w-full rounded-md border bg-background px-2 text-[12px] outline-none"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="px-3 pt-3 pb-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Collections</p>
        </div>

        {/* Collection list */}
        <div className="flex-1 overflow-y-auto px-1.5">
          {types.length === 0 && (
            <div className="px-2 py-6 text-center">
              <p className="text-[12px] text-muted-foreground">No collections yet</p>
              <button
                onClick={handleInitPresets}
                disabled={initializing}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                {initializing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Initialize Presets
              </button>
            </div>
          )}
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTypeId(t.id); setView("list"); setEditingEntry(null); }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors"
              style={{
                backgroundColor: selectedTypeId === t.id ? "hsl(var(--primary) / 0.08)" : "transparent",
                color: selectedTypeId === t.id ? "hsl(var(--primary))" : "inherit",
              }}
            >
              <span className="flex-shrink-0">{ICON_MAP[t.icon] ?? <FileText className="h-4 w-4" />}</span>
              <span className="flex-1 truncate text-[13px] font-medium">{t.name}</span>
              <span className="flex-shrink-0 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                {(t._count as { entries: number })?.entries ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="border-t p-2 space-y-1">
          <button
            onClick={handleNewCollection}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            New Collection
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {!selectedType && (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            Select a collection to get started
          </div>
        )}

        {selectedType && view === "list" && (
          <div className="flex h-full flex-col">
            {/* Toolbar */}
            <div className="flex flex-shrink-0 items-center justify-end border-b px-4 py-1.5">
              <button
                onClick={() => setView("schema")}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings className="h-3 w-3" />
                Schema
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <EntryTable
                entries={entries}
                collectionName={selectedType.name}
                onEdit={(e) => { setEditingEntry(e); setView("edit"); }}
                onDelete={handleDeleteEntry}
                onNew={() => { setEditingEntry(null); setView("edit"); }}
              />
            </div>
          </div>
        )}

        {selectedType && view === "edit" && (
          <EntryEditor
            contentType={selectedType}
            entry={editingEntry}
            onSave={handleSaveEntry}
            onBack={() => { setView("list"); setEditingEntry(null); }}
          />
        )}

        {selectedType && view === "schema" && (
          <SchemaEditor
            contentType={selectedType}
            onUpdate={handleUpdateType}
            onClose={() => setView("list")}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CMS link to dashboard sidebar**

In `src/components/layout/dashboard-layout.tsx`, find the navigation items array (around line 33-50). Add CMS to the "Main" category:

```typescript
{ label: "CMS", href: "/dashboard/cms", icon: Database },
```

Add `Database` to the lucide-react imports at the top of the file.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/app/dashboard/cms/ src/components/layout/dashboard-layout.tsx
git commit -m "feat(cms): add CMS dashboard page with sidebar, entry table, editors"
```

---

## Task 8: Studio Content Tab

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

- [ ] **Step 1: Add Content tab to left panel**

Update the `leftTab` state type to include `"content"`:

```typescript
const [leftTab, setLeftTab] = useState<"layers" | "elements" | "shapes" | "assets" | "content">("layers");
```

Add content state after the asset state:

```typescript
const [cmsTypes, setCmsTypes] = useState<ContentType[]>([]);
const [cmsEntries, setCmsEntries] = useState<ContentEntry[]>([]);
const [selectedCmsTypeId, setSelectedCmsTypeId] = useState<string | null>(null);
const [cmsLoading, setCmsLoading] = useState(false);

useEffect(() => {
  apiGet<ContentType[]>(`/cms/types?portfolioId=${portfolio.id}`)
    .then(setCmsTypes)
    .catch(() => {});
}, [portfolio.id]);

useEffect(() => {
  if (!selectedCmsTypeId) { setCmsEntries([]); return; }
  setCmsLoading(true);
  apiGet<ContentEntry[]>(`/cms/types/${selectedCmsTypeId}/entries?status=PUBLISHED`)
    .then(setCmsEntries)
    .catch(() => {})
    .finally(() => setCmsLoading(false));
}, [selectedCmsTypeId]);
```

Add `ContentType` and `ContentEntry` to the type imports from `@/types`.

Add the "Content" tab button to the tab definitions array:

```typescript
{ id: "content" as const, label: "Content" },
```

Add the Content tab panel after the Assets tab:

```typescript
{/* ── Content Tab ────────────────────────────────────── */}
{leftTab === "content" && (
  <div className="flex flex-1 flex-col overflow-hidden">
    <div className="flex flex-shrink-0 items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--b-border)" }}>
      <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--b-text-4)" }}>
        Collections ({cmsTypes.length})
      </span>
      <a
        href="/dashboard/cms"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[9px] font-semibold transition-colors"
        style={{ color: "var(--b-accent)" }}
      >
        Manage
      </a>
    </div>
    <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-auto">
      {cmsTypes.length === 0 && (
        <div className="builder-empty-state flex flex-col items-center gap-3 px-4 py-12 text-center">
          <div className="builder-empty-icon flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--b-accent-soft)", border: "1px dashed var(--b-accent-mid)" }}>
            <Layers className="h-5 w-5" style={{ color: "var(--b-accent)" }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold" style={{ color: "var(--b-text-2)" }}>No collections</p>
            <p className="mt-1 text-[10px] leading-relaxed" style={{ color: "var(--b-text-4)" }}>
              Set up content types in the <a href="/dashboard/cms" target="_blank" className="underline" style={{ color: "var(--b-accent)" }}>CMS dashboard</a>
            </p>
          </div>
        </div>
      )}
      {cmsTypes.map((ct) => (
        <div key={ct.id}>
          <button
            onClick={() => setSelectedCmsTypeId(selectedCmsTypeId === ct.id ? null : ct.id)}
            className="builder-layer-item flex w-full cursor-pointer items-center gap-2 px-3 py-[6px]"
            style={{
              backgroundColor: selectedCmsTypeId === ct.id ? "var(--b-accent-soft)" : "transparent",
              color: selectedCmsTypeId === ct.id ? "var(--b-accent)" : "var(--b-text-2)",
            }}
          >
            <ChevronRight
              className="h-3 w-3 transition-transform duration-150"
              style={{ transform: selectedCmsTypeId === ct.id ? "rotate(90deg)" : "rotate(0)" }}
            />
            <span className="flex-1 truncate text-[10.5px] font-semibold text-left">{ct.name}</span>
            <span className="rounded-full px-1.5 text-[8px] font-bold" style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text-4)" }}>
              {(ct._count as { entries: number })?.entries ?? 0}
            </span>
          </button>
          {selectedCmsTypeId === ct.id && (
            <div className="ml-4 border-l py-0.5" style={{ borderColor: "var(--b-accent-mid)" }}>
              {cmsLoading && <p className="px-4 py-2 text-[9px]" style={{ color: "var(--b-text-4)" }}>Loading...</p>}
              {!cmsLoading && cmsEntries.length === 0 && (
                <p className="px-4 py-2 text-[9px] italic" style={{ color: "var(--b-text-4)" }}>No published entries</p>
              )}
              {cmsEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    const targetSection = selectedSectionId ?? portfolio.sections[0]?.id;
                    if (targetSection) {
                      addBlock(targetSection, "cms_entry" as BlockType, {
                        content: { contentTypeId: ct.id, entryId: entry.id, layout: "card" },
                      });
                    }
                  }}
                  className="builder-layer-item flex w-full items-center gap-2 px-4 py-[5px] text-left"
                  style={{ color: "var(--b-text-2)" }}
                >
                  <span className="flex-1 truncate text-[10px]">{entry.title}</span>
                  <span className="text-[8px] font-bold uppercase" style={{ color: entry.status === "PUBLISHED" ? "var(--b-success)" : "var(--b-text-4)" }}>
                    {entry.status === "PUBLISHED" ? "Live" : "Draft"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/components/builder/builder-workspace.tsx
git commit -m "feat(cms): add Content tab in studio left panel"
```

---

## Task 9: CMS Block Type

**Files:**
- Modify: `src/config/block-registry.ts`
- Modify: `src/components/builder/block-renderer.tsx`

- [ ] **Step 1: Register cms_entry block type**

In `src/config/block-registry.ts`, add `cms_entry` to the `BLOCK_REGISTRY` object (before the closing `}`):

```typescript
  cms_entry: {
    type: "cms_entry",
    label: "CMS Entry",
    icon: "FileText",
    category: "integrations",
    description: "Dynamic content from CMS collection",
    defaultContent: { contentTypeId: "", entryId: "", layout: "card" },
    defaultStyles: { marginBottom: 16, borderRadius: 12, overflow: "hidden" },
  },
```

Also add `"cms_entry"` to the `BLOCK_TYPES` array in `src/types/index.ts` if it's explicitly listed there.

- [ ] **Step 2: Add cms_entry render case**

In `src/components/builder/block-renderer.tsx`, find the switch statement `switch (block.type)`. Add a new case before the `default`:

```typescript
    case "cms_entry": {
      const contentTypeId = c.contentTypeId as string;
      const entryId = c.entryId as string;
      const layout = (c.layout as string) ?? "card";
      if (!entryId) {
        return (
          <div style={{ ...buildInlineStyles(block.styles as BlockStyles, theme), padding: 24, textAlign: "center" as const }}>
            <p style={{ color: resolveColor("muted", theme), fontSize: 13 }}>CMS Entry — select an entry</p>
          </div>
        );
      }
      // Placeholder: entry data is fetched client-side in a wrapper
      return (
        <div style={{ ...buildInlineStyles(block.styles as BlockStyles, theme), padding: layout === "compact" ? 12 : 20 }}>
          <CmsEntryBlock entryId={entryId} layout={layout} theme={theme} isEditing={isEditing} />
        </div>
      );
    }
```

Add the `CmsEntryBlock` component at the bottom of the same file (or above the main `BlockRenderer`):

```typescript
function CmsEntryBlock({ entryId, layout, theme, isEditing }: { entryId: string; layout: string; theme: ThemeTokens; isEditing?: boolean }) {
  const [entry, setEntry] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!entryId) return;
    fetch(`/api/cms/entries/${entryId}`)
      .then((r) => r.json())
      .then((data) => setEntry(data?.data ?? data))
      .catch(() => {});
  }, [entryId]);

  if (!entry) {
    return <p style={{ color: resolveColor("muted", theme), fontSize: 12 }}>Loading content...</p>;
  }

  const title = (entry.title as string) ?? (entry.data as Record<string, unknown>)?.title as string ?? "Untitled";
  const data = (entry.data as Record<string, unknown>) ?? entry;
  const description = (data.description as string) ?? (data.excerpt as string) ?? "";
  const coverImage = (data.coverImage as string) ?? "";

  if (layout === "compact") {
    return (
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: resolveColor("text", theme) }}>{title}</p>
        {description && <p style={{ fontSize: 12, color: resolveColor("muted", theme), marginTop: 4 }}>{description}</p>}
      </div>
    );
  }

  return (
    <div>
      {coverImage && layout === "card" && (
        <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt={title} loading="lazy" style={{ width: "100%", height: 180, objectFit: "cover" }} />
        </div>
      )}
      <p style={{ fontSize: layout === "full" ? 24 : 16, fontWeight: 700, color: resolveColor("text", theme), fontFamily: theme.fontHeading }}>{title}</p>
      {description && (
        <p style={{ fontSize: 13, color: resolveColor("muted", theme), marginTop: 8, lineHeight: 1.6 }}>{description}</p>
      )}
    </div>
  );
}
```

Add `useState` and `useEffect` imports at the top of block-renderer.tsx if not already present.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/config/block-registry.ts src/components/builder/block-renderer.tsx
git commit -m "feat(cms): add cms_entry block type with card/full/compact layouts"
```

---

## Task 10: Final Verification

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Lint check**

```bash
npx next lint --quiet
```

- [ ] **Step 3: Push DB schema**

```bash
npx prisma db push
```

- [ ] **Step 4: Dev server smoke test**

```bash
npm run dev
```

Verify:
1. `/dashboard/cms` loads, shows sidebar with "Initialize Presets" button
2. Clicking "Initialize Presets" creates 4 collections (Blog Post, Project, Testimonial, FAQ)
3. Clicking a collection shows empty entry table
4. "New Entry" opens editor with dynamic fields
5. Rich text field shows TipTap editor with toolbar
6. Saving entry works (draft and published)
7. Schema editor allows adding/removing fields
8. Studio Content tab shows collections and published entries
9. Clicking an entry in studio inserts a CMS block on canvas
10. CMS block renders entry data (title, image, description)
