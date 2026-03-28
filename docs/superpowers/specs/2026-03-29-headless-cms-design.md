# Headless CMS — Schema Builder + Content Studio

**Date:** 2026-03-29
**Status:** Approved
**Scope:** Sub-project 1 of 3 (Schema + Studio + API). Canvas integration and webhooks are separate sub-projects.

---

## Overview

Internal headless CMS for portfolio owners to manage structured content (blog posts, projects, testimonials, FAQs). Content is for internal rendering on the portfolio — no external API consumers in v1.

## Architecture Decisions

- **Schema storage:** JSON field on ContentType model (flexible, no migrations per schema change)
- **Content storage:** JSON field on ContentEntry model (data matches schema fields)
- **Rich text:** TipTap free/MIT packages only (`@tiptap/react`, `@tiptap/starter-kit`, free extensions)
- **UI location:** Dashboard page (`/dashboard/cms`) for management, studio left panel "Content" tab for browsing/inserting
- **Pre-built templates:** 4 collection templates (Blog Post, Project, Testimonial, FAQ) + custom schema builder

---

## 1. Database Models

### ContentType

```prisma
model ContentType {
  id          String   @id @default(cuid())
  userId      String
  portfolioId String
  name        String                // "Blog Post"
  slug        String                // "blog-post"
  icon        String   @default("FileText") // Lucide icon name
  fields      Json                  // FieldDefinition[]
  isPreset    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  entries   ContentEntry[]

  @@unique([portfolioId, slug])
  @@index([portfolioId])
}
```

### ContentEntry

```prisma
model ContentEntry {
  id            String    @id @default(cuid())
  contentTypeId String
  portfolioId   String
  title         String
  slug          String
  data          Json                  // { [fieldKey]: value }
  status        String   @default("DRAFT") // "DRAFT" | "PUBLISHED"
  publishedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  contentType ContentType @relation(fields: [contentTypeId], references: [id], onDelete: Cascade)
  portfolio   Portfolio   @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@unique([contentTypeId, slug])
  @@index([contentTypeId])
  @@index([portfolioId])
}
```

Add relations to User and Portfolio models:
- User: `contentTypes ContentType[]`
- Portfolio: `contentTypes ContentType[]`, `contentEntries ContentEntry[]`

---

## 2. Field Definition Schema

Stored as JSON array in `ContentType.fields`:

```typescript
interface FieldDefinition {
  id: string;           // unique key for React
  name: string;         // Display label: "Cover Image"
  key: string;          // Data key: "coverImage"
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];   // for "select" type only
}

type FieldType =
  | "text"       // single-line string
  | "richtext"   // TipTap block editor (stores JSON)
  | "number"     // numeric input
  | "boolean"    // toggle switch
  | "image"      // image URL (uses existing ImageUpload component)
  | "date"       // date picker
  | "select"     // dropdown from options[]
  | "url"        // URL input with validation
  | "color";     // color picker (uses existing AdvancedColorInput)
```

---

## 3. Pre-built Collection Templates

### Blog Post
```json
[
  { "id": "1", "name": "Title", "key": "title", "type": "text", "required": true },
  { "id": "2", "name": "Slug", "key": "slug", "type": "text", "required": true },
  { "id": "3", "name": "Cover Image", "key": "coverImage", "type": "image", "required": false },
  { "id": "4", "name": "Excerpt", "key": "excerpt", "type": "text", "required": false, "placeholder": "Brief summary..." },
  { "id": "5", "name": "Body", "key": "body", "type": "richtext", "required": true },
  { "id": "6", "name": "Tags", "key": "tags", "type": "text", "required": false, "placeholder": "comma-separated" },
  { "id": "7", "name": "Published Date", "key": "publishedAt", "type": "date", "required": false }
]
```

### Project
```json
[
  { "id": "1", "name": "Title", "key": "title", "type": "text", "required": true },
  { "id": "2", "name": "Slug", "key": "slug", "type": "text", "required": true },
  { "id": "3", "name": "Cover Image", "key": "coverImage", "type": "image", "required": false },
  { "id": "4", "name": "Description", "key": "description", "type": "text", "required": false },
  { "id": "5", "name": "Body", "key": "body", "type": "richtext", "required": false },
  { "id": "6", "name": "Tech Stack", "key": "techStack", "type": "text", "required": false, "placeholder": "React, Node.js, ..." },
  { "id": "7", "name": "Live URL", "key": "liveUrl", "type": "url", "required": false },
  { "id": "8", "name": "Repo URL", "key": "repoUrl", "type": "url", "required": false },
  { "id": "9", "name": "Featured", "key": "featured", "type": "boolean", "required": false }
]
```

