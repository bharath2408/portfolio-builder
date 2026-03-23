# Foliocraft — AI-Powered Portfolio Builder

A production-grade, **Figma-like portfolio builder** built with Next.js 15, featuring a block-based editor where users can create, customize, and publish professional portfolios without writing code.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   BUILDER WORKSPACE                      │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  LAYERS   │  │     CANVAS       │  │  PROPERTIES   │  │
│  │  PANEL    │  │                  │  │  PANEL        │  │
│  │           │  │  ┌─Section───┐   │  │               │  │
│  │ ▸ Hero    │  │  │ [Heading] │   │  │ Content Tab   │  │
│  │   Heading │  │  │ [Text]    │   │  │ Design Tab    │  │
│  │   Text    │  │  │ [Button]  │   │  │ Layout Tab    │  │
│  │   Button  │  │  │ [Social]  │   │  │               │  │
│  │ ▸ About   │  │  └──────────┘   │  │ Font Size: 16 │  │
│  │   ...     │  │  ┌─Section───┐   │  │ Weight: 700   │  │
│  │ ▸ Skills  │  │  │ [SkillBar]│   │  │ Color: #fff   │  │
│  │   ...     │  │  │ [SkillBar]│   │  │ Padding: ...  │  │
│  └──────────┘  │  └──────────┘   │  └───────────────┘  │
│                  └──────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

### Key Concept: Block-Based System

Unlike traditional fixed-template builders, Foliocraft uses a **Figma-inspired block architecture**:

- **Sections** = Frames/Containers (layout containers with background, padding, min-height)
- **Blocks** = Elements/Layers (individual UI elements inside sections)
- Each block has its own **Content** (data) + **Styles** (visual properties)
- Full drag-and-drop reordering at both section and block level

### 27+ Block Types Available

| Category | Blocks |
|----------|--------|
| Typography | Heading, Text, Quote, List, Code |
| Media | Image, Avatar, Icon, Divider, Spacer |
| Interactive | Button, Link, Social Links |
| Data Display | Badge, Badge Group, Skill Bar, Skill Grid, Progress Ring, Stat |
| Composite | Project Card, Experience Item, Testimonial, Contact Info, Contact Form |
| Layout | Columns, Card, Embed |

