# Studio Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 features to the studio: Gradient Editor, Asset/Media Library, Custom Fonts Upload, and Responsive Auto-Adapt.

**Architecture:** Each feature is independent. Gradient Editor is pure frontend (no DB). Asset Library and Custom Fonts each add a Prisma model + API routes + UI. Responsive Auto-Adapt is a pure utility function + toolbar button. All follow existing patterns: Cloudinary for file storage, Zustand for state, apiGet/apiPost/apiPatch/apiDelete for HTTP.

**Tech Stack:** Next.js 15, React 19, Prisma 6, Tailwind CSS, Zustand, Cloudinary, Lucide React icons.

**Spec:** `docs/superpowers/specs/2026-03-28-studio-enhancements-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/builder/gradient-editor.tsx` | Visual gradient builder with draggable stops, type/angle controls |
| `src/lib/utils/responsive-adapt.ts` | Pure function: desktop layout → tablet/mobile overrides |
| `src/app/api/assets/route.ts` | GET (list) + POST (create) assets for authenticated user |
| `src/app/api/assets/[id]/route.ts` | DELETE + PATCH (rename) single asset |
| `src/app/api/portfolios/[id]/fonts/route.ts` | GET (list) + POST (create) custom fonts |
| `src/app/api/portfolios/[id]/fonts/[fontId]/route.ts` | DELETE single custom font |

### Modified Files
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `Asset` and `CustomFont` models |
| `src/types/index.ts` | Add `Asset`, `CustomFont`, `GradientStop`, `GradientState` types |
| `src/components/builder/block-properties-panel.tsx` | Add gradient toggle + GradientEditor in Appearance section (~line 399) |
| `src/components/builder/builder-workspace.tsx` | Add Assets tab (~line 835, 3329), Auto-adapt button (~line 3089), section gradient |
| `src/components/builder/theme-editor.tsx` | Add custom font upload + display in font dropdowns (~line 302) |
| `src/components/common/image-upload.tsx` | Add Library tab for asset picker |
| `src/components/portfolio/portfolio-renderer.tsx` | Inject `@font-face` for custom fonts |
| `src/config/constants.ts` | Add `GRADIENT_PRESETS` array |

---

## Task 1: Add Types and Gradient Presets

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/config/constants.ts`

- [ ] **Step 1: Add gradient and asset types to `src/types/index.ts`**

Add after the existing `SectionStyles` interface (around line 293):

```typescript
// ─── Gradient Editor ────────────────────────────────────────────
export interface GradientStop {
  id: string;
  color: string;    // hex or theme token
  position: number; // 0–100
}

export interface GradientState {
  type: "linear" | "radial";
  angle: number;
  radialPosition: string;
  stops: GradientStop[];
}

// ─── Asset Library ──────────────────────────────────────────────
export interface Asset {
  id: string;
  userId: string;
  name: string;
  url: string;
  thumbnailUrl: string | null;
  type: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
}