### Testimonial
```json
[
  { "id": "1", "name": "Quote", "key": "quote", "type": "text", "required": true },
  { "id": "2", "name": "Author", "key": "author", "type": "text", "required": true },
  { "id": "3", "name": "Role", "key": "role", "type": "text", "required": false },
  { "id": "4", "name": "Company", "key": "company", "type": "text", "required": false },
  { "id": "5", "name": "Avatar", "key": "avatar", "type": "image", "required": false },
  { "id": "6", "name": "Rating", "key": "rating", "type": "number", "required": false }
]
```

### FAQ
```json
[
  { "id": "1", "name": "Question", "key": "question", "type": "text", "required": true },
  { "id": "2", "name": "Answer", "key": "answer", "type": "richtext", "required": true },
  { "id": "3", "name": "Category", "key": "category", "type": "text", "required": false },
  { "id": "4", "name": "Sort Order", "key": "sortOrder", "type": "number", "required": false }
]
```

---

## 4. API Routes

### Content Types
- **`GET /api/cms/types?portfolioId=xxx`** — list all content types for a portfolio
- **`POST /api/cms/types`** — create content type `{ portfolioId, name, slug, icon, fields, isPreset }`
- **`GET /api/cms/types/[typeId]`** — get single content type with entry count
- **`PATCH /api/cms/types/[typeId]`** — update name, icon, fields
- **`DELETE /api/cms/types/[typeId]`** — delete type and all its entries (cascade)

### Content Entries
- **`GET /api/cms/types/[typeId]/entries`** — list entries (supports `?status=PUBLISHED`, `?search=`, ordered by `createdAt desc`)
- **`POST /api/cms/types/[typeId]/entries`** — create entry `{ title, slug, data, status }`
- **`GET /api/cms/entries/[entryId]`** — get single entry with its content type
- **`PATCH /api/cms/entries/[entryId]`** — update entry fields, status, data
- **`DELETE /api/cms/entries/[entryId]`** — delete entry

### Preset Initialization
- **`POST /api/cms/init?portfolioId=xxx`** — creates the 4 preset content types for a portfolio (idempotent — skips if already exist)

---

## 5. Dashboard UI (`/dashboard/cms`)

### Layout
Standard dashboard layout with sidebar + main content area.

### Sidebar
- Portfolio selector dropdown (if user has multiple portfolios)
- List of collections (content types) with Lucide icon + name + entry count badge
- Active collection highlighted
- "New Collection" button at bottom
- "Initialize Presets" button (shown only if no collections exist yet)

### Collection View (main area)
- **Header:** Collection name + icon, "Settings" (schema editor) and "New Entry" buttons
- **Entry table:** columns for Title, Status (draft/published badge), Date, Actions (edit/delete)
- **Search bar** above table
- **Empty state:** "No entries yet — create your first [Collection Name]"

### Schema Editor (modal or inline panel)
- List of fields with: drag handle, name, type dropdown, required toggle, delete button
- "Add Field" button at bottom
- Field type dropdown shows all 9 types
- For "select" type: additional "Options" input (comma-separated)
- Save/Cancel buttons
- Pre-built collections show a notice: "This is a preset template. You can customize its fields."

### Entry Editor (full page or modal)
- Form rendered dynamically from schema fields:
  - `text` → `<input type="text">`
  - `richtext` → TipTap editor
  - `number` → `<input type="number">`
  - `boolean` → toggle switch
  - `image` → existing `ImageUpload` component
  - `date` → `<input type="date">`
  - `select` → `<select>` with options
  - `url` → `<input type="url">`
  - `color` → existing `AdvancedColorInput`
- Status toggle: Draft / Published
- Auto-generate slug from title (editable)
- Save button (creates or updates entry)
- Validation: check required fields before save

---

## 6. Studio Integration — Content Tab

### Location
5th tab in the left panel: Layers | Elements | Shapes | Assets | **Content**

