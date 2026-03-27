# Platform Expansion — Visual Website Builder

**Date:** 2026-03-27
**Status:** Approved

## Strategy

Evolve Foliocraft from a portfolio builder into a **visual website builder** — without building e-commerce backend. Expand templates and block types to serve landing pages, agency sites, SaaS pages, and freelancer sites.

The studio editor, block system, and theme engine already work for any website. Just broaden what users can build.

## New Block Types to Add

### Phase 1: Core Expansion Blocks

| Block | Category | What it renders |
|---|---|---|
| `pricing_table` | data | Pricing card with plan name, price, features list, CTA button, popular badge |
| `faq` | composite | Accordion Q&A — click question to expand answer |
| `newsletter` | interactive | Email input + subscribe button (connects to external service via URL) |
| `logo_cloud` | media | Grid/row of partner/client logos with optional grayscale hover |
| `feature_card` | composite | Icon + title + description card (for feature grids) |
| `cta_banner` | composite | Full-width banner with heading, subtext, and action button |
| `video_hero` | media | Background video with overlay text (YouTube/Vimeo embed or URL) |
| `countdown` | data | Countdown timer to a target date |
| `product_card` | composite | Product image, title, price, description, buy link (external) |
| `review_stars` | data | Star rating (1-5) with review text and author |

### Phase 2: Template Packs

| Template | Sections | Target audience |
|---|---|---|
| SaaS Landing Page | Hero + Features + Pricing + Testimonials + CTA + FAQ | Startups |
| Agency Site | Hero + Services + Portfolio + Team + Contact | Agencies |
| Freelancer Page | Hero + About + Services + Pricing + Testimonials + Contact | Freelancers |
| Product Launch | Hero + Product Demo + Features + Pricing + FAQ + CTA | Product makers |
| Event Page | Hero + Speakers + Schedule + Pricing + FAQ + CTA | Event organizers |
| Restaurant/Cafe | Hero + Menu + Gallery + Location + Hours + Contact | Local businesses |

## What NOT to Build

- Payment processing / cart / checkout
- Order management / inventory
- User authentication for site visitors
- CMS / blog engine with posts
- Database-backed dynamic content

Users link to external services for payments (Stripe Payment Links, Gumroad, Razorpay).

## Implementation Order

1. **New block types** (Phase 1) — 5-6 highest-impact blocks first
2. **Template packs** — Pre-built section configurations using existing + new blocks
3. **Branding update** — Landing page copy, meta tags, docs subtitle

## Files to Create/Modify

| Action | File |
|---|---|
| Modify | `src/types/index.ts` — add new BLOCK_TYPES |
| Modify | `src/config/block-registry.ts` — register new blocks with defaults |
| Modify | `src/components/builder/block-renderer.tsx` — render new blocks |
| Modify | `src/components/builder/block-properties-panel.tsx` — content editors for new blocks |
| Create | `src/components/portfolio/pricing-table.tsx` — pricing card renderer |
| Create | `src/components/portfolio/faq-accordion.tsx` — FAQ accordion renderer |
| Modify | `src/config/frame-templates.ts` — add new template packs |
