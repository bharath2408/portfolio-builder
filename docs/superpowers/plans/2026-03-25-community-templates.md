# Community Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users share their published portfolio as a community template, and let others browse and clone templates from the landing page and dashboard.

**Architecture:** New `CommunityTemplate` DB model + 3 API routes + pill-tab upgrade to publish dialog + `/community` public page + `/dashboard/community` page + landing page showcase section. All UI built with `frontend-design` skill for polished output.

**Tech Stack:** Next.js 15 App Router, Prisma + PostgreSQL, Zod validation, TailwindCSS, Lucide icons, Zustand, NextAuth

**Spec:** `docs/superpowers/specs/2026-03-25-community-templates-design.md`

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `prisma/schema.prisma` | Add `CommunityTemplate` model + `CommunityTemplateCategory` enum + `User` back-relation |
| Create | `src/lib/api/community-templates.ts` | Client-side API helpers |
| Create | `src/app/api/community-templates/route.ts` | `POST` (create/upsert) + `GET` (browse) |
| Create | `src/app/api/community-templates/[id]/use/route.ts` | `POST` clone logic |
| Modify | `src/middleware.ts` | Add `/community` to `publicRoutes` |
| Create | `src/app/community/page.tsx` | Public `/community` browse page |
| Create | `src/app/community/use/[id]/page.tsx` | Post-login clone redirect handler |
| Create | `src/app/dashboard/community/page.tsx` | Dashboard community browse page |
| Create | `src/components/community/template-card.tsx` | Shared template card component |
| Create | `src/components/community/template-grid.tsx` | Filterable/searchable grid |
| Modify | `src/components/builder/builder-workspace.tsx` | Add pill toggle + Share as Template tab to publish dialog |
| Modify | `src/app/(marketing)/page.tsx` | Add community showcase section |
| Modify | `src/components/layout/dashboard-nav.tsx` (or equivalent) | Add Community nav item |

---

## Task 1: Database Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add model and enum**

Open `prisma/schema.prisma`. Add after the last model:

```prisma
enum CommunityTemplateCategory {
  DEVELOPER
  DESIGNER
  WRITER
  OTHER
}

model CommunityTemplate {
  id          String                    @id @default(cuid())
  portfolioId String                    @unique
  userId      String
  name        String
  description String
  category    CommunityTemplateCategory
  isDark      Boolean                   @default(true)
  tags        String[]
  thumbnail   String?
  useCount    Int                       @default(0)
  createdAt   DateTime                  @default(now())
  updatedAt   DateTime                  @updatedAt

  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Inside the existing `model User { ... }` block, add:
```prisma
communityTemplates CommunityTemplate[]
```

Inside the existing `model Portfolio { ... }` block, add:
```prisma
communityTemplate CommunityTemplate?
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_community_templates
```

Expected: migration file created + applied, no errors.

- [ ] **Step 3: Verify generated client**

```bash
npx prisma generate
```

Expected: Prisma Client regenerated with `CommunityTemplate` type available.

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add CommunityTemplate schema"
```

---

## Task 2: API — POST /api/community-templates (create/upsert)

**Files:**
- Create: `src/app/api/community-templates/route.ts`

- [ ] **Step 1: Create route file**

```ts
// src/app/api/community-templates/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // existing auth helper — check src/lib/auth.ts
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  portfolioId: z.string().cuid(),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  category: z.enum(["DEVELOPER", "DESIGNER", "WRITER", "OTHER"]),
  isDark: z.boolean(),
  tags: z
    .array(z.string().max(20).regex(/^[a-z0-9-]+$/))
    .max(5)
    .default([]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { portfolioId, name, description, category, isDark, tags } = parsed.data;

  const portfolio = await db.portfolio.findFirst({
    where: { id: portfolioId, userId: session.user.id },
    select: { status: true, ogImageUrl: true },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 403 });
  }

  if (portfolio.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "Portfolio must be published first" },
      { status: 400 }
    );
  }

  const template = await db.communityTemplate.upsert({
    where: { portfolioId },
    create: {
      portfolioId,
      userId: session.user.id,
      name,
      description,
      category,
      isDark,
      tags,
      thumbnail: portfolio.ogImageUrl ?? null,
    },
    update: { name, description, category, isDark, tags, thumbnail: portfolio.ogImageUrl ?? null },
  });

  return NextResponse.json(template, { status: 200 });
}
```

