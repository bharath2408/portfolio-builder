# Resume Generator — Design + Implementation Plan

**Date:** 2026-03-27
**Status:** Ready to implement

## Summary

Auto-generate a downloadable PDF resume from any portfolio's data. User selects a portfolio, sees a live preview, picks an accent color, and downloads the PDF. Client-side generation via `@react-pdf/renderer`.

---

## Flow

1. User visits `/dashboard/resume`
2. Selects a portfolio from dropdown
3. Page fetches portfolio data and extracts resume content from blocks
4. Shows a live preview of the PDF layout
5. User picks accent color (default: portfolio's primary color)
6. Click "Download PDF" → generates and downloads

---

## Data Extraction

From the selected portfolio's blocks:

| Block Type | Resume Section | Fields Used |
|---|---|---|
| User model | Header | name, bio (as title), email |
| `contact_info` blocks | Contact | email, phone, location, website, linkedin, github |
| `text` blocks (in first/about section) | Summary | text content |
| `experience_item` blocks | Work Experience | title, company, date, description |
| `project_card` blocks | Projects | title, description, techStack, liveUrl, repoUrl |
| `skill_bar` blocks | Skills | name, level (0-100) |
| `skill_grid` blocks | Skills | items array with name + level |
| `badge` / `badge_group` blocks | Technologies | text / items |

### Extraction Logic

```typescript
interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  experience: Array<{
    title: string;
    company: string;
    date: string;
    description: string;
  }>;
  projects: Array<{
    title: string;
    description: string;
    techStack: string[];
    url?: string;
  }>;
  skills: Array<{
    name: string;
    level: number; // 0-100
  }>;
  technologies: string[];
}
```

Function `extractResumeData(portfolio, user)` walks through all sections and blocks, matches by block type, and builds the ResumeData object.

---

## PDF Template

Single clean design with configurable accent color.

```
┌──────────────────────────────────────────┐
│                                          │
│  [NAME]                                  │
│  [Title/Bio]                             │
│  email@example.com | +1234567890         │
│  github.com/user | linkedin.com/in/user  │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  SUMMARY                                 │
│  Brief description about yourself...     │
│                                          │
│  EXPERIENCE                              │
│  ┌─ Senior Developer — Acme Corp         │
│  │  Jan 2023 - Present                   │
│  │  Led development of...                │
│  │                                       │
│  ┌─ Developer — Startup Inc              │
│  │  Jun 2021 - Dec 2022                  │
│  │  Built and maintained...              │
│                                          │
│  PROJECTS                                │
│  Portfolio Builder                       │
│  React, Next.js, Prisma                  │
│  A Figma-like portfolio builder...       │
│                                          │
│  SKILLS                                  │
│  ████████████ React        90%           │
│  ██████████░░ TypeScript   80%           │
│  ████████░░░░ Node.js      70%           │
│                                          │
│  TECHNOLOGIES                            │
│  React · Next.js · TypeScript · Node.js  │
│  PostgreSQL · Prisma · Tailwind · Git    │
│                                          │
└──────────────────────────────────────────┘
```

### Design Details
- **Font:** Helvetica (built into @react-pdf/renderer, no custom font loading)
- **Name:** 24pt bold, accent color
- **Section headers:** 11pt uppercase, accent color, with underline
- **Body text:** 10pt, dark gray (#333)
- **Contact line:** 9pt, gray (#666), pipe-separated
- **Skill bars:** Rounded rectangles, accent color fill proportional to level
- **Technologies:** Comma or dot-separated list, wrapping
- **Page size:** A4 (595 x 842 points)
- **Margins:** 40pt all sides

---

## Implementation

### 1. Install dependency

```bash
npm install @react-pdf/renderer
```

### 2. Create resume data extractor

**File:** `src/lib/utils/extract-resume.ts`

```typescript
export function extractResumeData(
  portfolio: PortfolioWithRelations,
  user: { name?: string; email: string; bio?: string }
): ResumeData
```

Walks all sections → blocks, checks `block.type`, extracts content fields.

### 3. Create PDF document component

**File:** `src/components/resume/resume-pdf.tsx`

Uses `@react-pdf/renderer` components:
- `Document`, `Page`, `View`, `Text`, `Link`
- `StyleSheet.create()` for styles
- Accepts `ResumeData` + `accentColor` as props

### 4. Create the page

**File:** `src/app/dashboard/resume/page.tsx`

Client component with:
- Portfolio selector dropdown (fetches user's portfolios)
- Accent color picker
- Live PDF preview via `<PDFViewer>` from @react-pdf/renderer
- Download button via `<BlobProvider>` or `pdf().toBlob()`

### 5. Add to sidebar navigation

In `src/components/layout/dashboard-layout.tsx`:
- Add `{ name: "Resume", href: "/dashboard/resume", icon: FileText }` to mainNav
- Add `"/dashboard/resume": "Resume"` to breadcrumbMap

---

## Page UI Design

```
┌──────────────────────────────────────────────────────┐
│  [Gradient Header: Resume Generator]                  │
│  Generate a professional PDF resume from your         │
│  portfolio data.                                      │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Portfolio: [▼ Select portfolio...]                    │
│  Accent Color: [██ #6366f1]                          │
│                                                       │
│  ┌─────────────────────────────────┐  [Download PDF]  │
│  │                                 │                  │
│  │     Live PDF Preview            │                  │
│  │     (rendered in iframe)        │                  │
│  │                                 │                  │
│  │                                 │                  │
│  │                                 │                  │
│  └─────────────────────────────────┘                  │
│                                                       │
│  No portfolio selected?                               │
│  → "Select a portfolio above to generate your resume" │
│                                                       │
│  Portfolio has no data?                                │
│  → "Add experience, skills, and projects to your      │
│     portfolio to generate a resume"                   │
└──────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/lib/utils/extract-resume.ts` — data extraction from portfolio |
| Create | `src/components/resume/resume-pdf.tsx` — @react-pdf/renderer document |
| Create | `src/app/dashboard/resume/page.tsx` — page with selector + preview + download |
| Modify | `src/components/layout/dashboard-layout.tsx` — add nav item |

---

## Non-Goals

- Multiple templates (v1 = one template, add more later)
- Server-side PDF generation (client-side only)
- Resume editor (auto-generate only, no manual editing)
- Photo/avatar in resume (keep it text-focused)
- Multi-page support (v1 = single page, truncate if too long)
