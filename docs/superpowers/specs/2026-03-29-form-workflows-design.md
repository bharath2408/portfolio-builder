# Form Logic & Workflows

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Add form logic and workflow capabilities to the contact_form block: conditional fields with advanced AND/OR rules, multi-step wizard forms, email notifications via Resend, webhook integrations, and spam protection (honeypot + rate limiting). Settings split between block properties (quick access) and a dashboard page (advanced management).

---

## 1. Conditional Fields (Advanced Rules)

### Data Model

Each field in a contact_form block gets an optional `conditions` array stored in `content.fields[].conditions`:

```typescript
interface FieldCondition {
  fieldKey: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty" | "matches";
  value: string;
  logic: "AND" | "OR";
}
```

### Evaluation Logic

- Multiple conditions on a field combine using their `logic` property
- First condition's `logic` is ignored (it's the base)
- Evaluated client-side in real-time as the user types
- Hidden fields are excluded from validation and submission data
- Pure function: `evaluateConditions(conditions, formData) → boolean`

### UI (Block Properties)

When a contact_form block is selected, each field in the right panel gets a collapsible "Show when" section:
- "Add condition" button
- Each condition row: field dropdown, operator dropdown, value input, AND/OR toggle, delete button
- Condition rows are drag-reorderable

---

## 2. Multi-Step Forms

### Data Model

Each field gets a `step: number` property (default 1). Stored in `content.fields[].step`.

### Rendering

- Progress bar at top: shows step numbers/names with active state
- Only fields matching current step are visible
- "Next" button validates current step fields, then advances
- "Back" button goes to previous step (no re-validation)
- "Submit" button appears only on the final step
- Step transitions animate with a subtle slide

### UI (Block Properties)

Each field shows a "Step" number input (spinner, 1-10). The form preview updates live in the canvas.

---

## 3. Email Notifications (Resend)

### Configuration

**Environment variables:**
- `RESEND_API_KEY` — Resend API key
- `NOTIFICATION_FROM_EMAIL` — sender address (e.g., `noreply@foliocraft.com`)

**Per-form settings** (stored in block `content`):
```typescript
{
  notifyEmail?: string;          // recipient (fallback: portfolio owner email)
  autoResponseEnabled?: boolean;
  autoResponseSubject?: string;  // default: "Thanks for reaching out!"
  autoResponseBody?: string;     // supports {{name}}, {{email}}, {{message}} variables
}
```

### Email Templates

Two React Email templates:

**Notification** (`notification.tsx`):
- To: portfolio owner
- Subject: "New form submission from {name}"
- Body: table of all submitted fields, timestamp, portfolio name

**Auto-response** (`auto-response.tsx`):
- To: submitter's email
- Subject: configurable (from block content)
- Body: configurable with variable interpolation, styled with portfolio theme colors

### Flow