- [ ] **Step 2: Manual test (curl or Postman)**

With a valid session cookie and a PUBLISHED portfolioId:
```bash
curl -X POST http://localhost:3000/api/community-templates \
  -H "Content-Type: application/json" \
  -d '{"portfolioId":"<id>","name":"Test","description":"A test template","category":"DEVELOPER","isDark":true,"tags":["dark"]}'
```
Expected: 200 with created template object.

Test with DRAFT portfolio → expect 400 "Portfolio must be published first".

- [ ] **Step 3: Commit**

```bash
git add src/app/api/community-templates/
git commit -m "feat: POST /api/community-templates upsert endpoint"
```

---

## Task 3: API — GET /api/community-templates (browse)

**Files:**
- Modify: `src/app/api/community-templates/route.ts`

- [ ] **Step 1: Add GET handler to the same route file**

```ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const isDarkParam = searchParams.get("isDark");
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") ?? "most_used";
  const search = searchParams.get("search") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 12), 24);
  const cursor = searchParams.get("cursor") ?? undefined;

  const cleanSearch = search.replace(/[^a-zA-Z0-9\s-]/g, "").trim();

  const where: any = {};
  if (category) where.category = category;
  if (isDarkParam !== null) where.isDark = isDarkParam === "true";
  if (tag) where.tags = { has: tag };
  if (cleanSearch.length >= 2) {
    where.OR = [
      { name: { contains: cleanSearch, mode: "insensitive" } },
      { description: { contains: cleanSearch, mode: "insensitive" } },
    ];
  }

  const templates = await db.communityTemplate.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: sort === "newest" ? { createdAt: "desc" } : { useCount: "desc" },
    include: { user: { select: { username: true, name: true } } },
  });

  const hasNext = templates.length > limit;
  const items = hasNext ? templates.slice(0, limit) : templates;
  const nextCursor = hasNext ? items[items.length - 1].id : null;

  return NextResponse.json({ templates: items, nextCursor });
}
```

- [ ] **Step 2: Manual test**