### Behavior
- Shows list of collections (content types) for the current portfolio
- Click collection → shows entries list (title + status)
- Click entry → shows entry preview (read-only summary)
- "Insert" button on each entry → adds a CMS content block to the selected section on canvas
- The CMS block stores `{ contentTypeId, entryId }` in its content and renders the entry data using theme tokens
- "Manage" link → opens `/dashboard/cms` in new tab

### CMS Block (new block type)
- Block type: `"cms_entry"`
- Content: `{ contentTypeId: string, entryId: string, layout: "card" | "full" | "compact" }`
- Renders: fetches the entry data and displays it using the schema fields. Title as heading, image fields as images, text as paragraphs, richtext rendered via TipTap HTML output.
- Layout variants:
  - **card** — image top, title, excerpt/description below (good for grids)
  - **full** — full content render (good for blog post detail)
  - **compact** — title + small metadata (good for lists)

---

## 7. TipTap Rich Text Editor

### Packages (all MIT/free)
- `@tiptap/react` — React bindings
- `@tiptap/starter-kit` — headings, bold, italic, strike, code, blockquote, bullet list, ordered list, hard break, horizontal rule
- `@tiptap/extension-image` — image blocks
- `@tiptap/extension-link` — hyperlinks
- `@tiptap/extension-placeholder` — placeholder text
- `@tiptap/extension-code-block-lowlight` — syntax-highlighted code blocks (optional, can skip for v1)

### Editor Component
- `src/components/cms/tiptap-editor.tsx`
- Toolbar: H1, H2, H3 | Bold, Italic | Bullet List, Ordered List | Blockquote, Code | Image, Link | Undo, Redo
- Styled to match builder theme (uses `--b-*` CSS variables)
- Props: `{ value: JSONContent; onChange: (json: JSONContent) => void }`

### Renderer Component
- `src/components/cms/tiptap-renderer.tsx`
- Converts TipTap JSON → styled HTML for portfolio display
- Applies portfolio theme tokens (font family, colors, spacing)
- Props: `{ content: JSONContent; theme: ThemeTokens }`

---

## 8. File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/app/dashboard/cms/page.tsx` | CMS dashboard page |
| `src/app/dashboard/cms/layout.tsx` | CMS layout with sidebar |
| `src/components/cms/collection-sidebar.tsx` | Collection list sidebar |
| `src/components/cms/entry-table.tsx` | Entry list table |
| `src/components/cms/entry-editor.tsx` | Dynamic form from schema |
| `src/components/cms/schema-editor.tsx` | Field list editor for content types |
| `src/components/cms/field-renderer.tsx` | Renders a single field input by type |
| `src/components/cms/tiptap-editor.tsx` | TipTap rich text editor |
| `src/components/cms/tiptap-renderer.tsx` | TipTap JSON → styled HTML |
| `src/components/cms/cms-presets.ts` | Pre-built collection template definitions |
| `src/app/api/cms/types/route.ts` | Content type list + create |
| `src/app/api/cms/types/[typeId]/route.ts` | Content type get/update/delete |
| `src/app/api/cms/types/[typeId]/entries/route.ts` | Entry list + create |
| `src/app/api/cms/entries/[entryId]/route.ts` | Entry get/update/delete |
| `src/app/api/cms/init/route.ts` | Initialize preset collections |

### Modified Files
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add ContentType and ContentEntry models |
| `src/types/index.ts` | Add CMS type interfaces |
| `src/components/builder/builder-workspace.tsx` | Add Content tab in left panel |
| `src/config/block-registry.ts` | Add `cms_entry` block type |
| `src/components/builder/block-renderer.tsx` | Add `cms_entry` render case |
| `src/app/dashboard/layout.tsx` | Add CMS link to dashboard sidebar |

---

## 9. Implementation Order

1. **Database** — Add ContentType + ContentEntry models, migrate
2. **CMS presets** — Define 4 template schemas
3. **API routes** — All CRUD endpoints + init
4. **TipTap editor** — Editor + renderer components
5. **Field renderer** — Dynamic field input component
6. **Entry editor** — Full entry form with validation
7. **Schema editor** — Field list editor for content types
8. **Dashboard page** — CMS page with sidebar, collection view, entry table
9. **Studio Content tab** — Browse collections/entries in left panel
10. **CMS block** — New block type for canvas rendering
11. **Dashboard nav** — Add CMS link to sidebar

---

## 10. Limits

- Max 10 content types per portfolio
- Max 100 entries per content type
- Max 20 fields per content type
- Rich text max size: 50KB per field
