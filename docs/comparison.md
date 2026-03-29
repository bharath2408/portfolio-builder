# Foliocraft vs Other Portfolio/Website Builders

## Feature Comparison

| Feature | **Foliocraft** | **Framer** | **Webflow** | **Wix** | **WordPress** | **Notion** |
|---------|---------------|-----------|------------|---------|-------------|-----------|
| **Canvas Editor** | Figma-like free-form | Figma-like | Visual box model | Drag-drop grid | Block editor | Page blocks |
| **Absolute Positioning** | Yes | Yes | Limited | No | No | No |
| **Smart Guides & Snap** | Yes | Yes | Yes | Basic | No | No |
| **40+ Block Types** | Yes | ~30 | ~40 | ~50 | Via plugins | ~15 |
| **Multi-stop Gradient Editor** | Yes | Yes | Yes | Basic | Plugin | No |
| **Background Video** | Cloudinary upload + URL | Yes | Yes | Yes | Plugin | No |
| **Background Patterns** | 12 built-in | No | No | No | Plugin | No |
| **Custom Font Upload** | Yes (.woff2/.woff/.ttf) | Yes | Yes | Yes | Yes | No |
| **Block Animations** | 12 types + stagger | Yes | Yes | Basic | Plugin | No |
| **Hover Effects** | 5 types + magnetic | Yes | Yes | Basic | No | No |
| **Responsive Auto-Adapt** | One-click generate | Manual | Breakpoints | Auto | Responsive theme | Auto |
| **Headless CMS** | Built-in (4 presets + custom) | Built-in | Built-in | Wix CMS | Core feature | Database |
| **Rich Text Editor** | TipTap block editor | Prosemirror | Rich text | Rich text | Gutenberg | Built-in |
| **Schema Builder** | Custom field types (9 types) | No (fixed) | Yes | Yes | ACF plugin | Properties |
| **CMS Blocks on Canvas** | Yes (card/full/compact) | Yes | Yes | Yes | Shortcodes | No |
| **Asset Library** | Built-in + library picker | Built-in | Built-in | Built-in | Media library | Uploads |
| **Version History** | Yes | Yes | Yes | Yes | Revisions | Yes |
| **Export Options** | JSON, HTML, .folio, PDF | No export | Code export | No | Full export | Markdown |
| **Keyboard Shortcuts** | 50+ | 30+ | 40+ | Few | 20+ | 30+ |
| **Command Palette** | Yes (Ctrl+K) | Yes | Yes | No | No | Yes |
| **Group/Ungroup** | Yes | Yes | Yes | Yes | No | No |
| **Marquee Multi-select** | Yes | Yes | Yes | No | No | No |
| **SEO Controls** | Full (meta, OG, password) | Yes | Yes | Yes | Yoast plugin | Basic |
| **Community Templates** | Share & use | Marketplace | Marketplace | Marketplace | Themes | Templates |
| **Contact Form** | Built-in + workflows | Form block | Built-in | Built-in | Plugin | No |
| **Conditional Fields** | Advanced AND/OR rules | No | Yes | Yes | Plugin | No |
| **Multi-step Forms** | Yes (progress bar) | No | Yes | Yes | Plugin | No |
| **Form Webhooks** | Yes (HMAC signed) | No | Yes | Yes | Plugin | No |
| **Email Notifications** | Resend (auto-response) | Yes | Yes | Yes | Plugin | No |
| **Spam Protection** | Honeypot + rate limit | reCAPTCHA | Yes | Yes | Akismet | No |
| **Resume/PDF Export** | Built-in | No | No | No | Plugin | No |
| **Open Source** | Yes (self-host) | No | No | No | Yes | No |
| **Pricing** | Free (self-hosted) | $5-20/mo | $14-39/mo | $17-36/mo | Free + hosting | Free + $10/mo |

---

## Where Foliocraft Stands Out