On `POST /api/portfolios/[id]/submissions`:
1. Save submission to DB
2. Async: send notification email to owner
3. Async: if auto-response enabled, send confirmation to submitter
4. Emails are fire-and-forget (failures logged, don't block response)

---

## 4. Webhooks

### Database Model

```prisma
model FormWebhook {
  id          String   @id @default(cuid())
  portfolioId String
  url         String
  events      String[] // ["submission.created"]
  secret      String?  // HMAC-SHA256 signing secret
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@index([portfolioId])
}
```

Add `webhooks FormWebhook[]` relation to Portfolio model.

### Webhook Payload

```json
{
  "event": "submission.created",
  "timestamp": "2026-03-29T12:00:00Z",
  "data": {
    "portfolioId": "...",
    "portfolioTitle": "...",
    "formFields": { "name": "John", "email": "john@example.com", "message": "Hello" },
    "submittedAt": "2026-03-29T12:00:00Z"
  }
}
```

### Signing

If `secret` is set, include header `X-Webhook-Signature: sha256={HMAC-SHA256(payload, secret)}`. Consumers verify by computing the same HMAC.

### Delivery

- Fire async POST to each active webhook for the portfolio
- Content-Type: application/json
- Timeout: 5 seconds
- No retries in v1 (fire-and-forget)
- Log delivery status (success/failure) but don't block submission response

### API Routes

- `GET /api/webhooks?portfolioId=xxx` — list webhooks
- `POST /api/webhooks` — create webhook `{ portfolioId, url, events, secret }`
- `PATCH /api/webhooks/[id]` — update (url, events, secret, isActive)
- `DELETE /api/webhooks/[id]` — delete webhook

---

## 5. Spam Protection

### Honeypot Field

- Add hidden field `<input name="_hp_website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px", opacity: 0 }}>` to every contact form
- On submission: if `_hp_website` has any value, return 200 with `{ success: true }` but don't save. Bots think it succeeded.
- Enabled by default, no user toggle needed

### Rate Limiting

- In submission API: extract IP from request headers (`x-forwarded-for` or `x-real-ip`)
- Track submissions per IP in memory (Map with TTL cleanup)
- Limit: 5 submissions per minute per IP
- Return 429 `{ error: "Too many submissions. Please try again later." }` if exceeded
- Reset counter after 60 seconds

---

## 6. UI Locations

### Block Properties (Right Panel)

When a `contact_form` block is selected, add these sections below the existing field list:

**Per-field settings** (in each field row):
- Step number input (1-10)
- "Conditions" collapsible: add/edit/remove conditions with field/operator/value/logic

**Form Settings section** (below fields):
- Email notification toggle + recipient email input
- Auto-response toggle + subject + body textarea (with variable hint)
- Honeypot status indicator ("Spam protection: Active")

### Dashboard (`/dashboard/forms`)

**Layout:** Same pattern as CMS dashboard.

**Submissions tab:**
- Table: Form source (portfolio name), submitter name/email, date, status (read/unread)
- Click row → detail view showing all submitted fields
- Mark as read/unread
- Delete submission
- Search by name/email

**Webhooks tab:**
- List of webhooks: URL, events, active toggle, created date
- "Add Webhook" button → form with URL, events checkboxes, optional secret
- Edit/delete webhooks
- "Test" button that sends a sample payload

**Settings tab:**
- Default notification email
- Test email button (sends a test notification)

---

## 7. File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/lib/email/resend.ts` | Resend client initialization + send helpers |
| `src/lib/email/templates/notification.tsx` | Submission notification email template |
| `src/lib/email/templates/auto-response.tsx` | Auto-response confirmation email template |
| `src/lib/form/evaluate-conditions.ts` | Pure function: evaluate field conditions against form data |
| `src/lib/form/rate-limiter.ts` | In-memory IP rate limiting |
| `src/app/api/webhooks/route.ts` | Webhook list + create |
| `src/app/api/webhooks/[id]/route.ts` | Webhook update + delete |
| `src/app/dashboard/forms/page.tsx` | Forms dashboard page |

### Modified Files

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add FormWebhook model, relation to Portfolio |
| `src/types/index.ts` | Add FieldCondition, FormWebhook interfaces, update ContactFormContent |
| `src/components/builder/block-properties-panel.tsx` | Add conditions UI, step input, email/webhook settings for contact_form |
| `src/components/builder/block-renderer.tsx` | Multi-step rendering, conditional field evaluation, honeypot field |
| `src/components/portfolio/portfolio-renderer.tsx` | Same conditional/multi-step/honeypot logic for live site |
| `src/app/api/portfolios/[id]/submissions/route.ts` | Honeypot check, rate limiting, send emails, fire webhooks |
| `src/components/layout/dashboard-layout.tsx` | Add Forms nav link |
| `package.json` | Add `resend` package |

---

## 8. Implementation Order

1. **Types + DB migration** — FieldCondition type, FormWebhook model, update field schema
2. **Conditional fields** — evaluate-conditions.ts + block properties UI + renderer integration
3. **Multi-step forms** — step rendering, progress bar, per-step validation in renderer + block properties
4. **Spam protection** — honeypot field in renderer + rate-limiter.ts in submission API
5. **Resend email** — install resend, create templates, integrate in submission API
6. **Webhooks** — model, API routes, fire on submission, signing
7. **Forms dashboard** — submissions list, webhook management, email settings
8. **Dashboard nav** — add Forms link

---

## 9. Limits

- Max 10 conditions per field
- Max 10 steps per form
- Max 5 webhooks per portfolio
- Rate limit: 5 submissions per minute per IP
- Auto-response body max: 2000 characters