// ─── Custom Fonts ───────────────────────────────────────────────
export interface CustomFont {
  id: string;
  userId: string;
  portfolioId: string;
  name: string;
  url: string;
  format: string;
  createdAt: Date;
}
```

- [ ] **Step 2: Add gradient presets to `src/config/constants.ts`**

Add after the `COLOR_PRESETS` array:

```typescript
export const GRADIENT_PRESETS = [
  { name: "Sunset", value: "linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)" },
  { name: "Ocean", value: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" },
  { name: "Aurora", value: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #f43f5e 100%)" },
  { name: "Forest", value: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
  { name: "Midnight", value: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)" },
  { name: "Peach", value: "linear-gradient(135deg, #fbbf24 0%, #f43f5e 100%)" },
  { name: "Lavender", value: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" },
  { name: "Slate", value: "linear-gradient(135deg, #64748b 0%, #334155 100%)" },
] as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/config/constants.ts
git commit -m "feat: add gradient, asset, custom font types and gradient presets"
```

---

## Task 2: Build Gradient Editor Component

**Files:**
- Create: `src/components/builder/gradient-editor.tsx`

- [ ] **Step 1: Create the GradientEditor component**

Create `src/components/builder/gradient-editor.tsx` with the full implementation:

```typescript
"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdvancedColorInput } from "@/components/builder/color-picker";
import { GRADIENT_PRESETS } from "@/config/constants";
import type { GradientStop, GradientState } from "@/types";

// ─── CSS ↔ State Conversion ──────────────────────────────────────

function parseGradientCSS(css: string | undefined): GradientState | null {
  if (!css) return null;
  const linearMatch = css.match(/^linear-gradient\((\d+)deg,\s*(.+)\)$/);
  if (linearMatch) {
    const angle = parseInt(linearMatch[1], 10);
    const stops = parseStops(linearMatch[2]);
    if (stops.length >= 2) return { type: "linear", angle, radialPosition: "center", stops };
  }
  const radialMatch = css.match(/^radial-gradient\(circle at ([^,]+),\s*(.+)\)$/);
  if (radialMatch) {
    const radialPosition = radialMatch[1].trim();
    const stops = parseStops(radialMatch[2]);
    if (stops.length >= 2) return { type: "radial", angle: 135, radialPosition, stops };
  }
  return null;
}

function parseStops(raw: string): GradientStop[] {
  const parts = raw.split(/,(?![^(]*\))/);
  return parts.map((part, i) => {
    const trimmed = part.trim();
    const posMatch = trimmed.match(/^(.+?)\s+(\d+)%$/);
    return {
      id: crypto.randomUUID(),
      color: posMatch ? posMatch[1].trim() : trimmed,
      position: posMatch ? parseInt(posMatch[2], 10) : Math.round((i / Math.max(parts.length - 1, 1)) * 100),
    };
  });
}

function toGradientCSS(state: GradientState): string {
  const sorted = [...state.stops].sort((a, b) => a.position - b.position);
  const stopStr = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  if (state.type === "radial") {
    return `radial-gradient(circle at ${state.radialPosition}, ${stopStr})`;
  }
  return `linear-gradient(${state.angle}deg, ${stopStr})`;
}

function defaultGradient(): GradientState {
  return {
    type: "linear",
    angle: 135,
    radialPosition: "center",
    stops: [
      { id: crypto.randomUUID(), color: "#06b6d4", position: 0 },
      { id: crypto.randomUUID(), color: "#8b5cf6", position: 100 },
    ],
  };
}

// ─── Component ───────────────────────────────────────────────────

interface GradientEditorProps {
  value: string | undefined;
  onChange: (css: string | undefined) => void;
}

export function GradientEditor({ value, onChange }: GradientEditorProps) {
  const parsed = useMemo(() => parseGradientCSS(value), [value]);
  const [state, setState] = useState<GradientState>(parsed ?? defaultGradient());
  const [selectedStopId, setSelectedStopId] = useState<string | null>(state.stops[0]?.id ?? null);
  const barRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const emit = useCallback((next: GradientState) => {
    setState(next);
    onChange(toGradientCSS(next));
  }, [onChange]);

  const selectedStop = state.stops.find((s) => s.id === selectedStopId) ?? null;

  // ── Stop drag ────────────────────────────────────────────
  const handleBarMouseDown = (e: React.MouseEvent, stopId: string) => {
    e.preventDefault();
    setSelectedStopId(stopId);
    const bar = barRef.current;
    if (!bar) return;

    const move = (ev: MouseEvent) => {
      const rect = bar.getBoundingClientRect();
      const pos = Math.round(Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)));
      setState((prev) => {
        const next = { ...prev, stops: prev.stops.map((s) => (s.id === stopId ? { ...s, position: pos } : s)) };
        onChange(toGradientCSS(next));
        return next;
      });
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  // ── Add stop on bar click ────────────────────────────────
  const handleBarClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.stop) return;
    if (state.stops.length >= 6) return;
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const pos = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const newStop: GradientStop = { id: crypto.randomUUID(), color: "#ffffff", position: pos };
    const next = { ...state, stops: [...state.stops, newStop] };
    setSelectedStopId(newStop.id);
    emit(next);
  };

  const removeStop = (stopId: string) => {
    if (state.stops.length <= 2) return;
    const next = { ...state, stops: state.stops.filter((s) => s.id !== stopId) };
    if (selectedStopId === stopId) setSelectedStopId(next.stops[0]?.id ?? null);
    emit(next);
  };

  const updateStopColor = (stopId: string, color: string) => {
    const next = { ...state, stops: state.stops.map((s) => (s.id === stopId ? { ...s, color } : s)) };
    emit(next);
  };

  const sorted = [...state.stops].sort((a, b) => a.position - b.position);
  const previewCSS = toGradientCSS(state);

  const RADIAL_POSITIONS = ["top left", "top center", "top right", "center left", "center", "center right", "bottom left", "bottom center", "bottom right"];

  return (
    <div className="space-y-3">
      {/* Gradient Preview Bar */}
      <div
        ref={barRef}
        className="relative h-8 cursor-crosshair rounded-lg"
        style={{ background: previewCSS, border: "1px solid var(--b-border)" }}
        onClick={handleBarClick}
      >
        {sorted.map((stop) => (
          <div
            key={stop.id}
            data-stop="true"
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab"
            style={{ left: `${stop.position}%` }}
            onMouseDown={(e) => handleBarMouseDown(e, stop.id)}
          >
            <div
              className="h-4 w-4 rounded-full border-2 shadow-sm transition-transform"
              style={{
                backgroundColor: stop.color,
                borderColor: selectedStopId === stop.id ? "var(--b-accent)" : "#fff",
                transform: selectedStopId === stop.id ? "scale(1.2)" : "scale(1)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Type + Angle */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-md" style={{ backgroundColor: "var(--b-surface)", border: "1px solid var(--b-border)" }}>
          {(["linear", "radial"] as const).map((t) => (
            <button
              key={t}
              onClick={() => emit({ ...state, type: t })}
              className="px-2.5 py-1 text-[10px] font-semibold capitalize transition-colors"
              style={{
                backgroundColor: state.type === t ? "var(--b-accent-soft)" : "transparent",
                color: state.type === t ? "var(--b-accent)" : "var(--b-text-3)",
                borderRadius: 5,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {state.type === "linear" && (
          <div className="flex flex-1 items-center gap-1.5">
            <span className="text-[9px] font-semibold" style={{ color: "var(--b-text-4)" }}>Angle</span>
            <input
              type="range"
              min={0}
              max={360}
              value={state.angle}
              onChange={(e) => emit({ ...state, angle: parseInt(e.target.value, 10) })}
              className="h-1 flex-1 appearance-none rounded-full"
              style={{ background: "var(--b-surface)" }}
            />
            <span className="w-8 text-right text-[10px] font-mono" style={{ color: "var(--b-text-3)" }}>{state.angle}°</span>
          </div>
        )}
      </div>

      {/* Radial position grid */}
      {state.type === "radial" && (
        <div>
          <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-4)" }}>Center</span>
          <div className="grid grid-cols-3 gap-1">
            {RADIAL_POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => emit({ ...state, radialPosition: pos })}
                className="rounded-md py-1 text-[8px] font-medium transition-colors"
                style={{
                  backgroundColor: state.radialPosition === pos ? "var(--b-accent-soft)" : "var(--b-surface)",
                  color: state.radialPosition === pos ? "var(--b-accent)" : "var(--b-text-4)",
                  border: `1px solid ${state.radialPosition === pos ? "var(--b-accent-mid)" : "var(--b-border)"}`,
                }}
              >
                {pos.replace("center", "mid")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected stop color */}
      {selectedStop && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-4)" }}>
              Stop Color ({selectedStop.position}%)
            </span>
            {state.stops.length > 2 && (
              <button
                onClick={() => removeStop(selectedStop.id)}
                className="flex h-5 w-5 items-center justify-center rounded transition-colors"
                style={{ color: "var(--b-danger)" }}
                title="Remove stop"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <AdvancedColorInput
            value={selectedStop.color}
            onChange={(c) => updateStopColor(selectedStop.id, c)}
          />
        </div>
      )}

      {/* Presets */}
      <div>
        <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-4)" }}>Presets</span>
        <div className="grid grid-cols-4 gap-1">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                const parsed = parseGradientCSS(preset.value);
                if (parsed) {
                  setState(parsed);
                  onChange(preset.value);
                }
              }}
              className="group relative h-6 rounded-md transition-transform hover:scale-105"
              style={{ background: preset.value, border: "1px solid var(--b-border)" }}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* CSS output */}
      <div
        className="cursor-text select-all rounded-md px-2 py-1.5 text-[9px] font-mono leading-relaxed break-all"
        style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text-3)", border: "1px solid var(--b-border)" }}
      >
        {previewCSS}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the component compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/builder/gradient-editor.tsx
git commit -m "feat: add gradient editor component with draggable stops and presets"
```

---

## Task 3: Integrate Gradient Editor into Properties Panel

**Files:**
- Modify: `src/components/builder/block-properties-panel.tsx`

- [ ] **Step 1: Add imports**

At the top of `block-properties-panel.tsx`, add the import:

```typescript
import { GradientEditor } from "@/components/builder/gradient-editor";
```

Also add `useState` to the React import if not already present.

- [ ] **Step 2: Add gradient toggle + editor in the Appearance section**

Find the Appearance section (around line 399) where the background color `<SubLabel>Background</SubLabel>` and `<AdvancedColorInput>` are. After the background color picker (around line 408), add the gradient editor:

```typescript
{/* Gradient */}
<div className="mt-2">
  <div className="mb-1.5 flex items-center justify-between">
    <SubLabel>Gradient</SubLabel>
    <button
      onClick={() => {
        if (styles.backgroundGradient) {
          updateStyle("backgroundGradient", undefined);
        } else {
          updateStyle("backgroundGradient", "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)");
        }
      }}
      className="rounded px-1.5 py-0.5 text-[9px] font-semibold transition-colors"
      style={{
        backgroundColor: styles.backgroundGradient ? "var(--b-accent-soft)" : "var(--b-surface)",
        color: styles.backgroundGradient ? "var(--b-accent)" : "var(--b-text-4)",
      }}
    >
      {styles.backgroundGradient ? "On" : "Off"}
    </button>
  </div>
  {styles.backgroundGradient && (
    <GradientEditor
      value={styles.backgroundGradient as string}
      onChange={(v) => updateStyle("backgroundGradient", v)}
    />
  )}
</div>
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/builder/block-properties-panel.tsx
git commit -m "feat: integrate gradient editor in block properties panel"
```

---

## Task 4: Database Migration — Asset and CustomFont Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Asset model to schema.prisma**

Add after the existing `PortfolioView` model:

```prisma
model Asset {
  id           String   @id @default(cuid())
  userId       String
  name         String
  url          String
  thumbnailUrl String?
  type         String   // "image" | "svg"
  size         Int
  width        Int?
  height       Int?
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])
}
```

- [ ] **Step 2: Add CustomFont model**

Add after the Asset model:

```prisma
model CustomFont {
  id          String   @id @default(cuid())
  userId      String
  portfolioId String
  name        String
  url         String
  format      String   // "woff2" | "woff" | "ttf"
  createdAt   DateTime @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@unique([portfolioId, name])
  @@index([portfolioId])
}
```

- [ ] **Step 3: Add relations to User and Portfolio models**

In the `User` model, add:
```prisma
  assets      Asset[]
  customFonts CustomFont[]
```

In the `Portfolio` model, add:
```prisma
  customFonts CustomFont[]
```

- [ ] **Step 4: Generate Prisma client and migrate**

```bash
npx prisma generate
npx prisma db push
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Asset and CustomFont database models"
```

---

## Task 5: Asset Library API Routes

**Files:**
- Create: `src/app/api/assets/route.ts`
- Create: `src/app/api/assets/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/assets/route.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await db.asset.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, url, thumbnailUrl, type, size, width, height } = body;

  if (!name || !url || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const count = await db.asset.count({ where: { userId: session.user.id } });
  if (count >= 100) {
    return NextResponse.json({ error: "Asset limit reached (100)" }, { status: 400 });
  }

  const asset = await db.asset.create({
    data: {
      userId: session.user.id,
      name,
      url,
      thumbnailUrl: thumbnailUrl ?? null,
      type,
      size: size ?? 0,
      width: width ?? null,
      height: height ?? null,
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
```

- [ ] **Step 2: Create `src/app/api/assets/[id]/route.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await db.asset.findFirst({ where: { id, userId: session.user.id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await db.asset.findFirst({ where: { id, userId: session.user.id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await db.asset.update({
    where: { id },
    data: { name: body.name ?? asset.name },
  });

  return NextResponse.json(updated);
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/assets/
git commit -m "feat: add asset library API routes (GET, POST, DELETE, PATCH)"
```

---

## Task 6: Assets Tab in Left Panel

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

- [ ] **Step 1: Add imports**

Add to the lucide-react imports:

```typescript
import { ImageIcon, Upload, Wand2 } from "lucide-react";
```

Note: `Image` is already imported — use `ImageIcon` alias if needed, or reuse the existing `Image` import. Also add:

```typescript
import type { Asset } from "@/types";
```

And add the API imports if not already:
```typescript
import { apiGet, apiPost, apiDelete } from "@/lib/api";
```

- [ ] **Step 2: Update left tab state type**

Find the `leftTab` state (around line 835):
```typescript
const [leftTab, setLeftTab] = useState<"layers" | "elements" | "shapes">("layers");
```

Change to:
```typescript
const [leftTab, setLeftTab] = useState<"layers" | "elements" | "shapes" | "assets">("layers");
```

- [ ] **Step 3: Add asset state and fetch**

After the `leftTab` state, add:

```typescript
const [assets, setAssets] = useState<Asset[]>([]);
const [assetsLoading, setAssetsLoading] = useState(false);
const [assetSearch, setAssetSearch] = useState("");

useEffect(() => {
  setAssetsLoading(true);
  apiGet<Asset[]>("/assets")
    .then(setAssets)
    .catch(() => {})
    .finally(() => setAssetsLoading(false));
}, []);

const filteredAssets = assetSearch
  ? assets.filter((a) => a.name.toLowerCase().includes(assetSearch.toLowerCase()))
  : assets;

const handleAssetUpload = async (file: File) => {
  if (!file.type.startsWith("image/") && file.type !== "image/svg+xml") return;
  if (file.size > 10 * 1024 * 1024) return;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.secure_url) {
      const asset = await apiPost<Asset>("/assets", {
        name: file.name,
        url: data.secure_url,
        thumbnailUrl: data.secure_url.replace("/upload/", "/upload/w_200,h_200,c_fill/"),
        type: file.type.startsWith("image/svg") ? "svg" : "image",
        size: file.size,
        width: data.width ?? null,
        height: data.height ?? null,
      });
      setAssets((prev) => [asset, ...prev]);
    }
  } catch { /* ignore */ }
};

const handleDeleteAsset = async (assetId: string) => {
  try {
    await apiDelete(`/assets/${assetId}`);
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  } catch { /* ignore */ }
};
```

- [ ] **Step 4: Add Assets tab button**

Find the tab definitions (around line 3329). Add the 4th tab:

```typescript
{ id: "assets" as const, label: "Assets", icon: <Image className="h-3 w-3" /> },
```

- [ ] **Step 5: Add Assets tab content**

After the Shapes tab closing `)}` (around line 3682), add the Assets tab:

```typescript
{/* ── Assets Tab ─────────────────────────────────────── */}
{leftTab === "assets" && (
  <div className="flex flex-1 flex-col overflow-hidden">
    {/* Upload + Search */}
    <div className="flex flex-shrink-0 items-center gap-1.5 px-2.5 py-2" style={{ borderBottom: "1px solid var(--b-border)" }}>
      <input
        type="text"
        value={assetSearch}
        onChange={(e) => setAssetSearch(e.target.value)}
        placeholder="Search assets..."
        className="h-7 flex-1 rounded-md border-0 px-2 text-[11px] outline-none"
        style={{ backgroundColor: "var(--b-input-bg)", color: "var(--b-text)" }}
      />
      <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors" style={{ backgroundColor: "var(--b-accent-soft)", color: "var(--b-accent)" }}>
        <Upload className="h-3.5 w-3.5" />
        <input
          type="file"
          accept="image/*,.svg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAssetUpload(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>

    {/* Asset grid */}
    <div
      className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-auto"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleAssetUpload(file);
      }}
    >
      {assetsLoading && (
        <p className="py-8 text-center text-[11px]" style={{ color: "var(--b-text-4)" }}>Loading...</p>
      )}
      {!assetsLoading && filteredAssets.length === 0 && (
        <div className="builder-empty-state flex flex-col items-center gap-3 px-4 py-12 text-center">
          <div className="builder-empty-icon flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--b-accent-soft)", border: "1px dashed var(--b-accent-mid)" }}>
            <Image className="h-5 w-5" style={{ color: "var(--b-accent)" }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold" style={{ color: "var(--b-text-2)" }}>No assets yet</p>
            <p className="mt-1 text-[10px] leading-relaxed" style={{ color: "var(--b-text-4)" }}>
              Upload images to reuse across<br />your portfolio. Drag & drop or click <span style={{ color: "var(--b-accent)" }}>+</span>
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="group relative cursor-pointer overflow-hidden rounded-lg transition-all duration-150"
            style={{ backgroundColor: "var(--b-surface)", border: "1px solid var(--b-border)" }}
            onClick={() => {
              const targetSection = selectedSectionId ?? portfolio.sections[0]?.id;
              if (targetSection) {
                addBlock(targetSection, "image" as BlockType, {
                  content: { src: asset.url, alt: asset.name, objectFit: "cover", aspectRatio: "16/9" },
                });
              }
            }}
          >
            <div className="aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.thumbnailUrl ?? asset.url}
                alt={asset.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="px-1.5 py-1">
              <p className="truncate text-[9px] font-medium" style={{ color: "var(--b-text-3)" }}>{asset.name}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100"
              style={{ backgroundColor: "var(--b-panel)", color: "var(--b-danger)" }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/components/builder/builder-workspace.tsx
git commit -m "feat: add assets tab in left panel with upload, grid, and insert"
```

---

## Task 7: Custom Font API Routes

**Files:**
- Create: `src/app/api/portfolios/[id]/fonts/route.ts`
- Create: `src/app/api/portfolios/[id]/fonts/[fontId]/route.ts`

- [ ] **Step 1: Create `src/app/api/portfolios/[id]/fonts/route.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: portfolioId } = await params;
  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: session.user.id } });
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fonts = await db.customFont.findMany({
    where: { portfolioId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(fonts);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: portfolioId } = await params;
  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: session.user.id } });
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, url, format } = body;

  if (!name || !url || !format) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const count = await db.customFont.count({ where: { portfolioId } });
  if (count >= 5) {
    return NextResponse.json({ error: "Font limit reached (5 per portfolio)" }, { status: 400 });
  }

  const font = await db.customFont.create({
    data: {
      userId: session.user.id,
      portfolioId,
      name,
      url,
      format,
    },
  });

  return NextResponse.json(font, { status: 201 });
}
```

- [ ] **Step 2: Create `src/app/api/portfolios/[id]/fonts/[fontId]/route.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; fontId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: portfolioId, fontId } = await params;
  const font = await db.customFont.findFirst({
    where: { id: fontId, portfolioId, userId: session.user.id },
  });
  if (!font) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.customFont.delete({ where: { id: fontId } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/portfolios/
git commit -m "feat: add custom font API routes (GET, POST, DELETE)"
```

---

## Task 8: Custom Font Upload in Theme Editor

**Files:**
- Modify: `src/components/builder/theme-editor.tsx`
- Modify: `src/components/portfolio/portfolio-renderer.tsx`

- [ ] **Step 1: Add custom font state and upload to theme-editor.tsx**

Add imports at the top:

```typescript
import { Upload, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { CustomFont } from "@/types";
```

Inside the `ThemeEditor` component, add state after existing state declarations:

```typescript
const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
const [uploadingFont, setUploadingFont] = useState(false);

useEffect(() => {
  apiGet<CustomFont[]>(`/portfolios/${portfolioId}/fonts`)
    .then(setCustomFonts)
    .catch(() => {});
}, [portfolioId]);

const handleFontUpload = async (file: File) => {
  const validExts = [".woff2", ".woff", ".ttf"];
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!validExts.includes(ext)) return;
  if (file.size > 2 * 1024 * 1024) return;

  setUploadingFont(true);
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("resource_type", "raw");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) return;

    const name = file.name.replace(/\.(woff2?|ttf)$/i, "");
    const format = ext.replace(".", "");
    const font = await apiPost<CustomFont>(`/portfolios/${portfolioId}/fonts`, {
      name,
      url: data.secure_url,
      format,
    });
    setCustomFonts((prev) => [font, ...prev]);
  } catch { /* ignore */ }
  setUploadingFont(false);
};

const handleDeleteFont = async (fontId: string) => {
  try {
    await apiDelete(`/portfolios/${portfolioId}/fonts/${fontId}`);
    setCustomFonts((prev) => prev.filter((f) => f.id !== fontId));
  } catch { /* ignore */ }
};
```

- [ ] **Step 2: Replace font `<select>` dropdowns with custom font support**

Find the Heading font select (around line 302). Replace the `<select>` for both Heading and Body fonts with a version that includes custom fonts:

For each font dropdown (Heading and Body), replace the `<select>` contents:

```typescript
{FONT_OPTIONS.map((f) => (
  <option key={f.value} value={f.value}>{f.label}</option>
))}
{customFonts.length > 0 && (
  <optgroup label="Custom Fonts">
    {customFonts.map((f) => (
      <option key={f.id} value={f.name}>{f.name}</option>
    ))}
  </optgroup>
)}
```

- [ ] **Step 3: Add font upload button below the font dropdowns**

After the Body font dropdown, add:

```typescript
{/* Custom Font Upload */}
<div className="mt-2 flex items-center gap-1.5">
  <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-semibold transition-colors" style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text-3)", border: "1px dashed var(--b-border)" }}>
    <Upload className="h-3 w-3" />
    {uploadingFont ? "Uploading..." : "Upload font"}
    <input
      type="file"
      accept=".woff2,.woff,.ttf"
      className="hidden"
      disabled={uploadingFont}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFontUpload(file);
        e.target.value = "";
      }}
    />
  </label>
</div>
{customFonts.length > 0 && (
  <div className="mt-2 space-y-1">
    <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-4)" }}>Custom Fonts ({customFonts.length}/5)</span>
    {customFonts.map((f) => (
      <div key={f.id} className="flex items-center justify-between rounded-md px-2 py-1" style={{ backgroundColor: "var(--b-surface)" }}>
        <span className="truncate text-[10px] font-medium" style={{ color: "var(--b-text-2)" }}>{f.name}</span>
        <button onClick={() => handleDeleteFont(f.id)} className="flex-shrink-0" style={{ color: "var(--b-danger)" }}>
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 4: Add @font-face injection for custom fonts in portfolio-renderer.tsx**

Find the existing `useEffect` in `portfolio-renderer.tsx` that loads Google Fonts (it injects a `<link>` element for Google Fonts). After it, add a new effect:

```typescript
// ── Load custom fonts via @font-face ──
useEffect(() => {
  if (!portfolio.customFonts || portfolio.customFonts.length === 0) return;
  const styleId = "custom-fonts-style";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  const css = (portfolio.customFonts as Array<{ name: string; url: string; format: string }>)
    .map((f) => `@font-face { font-family: "${f.name}"; src: url("${f.url}") format("${f.format === "ttf" ? "truetype" : f.format}"); font-display: swap; }`)
    .join("\n");
  styleEl.textContent = css;
  return () => { if (styleEl) styleEl.textContent = ""; };
}, [portfolio.customFonts]);
```

Note: The `portfolio` object needs to include `customFonts`. This requires updating the portfolio fetch query to include `customFonts` in the `include` clause. Find the portfolio GET API route (`src/app/api/portfolios/[id]/route.ts`) and add `customFonts: true` to the Prisma include.

- [ ] **Step 5: Update portfolio GET route to include customFonts**

In `src/app/api/portfolios/[id]/route.ts`, find the `db.portfolio.findFirst` call and add `customFonts: true` to the `include` object.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/components/builder/theme-editor.tsx src/components/portfolio/portfolio-renderer.tsx src/app/api/portfolios/
git commit -m "feat: add custom font upload in theme editor with @font-face injection"
```

---

## Task 9: Responsive Auto-Adapt Utility

**Files:**
- Create: `src/lib/utils/responsive-adapt.ts`

- [ ] **Step 1: Create the auto-adapt utility**

```typescript
import type { BlockStyles, BlockWithStyles } from "@/types";

interface LayoutResult {
  blockId: string;
  tabletStyles: Partial<BlockStyles>;
  mobileStyles: Partial<BlockStyles>;
}

interface FrameResult {
  tabletWidth: number;
  tabletHeight: number;
  mobileWidth: number;
  mobileHeight: number;
}

interface AdaptResult {
  blocks: LayoutResult[];
  frame: FrameResult;
}

interface VisualRow {
  blocks: BlockWithStyles[];
  minY: number;
  maxY: number;
}

function detectRows(blocks: BlockWithStyles[]): VisualRow[] {
  const sorted = [...blocks].sort((a, b) => (a.styles.y ?? 0) - (b.styles.y ?? 0));
  const rows: VisualRow[] = [];

  for (const block of sorted) {
    const bs = block.styles as BlockStyles;
    const by = bs.y ?? 0;
    const bh = bs.h ?? 40;
    const blockTop = by;
    const blockBottom = by + bh;

    let placed = false;
    for (const row of rows) {
      const overlapStart = Math.max(blockTop, row.minY);
      const overlapEnd = Math.min(blockBottom, row.maxY);
      const overlap = Math.max(0, overlapEnd - overlapStart);
      const blockHeight = blockBottom - blockTop;
      if (blockHeight > 0 && overlap / blockHeight > 0.5) {
        row.blocks.push(block);
        row.minY = Math.min(row.minY, blockTop);
        row.maxY = Math.max(row.maxY, blockBottom);
        placed = true;
        break;
      }
    }

    if (!placed) {
      rows.push({ blocks: [block], minY: blockTop, maxY: blockBottom });
    }
  }

  // Sort blocks within each row left-to-right
  for (const row of rows) {
    row.blocks.sort((a, b) => (a.styles.x ?? 0) - (b.styles.x ?? 0));
  }

  // Sort rows top-to-bottom
  rows.sort((a, b) => a.minY - b.minY);

  return rows;
}

export function generateResponsiveLayouts(
  blocks: BlockWithStyles[],
  frameWidth: number,
  frameHeight: number,
): AdaptResult {
  const TABLET_WIDTH = 768;
  const MOBILE_WIDTH = 375;
  const MOBILE_PAD = 16;
  const MOBILE_GAP = 16;

  // Filter to top-level, visible, unlocked blocks without existing overrides
  const eligible = blocks.filter((b) => {
    if (!b.isVisible || b.isLocked || b.parentId) return false;
    const hasTablet = b.tabletStyles && Object.keys(b.tabletStyles as object).length > 0;
    const hasMobile = b.mobileStyles && Object.keys(b.mobileStyles as object).length > 0;
    return !hasTablet && !hasMobile;
  });

  const rows = detectRows(eligible);
  const tabletScale = TABLET_WIDTH / frameWidth;
  const results: LayoutResult[] = [];

  // ── Tablet ────────────────────────────────────────────────
  let tabletY = 0;
  for (const row of rows) {
    let rowMaxH = 0;
    for (const block of row.blocks) {
      const bs = block.styles as BlockStyles;
      const tx = Math.round((bs.x ?? 0) * tabletScale);
      const tw = Math.round((bs.w ?? 200) * tabletScale);
      const th = bs.h ?? 40;
      const fontSize = bs.fontSize ? Math.round(bs.fontSize * 0.85) : undefined;

      const existing = results.find((r) => r.blockId === block.id);
      const tabletStyles: Partial<BlockStyles> = {
        x: tx,
        y: Math.round(tabletY),
        w: tw,
        ...(fontSize ? { fontSize } : {}),
      };

      if (existing) {
        existing.tabletStyles = tabletStyles;
      } else {
        results.push({ blockId: block.id, tabletStyles, mobileStyles: {} });
      }

      rowMaxH = Math.max(rowMaxH, th);
    }
    tabletY += rowMaxH + 16;
  }
  const tabletHeight = Math.max(tabletY, 400);

  // ── Mobile ────────────────────────────────────────────────
  let mobileY = MOBILE_PAD;
  for (const row of rows) {
    for (const block of row.blocks) {
      const bs = block.styles as BlockStyles;
      const mw = MOBILE_WIDTH - MOBILE_PAD * 2;
      const mh = bs.h ?? 40;
      const fontSize = bs.fontSize ? Math.round(bs.fontSize * 0.75) : undefined;

      const mobileStyles: Partial<BlockStyles> = {
        x: MOBILE_PAD,
        y: Math.round(mobileY),
        w: mw,
        ...(fontSize ? { fontSize } : {}),
      };

      const existing = results.find((r) => r.blockId === block.id);
      if (existing) {
        existing.mobileStyles = mobileStyles;
      } else {
        results.push({ blockId: block.id, tabletStyles: {}, mobileStyles });
      }

      mobileY += mh + MOBILE_GAP;
    }
  }
  const mobileHeight = Math.max(mobileY + MOBILE_PAD, 400);

  return {
    blocks: results,
    frame: {
      tabletWidth: TABLET_WIDTH,
      tabletHeight: Math.round(tabletHeight),
      mobileWidth: MOBILE_WIDTH,
      mobileHeight: Math.round(mobileHeight),
    },
  };
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/responsive-adapt.ts
git commit -m "feat: add responsive auto-adapt layout utility"
```

---

## Task 10: Auto-Adapt Button in Toolbar

**Files:**
- Modify: `src/components/builder/builder-workspace.tsx`

- [ ] **Step 1: Add import**

```typescript
import { generateResponsiveLayouts } from "@/lib/utils/responsive-adapt";
```

Add `Wand2` to the lucide-react imports if not added in Task 6.

- [ ] **Step 2: Add auto-adapt handler**

Near the other handler functions (around the `fitToScreen` definition), add:

```typescript
const [showAdaptConfirm, setShowAdaptConfirm] = useState(false);

const handleAutoAdapt = useCallback(() => {
  builderStore.pushSnapshot("auto-adapt");

  for (const section of visibleSections) {
    const ss = section.styles as SectionStyles;
    const fw = ss.frameWidth ?? DEFAULT_FRAME_WIDTH;
    const fh = ss.frameHeight ?? DEFAULT_FRAME_HEIGHT;

    const result = generateResponsiveLayouts(section.blocks, fw, fh);

    for (const override of result.blocks) {
      if (Object.keys(override.tabletStyles).length > 0) {
        portfolioStore.updateBlockInSection(section.id, override.blockId, {
          tabletStyles: override.tabletStyles,
        } as Partial<BlockWithStyles>);
      }
      if (Object.keys(override.mobileStyles).length > 0) {
        portfolioStore.updateBlockInSection(section.id, override.blockId, {
          mobileStyles: override.mobileStyles,
        } as Partial<BlockWithStyles>);
      }
    }
  }

  builderStore.setDirty(true);
  scheduleAutoSave();
  setShowAdaptConfirm(false);
}, [visibleSections, portfolioStore, builderStore, scheduleAutoSave]);
```

- [ ] **Step 3: Add auto-adapt button in the toolbar**

Find the device preview toggle area (around line 3089, the `div` with the desktop/tablet/mobile buttons). After the closing `</div>` of the device toggle group, add:

```typescript
<button
  className="builder-toolbar-btn flex h-7 w-7 items-center justify-center rounded-md"
  style={{
    color: builderStore.devicePreview === "desktop" ? "var(--b-text-2)" : "var(--b-text-4)",
    opacity: builderStore.devicePreview === "desktop" ? 1 : 0.4,
  }}
  onClick={() => setShowAdaptConfirm(true)}
  disabled={builderStore.devicePreview !== "desktop"}
  title={builderStore.devicePreview === "desktop" ? "Auto-generate responsive layouts" : "Switch to desktop view first"}
>
  <Wand2 className="h-3.5 w-3.5" />
</button>
```

- [ ] **Step 4: Add confirm dialog**

Find where other `ConfirmDialog` components are rendered (near the bottom of the return JSX). Add:

```typescript
<ConfirmDialog
  open={showAdaptConfirm}
  onClose={() => setShowAdaptConfirm(false)}
  onConfirm={handleAutoAdapt}
  title="Auto-generate responsive layouts?"
  description="This will create tablet (768px) and mobile (375px) layouts based on your desktop design. Blocks with existing responsive overrides will be skipped."
  confirmText="Generate"
  variant="default"
/>
```

Note: If `ConfirmDialog` doesn't support `variant="default"` (only has `"danger"`), just omit the `variant` prop.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/components/builder/builder-workspace.tsx
git commit -m "feat: add responsive auto-adapt button in toolbar with confirm dialog"
```

---

## Task 11: Image Upload Library Tab Integration

**Files:**
- Modify: `src/components/common/image-upload.tsx`

- [ ] **Step 1: Add Library tab to image-upload.tsx**

Add imports:

```typescript
import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";
import type { Asset } from "@/types";
```

Inside the `ImageUpload` component, add state for the library:

```typescript
const [showLibrary, setShowLibrary] = useState(false);
const [libraryAssets, setLibraryAssets] = useState<Asset[]>([]);
const [libraryLoaded, setLibraryLoaded] = useState(false);

const loadLibrary = () => {
  if (libraryLoaded) { setShowLibrary(true); return; }
  apiGet<Asset[]>("/assets")
    .then((a) => { setLibraryAssets(a); setLibraryLoaded(true); setShowLibrary(true); })
    .catch(() => {});
};
```

In the JSX, add a "Library" button above the upload area. In the full mode (non-compact), find the upload/drop zone and add a toggle row above it:

```typescript
<div className="mb-2 flex gap-1">
  <button
    onClick={() => setShowLibrary(false)}
    className="flex-1 rounded-md py-1 text-[10px] font-semibold transition-colors"
    style={{
      backgroundColor: !showLibrary ? "var(--b-accent-soft)" : "transparent",
      color: !showLibrary ? "var(--b-accent)" : "var(--b-text-4)",
    }}
  >
    Upload
  </button>
  <button
    onClick={loadLibrary}
    className="flex-1 rounded-md py-1 text-[10px] font-semibold transition-colors"
    style={{
      backgroundColor: showLibrary ? "var(--b-accent-soft)" : "transparent",
      color: showLibrary ? "var(--b-accent)" : "var(--b-text-4)",
    }}
  >
    Library
  </button>
</div>
```

When `showLibrary` is true, show the asset grid instead of the upload area:

```typescript
{showLibrary ? (
  <div className="grid grid-cols-3 gap-1 max-h-[200px] overflow-y-auto">
    {libraryAssets.filter((a) => a.type === "image").map((asset) => (
      <button
        key={asset.id}
        onClick={() => { onChange(asset.url); setShowLibrary(false); }}
        className="overflow-hidden rounded-md transition-transform hover:scale-105"
        style={{ border: "1px solid var(--b-border)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.thumbnailUrl ?? asset.url} alt={asset.name} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
      </button>
    ))}
    {libraryAssets.filter((a) => a.type === "image").length === 0 && (
      <p className="col-span-3 py-4 text-center text-[10px]" style={{ color: "var(--b-text-4)" }}>No images in library</p>
    )}
  </div>
) : (
  /* existing upload UI */
)}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/common/image-upload.tsx
git commit -m "feat: add library tab to image upload for reusing assets"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Lint check**

```bash
npx next lint --quiet
```

- [ ] **Step 3: Dev server smoke test**

```bash
npm run dev
```

Open the studio in browser and verify:
1. Gradient toggle appears in block Appearance section
2. Gradient editor: add/remove/drag stops, change type/angle, presets work
3. Assets tab appears in left panel, upload works, clicking inserts image block
4. Theme editor shows "Upload font" button, uploaded fonts appear in dropdown
5. Auto-adapt button appears next to device preview, generates tablet/mobile layouts
6. Image upload component shows Library/Upload tabs

- [ ] **Step 4: Commit any final fixes if needed**