```bash
curl "http://localhost:3000/api/community-templates?sort=most_used&limit=4"
```
Expected: 200 with `{ templates: [...], nextCursor: null | string }`.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: GET /api/community-templates browse endpoint"
```

---

## Task 4: API — POST /api/community-templates/[id]/use (clone)

**Files:**
- Create: `src/app/api/community-templates/[id]/use/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/community-templates/[id]/use/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_PORTFOLIOS_PER_USER } from "@/config/constants";

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string, userId: string): Promise<string> {
  let slug = toSlug(base);
  let candidate = slug;
  let i = 1;
  while (
    await db.portfolio.findFirst({ where: { userId, slug: candidate } })
  ) {
    candidate = i === 1 ? `${slug}-copy` : `${slug}-copy-${i}`;
    i++;
  }
  return candidate;
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const template = await db.communityTemplate.findUnique({
    where: { id: params.id },
    include: {
      portfolio: {
        include: {
          sections: { include: { blocks: true } },
          theme: true,
        },
      },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const portfolioCount = await db.portfolio.count({
    where: { userId: session.user.id },
  });
  if (portfolioCount >= MAX_PORTFOLIOS_PER_USER) {
    return NextResponse.json(
      { error: "You've reached the maximum number of portfolios. Delete one to continue." },
      { status: 409 }
    );
  }

  const slug = await uniqueSlug(template.name, session.user.id);

  const newPortfolio = await db.$transaction(async (tx) => {
    const portfolio = await tx.portfolio.create({
      data: {
        userId: session.user.id,
        title: template.name,
        slug,
        status: "DRAFT",
        sections: {
          create: template.portfolio.sections.map((s) => ({
            name: s.name,
            sortOrder: s.sortOrder,
            isVisible: s.isVisible,
            isLocked: s.isLocked,
            styles: s.styles,
            blocks: {
              create: s.blocks.map((b) => ({
                type: b.type,
                sortOrder: b.sortOrder,
                content: b.content,
                styles: b.styles,
                tabletStyles: b.tabletStyles,
                mobileStyles: b.mobileStyles,
                isVisible: b.isVisible,
                isLocked: b.isLocked,
              })),
            },
          })),
        },
      },
    });

    if (template.portfolio.theme) {
      const { id: _id, portfolioId: _pid, ...themeData } = template.portfolio.theme;
      await tx.theme.create({ data: { ...themeData, portfolioId: portfolio.id } });
    }

    await tx.communityTemplate.update({
      where: { id: template.id },
      data: { useCount: { increment: 1 } },
    });

    return portfolio;
  });

  return NextResponse.json({ portfolioId: newPortfolio.id });
}
```

- [ ] **Step 2: Test clone**

```bash
curl -X POST http://localhost:3000/api/community-templates/<templateId>/use
```
Expected: 200 `{ portfolioId: "..." }` + new portfolio visible in dashboard.

Test at portfolio limit → expect 409.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/community-templates/
git commit -m "feat: POST /api/community-templates/[id]/use clone endpoint"
```

---

## Task 5: Client API Helpers

**Files:**
- Create: `src/lib/api/community-templates.ts`

- [ ] **Step 1: Create helpers**

```ts
// src/lib/api/community-templates.ts
export type CommunityTemplateCategory = "DEVELOPER" | "DESIGNER" | "WRITER" | "OTHER";

export interface CommunityTemplate {
  id: string;
  portfolioId: string;
  userId: string;
  name: string;
  description: string;
  category: CommunityTemplateCategory;
  isDark: boolean;
  tags: string[];
  thumbnail: string | null;
  useCount: number;
  createdAt: string;
  user: { username: string | null; name: string | null };
}

export function getAuthorName(user: { username: string | null; name: string | null }): string {
  return user.username ?? user.name ?? "Anonymous";
}

export async function fetchCommunityTemplates(params: {
  category?: string;
  isDark?: boolean;
  tag?: string;
  sort?: "most_used" | "newest";
  search?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ templates: CommunityTemplate[]; nextCursor: string | null }> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.isDark !== undefined) query.set("isDark", String(params.isDark));
  if (params.tag) query.set("tag", params.tag);
  if (params.sort) query.set("sort", params.sort);
  if (params.search) query.set("search", params.search);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  const res = await fetch(`/api/community-templates?${query}`);
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

export async function shareCommunityTemplate(data: {
  portfolioId: string;
  name: string;
  description: string;
  category: CommunityTemplateCategory;
  isDark: boolean;
  tags: string[];
}): Promise<CommunityTemplate> {
  const res = await fetch("/api/community-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to share template");
  }
  return res.json();
}

export async function useCommunityTemplate(id: string): Promise<{ portfolioId: string }> {
  const res = await fetch(`/api/community-templates/${id}/use`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to use template");
  }
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api/community-templates.ts
git commit -m "feat: community-templates client API helpers"
```

---

## Task 6: Middleware — Add /community to publicRoutes

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add route**

Find the line:
```ts
const publicRoutes = ["/", "/login", "/register", "/portfolio"];
```
Change to:
```ts
const publicRoutes = ["/", "/login", "/register", "/portfolio", "/community"];
```

- [ ] **Step 2: Verify**

Visit `http://localhost:3000/community` without being logged in — should not redirect to login.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add /community to public routes"
```

---

## Task 7: Shared Template Card Component

**Files:**
- Create: `src/components/community/template-card.tsx`

> **REQUIRED:** Use the `frontend-design` skill to implement this component with high design quality matching the existing dashboard aesthetic (`src/components/dashboard/`). The card must handle `thumbnail: null` with a gradient placeholder. Show name, author (`getAuthorName`), use count, and Use/Preview action buttons.

- [ ] **Step 1: Invoke frontend-design skill and implement card**

The card takes props:
```ts
interface TemplateCardProps {
  template: CommunityTemplate;
  onUse: (id: string) => void;
  showPreview?: boolean; // hides Preview button on landing page
  loading?: boolean;
}
```

- [ ] **Step 2: Create `src/components/community/template-grid.tsx`**

Grid + filter pills + search bar + infinite scroll. Accepts `initialTemplates` and fetches more via `fetchCommunityTemplates`. Debounce search 300ms, min 2 chars.

- [ ] **Step 3: Commit**

```bash
git add src/components/community/
git commit -m "feat: template card and grid components"
```

---

## Task 8: /community Public Page

**Files:**
- Create: `src/app/community/page.tsx`
- Create: `src/app/community/use/[id]/page.tsx`

> **REQUIRED:** Use `frontend-design` skill for the page layout.

- [ ] **Step 1: Create browse page**

`/app/community/page.tsx` — server component that fetches initial templates (12, sorted by `most_used`) and passes them to `<TemplateGrid>`. Full-width, no dashboard chrome.

- [ ] **Step 2: Create clone-redirect handler**

```ts
// src/app/community/use/[id]/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/community/use/${params.id}`);
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/community-templates/${params.id}/use`,
    { method: "POST", headers: { cookie: /* forward session cookie */ "" } }
  );

  // NOTE: In Next.js App Router server components, use the internal API call pattern
  // already used in this codebase (check src/app/dashboard for examples of server-side fetch with session).
  // Alternatively call db directly here to avoid HTTP round-trip.

  if (!res.ok) {
    redirect("/community?error=clone_failed");
  }
  const { portfolioId } = await res.json();
  redirect(`/dashboard/portfolios/${portfolioId}/edit`);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/community/
git commit -m "feat: /community public browse page and clone redirect"
```

---

## Task 9: Dashboard Community Page

**Files:**
- Create: `src/app/dashboard/community/page.tsx`
- Modify: Dashboard nav component (find with `grep -r "dashboard" src/components/layout/ --include="*.tsx" -l`)

> **REQUIRED:** Use `frontend-design` skill for the dashboard community page layout.

- [ ] **Step 1: Create dashboard community page**

`/app/dashboard/community/page.tsx` — authenticated server component. Same `<TemplateGrid>` component but with `showPreview={true}`. On "Use" click, calls `useCommunityTemplate(id)` then `router.push(...)`.

- [ ] **Step 2: Add Community nav item**

Find the dashboard nav component and add:
```tsx
{ href: "/dashboard/community", label: "Community", icon: Users }
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/community/
git commit -m "feat: dashboard /community page and nav item"
```

---

## Task 10: Publish Dialog — Share as Template Tab

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

The publish dialog is around lines 3625–3695. Add a pill toggle and the template submission form.

- [ ] **Step 1: Add state variables** (near existing `showPublishDialog` state)

```ts
const [publishTab, setPublishTab] = useState<"publish" | "template">("publish");
const [templateName, setTemplateName] = useState(portfolio.title);
const [templateDesc, setTemplateDesc] = useState("");
const [templateCategory, setTemplateCategory] = useState<CommunityTemplateCategory>("DEVELOPER");
const [templateIsDark, setTemplateIsDark] = useState(true);
const [templateTags, setTemplateTags] = useState<string[]>([]);
const [templateTagInput, setTemplateTagInput] = useState("");
const [sharingTemplate, setSharingTemplate] = useState(false);
const [shareSuccess, setShareSuccess] = useState(false);
```

- [ ] **Step 2: Add handleShareTemplate handler**

```ts
const handleShareTemplate = async () => {
  setSharingTemplate(true);
  try {
    await shareCommunityTemplate({
      portfolioId: portfolio.id,
      name: templateName,
      description: templateDesc,
      category: templateCategory,
      isDark: templateIsDark,
      tags: templateTags,
    });
    setShareSuccess(true);
    setTimeout(() => {
      setShareSuccess(false);
      setShowPublishDialog(false);
      setPublishTab("publish");
    }, 3000);
  } catch (e: any) {
    // show error toast using the existing toast pattern in this file
  } finally {
    setSharingTemplate(false);
  }
};
```

- [ ] **Step 3: Update dialog JSX**

Inside the publish dialog, add pill toggle at the top:
```tsx
{/* Pill toggle */}
<div className="flex bg-slate-800 rounded-lg p-1 mb-4">
  <button
    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
      publishTab === "publish" ? "bg-cyan-500 text-white" : "text-slate-400"
    }`}
    onClick={() => setPublishTab("publish")}
  >
    🌐 Publish
  </button>
  <button
    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
      publishTab === "template" ? "bg-indigo-500 text-white" : "text-slate-400"
    }`}
    onClick={() => setPublishTab("template")}
  >
    📦 Share as Template
  </button>
</div>

{publishTab === "publish" && (
  /* existing publish form JSX unchanged */
)}

{publishTab === "template" && (
  portfolio.status !== "PUBLISHED" ? (
    <p className="text-sm text-slate-400 text-center py-4">
      Publish your portfolio first before sharing it as a template.
    </p>
  ) : shareSuccess ? (
    <p className="text-sm text-emerald-400 text-center py-4">✓ Template shared to community!</p>
  ) : (
    <div className="space-y-3">
      {/* Template Name */}
      <div>
        <label className="text-xs text-slate-400 uppercase">Template Name</label>
        <input maxLength={80} value={templateName} onChange={e => setTemplateName(e.target.value)}
          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
      </div>
      {/* Description */}
      <div>
        <label className="text-xs text-slate-400 uppercase">Description</label>
        <textarea maxLength={300} value={templateDesc} onChange={e => setTemplateDesc(e.target.value)}
          rows={2} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
      </div>
      {/* Category + Theme row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-slate-400 uppercase">Category</label>
          <select value={templateCategory} onChange={e => setTemplateCategory(e.target.value as any)}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100">
            <option value="DEVELOPER">Developer</option>
            <option value="DESIGNER">Designer</option>
            <option value="WRITER">Writer</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-400 uppercase">Color Theme</label>
          <select value={templateIsDark ? "dark" : "light"} onChange={e => setTemplateIsDark(e.target.value === "dark")}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>
      {/* Tags */}
      <div>
        <label className="text-xs text-slate-400 uppercase">Tags (max 5)</label>
        <div className="flex flex-wrap gap-1 mt-1 mb-1">
          {templateTags.map(t => (
            <span key={t} className="bg-indigo-900 text-indigo-300 rounded px-2 py-0.5 text-xs flex items-center gap-1">
              {t}
              <button onClick={() => setTemplateTags(prev => prev.filter(x => x !== t))}>×</button>
            </span>
          ))}
        </div>
        {templateTags.length < 5 && (
          <input
            value={templateTagInput}
            placeholder="Type a tag and press Enter"
            onChange={e => setTemplateTagInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            onKeyDown={e => {
              if (e.key === "Enter" && templateTagInput.trim()) {
                setTemplateTags(prev => [...prev, templateTagInput.trim()]);
                setTemplateTagInput("");
              }
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100"
          />
        )}
      </div>
      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={() => setShowPublishDialog(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
        <button
          onClick={handleShareTemplate}
          disabled={sharingTemplate || !templateName || !templateDesc}
          className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:opacity-50"
        >
          {sharingTemplate ? "Sharing..." : "Share Template"}
        </button>
      </div>
    </div>
  )
)}
```

- [ ] **Step 4: Test in browser**

Open editor → Update button → verify pill toggle → fill template form → Share Template → success message.

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/builder-workspace.tsx
git commit -m "feat: add Share as Template tab to publish dialog"
```

---

## Task 11: Landing Page Showcase Section

**Files:**
- Modify: `src/app/(marketing)/page.tsx` (or wherever the landing page lives — run `grep -r "Get Started" src/app --include="*.tsx" -l` to find it)

> **REQUIRED:** Use `frontend-design` skill for the showcase section.

- [ ] **Step 1: Fetch featured templates server-side**

At the top of the landing page server component, fetch top 8 templates:
```ts
const { templates: featuredTemplates } = await fetchCommunityTemplates({ limit: 8, sort: "most_used" });
// Note: use direct db call if this is a server component to avoid HTTP round-trip
```

- [ ] **Step 2: Add showcase section JSX**

After the existing features section, add:
- Badge: "COMMUNITY"
- Heading: "Built by the Community"
- Subheading
- Grid of up to 8 `<TemplateCard>` components (with `showPreview={false}`)
- "Browse all templates →" link to `/community`

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: community showcase section on landing page"
```

---

## Task 12: Final QA Checklist

- [ ] Visit `/community` while logged out — page loads, no redirect
- [ ] Visit `/community` while logged in — page loads, Use button works
- [ ] Click "Use Template" logged out → redirected to login → after login → portfolio cloned → editor opens
- [ ] At portfolio limit → 409 shown as toast, no redirect
- [ ] Open publish dialog on PUBLISHED portfolio → pill toggle → Share as Template form → submit → success
- [ ] Open publish dialog on DRAFT portfolio → Share as Template tab shows notice
- [ ] `/dashboard/community` loads, search filters work, "Community" appears in nav
- [ ] Landing page shows community section with templates

- [ ] **Final commit**

```bash
git commit --allow-empty -m "feat: community templates feature complete"
```