Each block has granular style controls (like Figma's design panel):
- Typography: font size, weight, family, alignment, line height, transform
- Colors: text, background, gradient, border
- Spacing: padding (T/R/B/L), margin (T/R/B/L)
- Border: width, color, radius, style
- Effects: shadow, opacity, animation
- Layout: display, flex direction, align, justify, gap
- Responsive: hide on mobile/desktop

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict)
- **Styling**: Tailwind CSS, ShadCN UI, CSS-in-JS for dynamic themes
- **State**: Zustand (client state), Server Components (server state)
- **Database**: Neon PostgreSQL via Prisma ORM
- **Auth**: Auth.js v5 (NextAuth) — OAuth (GitHub, Google) + Credentials
- **Validation**: Zod schemas
- **API Client**: Axios with interceptors (auth, error handling, CSRF)
- **DnD**: @dnd-kit (accessible, performant)
- **Deployment**: Vercel-ready

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Login / Register (route group)
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth handler
│   │   ├── portfolios/           # Portfolio CRUD
│   │   │   └── [id]/
│   │   │       ├── sections/     # Section CRUD
│   │   │       │   └── [sectionId]/
│   │   │       │       └── blocks/ # Block CRUD ← Figma elements
│   │   │       └── theme/        # Theme CRUD
│   │   ├── public/[username]/    # Public portfolio data
│   │   └── users/me/             # User profile
│   ├── dashboard/                # Dashboard pages
│   │   ├── portfolios/
│   │   │   ├── new/              # Create portfolio
│   │   │   └── [id]/edit/        # Builder workspace
│   │   └── settings/             # User settings
│   └── portfolio/[username]/     # Public portfolio page (SSR)
│
├── components/
│   ├── builder/                  # Figma-like editor components
│   │   ├── builder-workspace.tsx # Main 3-panel layout
│   │   ├── block-renderer.tsx    # Renders any block type
│   │   ├── block-properties-panel.tsx # Right panel (Content/Design/Layout)
│   │   ├── theme-editor.tsx      # Global theme controls
│   │   └── sortable-section.tsx  # DnD section item
│   ├── portfolio/                # Public-facing renderers
│   │   └── portfolio-renderer.tsx
│   ├── layout/                   # Sidebar, nav
│   ├── ui/                       # ShadCN components
│   └── common/                   # Providers, toaster
│
├── config/
│   ├── constants.ts              # App-wide constants
│   └── block-registry.ts         # Block catalog (27+ types with defaults)
│
├── hooks/                        # Custom React hooks
├── lib/
│   ├── api/                      # Axios client + interceptors
│   ├── auth.ts                   # Auth.js config
│   ├── db/                       # Prisma client (Neon adapter)
│   ├── validations/              # Zod schemas
│   └── utils/                    # Helpers (cn, slugify, etc.)
│
├── stores/                       # Zustand stores
│   ├── portfolio-store.ts        # Portfolio + Section + Block state
│   └── builder-store.ts          # Editor UI state
│
├── styles/globals.css            # Tailwind + CSS variables
├── types/index.ts                # Full TypeScript definitions
└── middleware.ts                  # Auth guards + rate limiting
```

## Getting Started

### Prerequisites

- Node.js 18+
- Neon DB account (free tier: https://neon.tech)
- GitHub/Google OAuth app (for social login)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, OAuth credentials

# 3. Push schema to Neon
npx prisma db push

# 4. Generate Prisma client
npx prisma generate

# 5. Seed demo data
npm run db:seed

# 6. Start dev server
npm run dev
```

### Demo Login
- Email: `demo@foliocraft.dev`
- Password: `Demo@1234`
- Public portfolio: `http://localhost:3000/portfolio/alexchen`

## Database Schema

```
User ──< Portfolio ──< Section ──< Block
                   └── Theme

User: auth, profile, username
Portfolio: title, slug, status (DRAFT/PUBLISHED/ARCHIVED)
Section: name, sortOrder, styles (JSON — layout, padding, background)
Block: type, sortOrder, content (JSON), styles (JSON — full CSS-like props)
Theme: colors, fonts, border radius (design tokens)
```

## API Structure

All API responses follow a standard format:

```typescript
{ success: boolean; data?: T; error?: { code: string; message: string; details?: Record<string, string[]> } }
```

### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/portfolios` | List user's portfolios |
| POST | `/api/portfolios` | Create portfolio |
| GET | `/api/portfolios/:id` | Get portfolio with sections + blocks |
| PATCH | `/api/portfolios/:id` | Update portfolio |
| DELETE | `/api/portfolios/:id` | Delete portfolio |
| POST | `/api/portfolios/:id/sections` | Add section |
| DELETE | `/api/portfolios/:id/sections` | Delete section |
| POST | `/api/portfolios/:id/sections/:sectionId/blocks` | Add block |
| PATCH | `/api/portfolios/:id/sections/:sectionId/blocks/:blockId` | Update block |
| DELETE | `/api/portfolios/:id/sections/:sectionId/blocks/:blockId` | Delete block |
| PATCH | `/api/portfolios/:id/theme` | Update theme |
| GET | `/api/public/:username` | Get published portfolio |

## Security

- Auth middleware on all `/dashboard` and `/api` routes
- Rate limiting (60 req/min per IP)
- CSRF protection via `X-Requested-With` header
- Secure HTTP headers (X-Frame-Options, CSP, etc.)
- Input validation with Zod on all mutations
- Password hashing with bcrypt (12 rounds)
- JWT-based sessions

## Deployment (Vercel)

```bash
# Build
npm run build

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard matching `.env.example`.

## License

MIT