**vs Framer/Webflow** — Similar canvas power but free, open-source, and portfolio-focused. They charge $14-39/mo. Foliocraft has features they don't: background patterns, auto-adapt, .folio export, resume generator, conditional form fields, and HMAC-signed webhooks.

**vs Wix/Squarespace** — More design freedom (absolute positioning vs grid). The canvas is closer to Figma than a page builder. Plus built-in CMS and form workflows without upsell.

**vs WordPress** — No plugin dependency hell. CMS, animations, SEO, forms, conditional fields, webhooks, email notifications are all built-in. WordPress needs 10+ plugins for what Foliocraft has natively.

**vs Notion** — Notion is for docs, not portfolios. Foliocraft has real design tools, animations, themes, CMS, form workflows, and publishing.

---

## What's Still Missing (vs Competitors)

| Gap | Who has it | Difficulty |
|-----|-----------|-----------|
| **AI content generation** | Framer, Wix | Medium |
| **Real-time collaboration** | Framer, Figma | Hard |
| **Custom domains** | All paid tools | Medium |
| **E-commerce/payments** | Wix, Webflow, WordPress | Hard |
| **Internationalization (i18n)** | WordPress, Webflow | Medium |
| **A/B testing** | Webflow | Medium |
| **Plugin/extension system** | WordPress, Webflow | Hard |
| **Image editor (crop/filter)** | Wix, Canva | Medium |

---

## Platform Summary

### Core Studio
- Figma-like canvas editor with drag, resize, rotate and smart alignment guides
- 40+ block types — headings, text, images, buttons, skill bars, project cards, testimonials, contact forms, embeds, shapes, CMS entries
- Multi-page portfolios with page switcher
- Full undo/redo history
- Command palette (Ctrl+K) with 50+ keyboard shortcuts
- Onboarding tour for first-time users

### Design Features
- Theme system — dark/light/custom with 6 color presets, 10+ fonts
- Custom font upload — .woff2/.woff/.ttf files (5 per portfolio)
- Gradient editor — visual multi-stop gradient builder with 8 presets
- Background patterns — 12 pattern types (dots, grid, hexagons, diagonal, etc.)
- Background video — Cloudinary upload or paste URL, looping muted autoplay
- Block animations — 12 entrance animations + text animations + hover effects
- Stagger animations — sequential reveal on scroll with configurable delay
- Responsive preview — desktop/tablet/mobile with one-click auto-adapt generation

### Content Management (CMS)
- Headless CMS — create collections with custom schemas
- 4 preset templates — Blog Post, Project, Testimonial, FAQ
- Schema builder — 9 field types (text, rich text, number, boolean, image, date, select, URL, color)
- TipTap rich text editor — headings, bold, italic, lists, code, images, links
- CMS blocks on canvas — insert entries with card/full/compact layouts
- Content tab in studio — browse and insert CMS content directly

### Form Workflows
- Contact form block with customizable fields
- Conditional fields — advanced AND/OR rules with 8 operators
- Multi-step forms — progress bar, step-by-step wizard, per-step validation
- Email notifications — Resend integration with auto-response support
- Webhooks — HMAC-SHA256 signed, fire on submission (Zapier/Slack/Make)
- Spam protection — honeypot fields + IP rate limiting (5/min)
- Forms dashboard — submissions list, webhook management, settings

### Asset Management
- Asset library — upload once, reuse across all blocks (100 per user)
- Library picker — browse assets when setting any image source
- Cloudinary CDN — automatic optimization, thumbnails, video hosting

### Publishing & Export
- One-click publish — live portfolio at /portfolio/username/slug
- SEO settings — meta title, description, OG image, password protection
- Export — JSON, HTML, .folio file format
- Version history — snapshot and restore with visual diff
- Community templates — share and use others' designs

### Dashboard
- Portfolio management — create, edit, duplicate, soft-delete with 30-day trash recovery
- CMS dashboard — manage collections and content entries
- Forms dashboard — submissions, webhooks, email settings
- Analytics — view counts and visitor tracking
- Resume generator — PDF export
- Contact form submissions — with notification bell
