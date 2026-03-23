"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  FileJson,
  Globe,
  GripVertical,
  Layers,
  Layout,
  LayoutGrid,
  Loader2,
  Lock,
  Maximize,
  Monitor,
  Moon,
  MousePointer2,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  Save,
  Settings,
  Smartphone,
  Sun,
  Tablet,
  Trash2,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BlockRenderer } from "@/components/builder/block-renderer";
import { BlockPropertiesPanel } from "@/components/builder/block-properties-panel";
import { ImageUpload } from "@/components/common/image-upload";
import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer";
import {
  CanvasEngine,
  ZoomControls,
  type CanvasTransform,
} from "@/components/builder/canvas-engine";
import {
  CanvasElement,
  CanvasFrame,
  SmartGuides,
  type GuideInfo,
} from "@/components/builder/canvas-element";
import { ThemeEditor } from "@/components/builder/theme-editor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  BLOCK_REGISTRY,
  BLOCK_CATEGORIES,
  getBlocksByCategory,
} from "@/config/block-registry";
import { apiPatch, apiPut, apiPost, apiDelete } from "@/lib/api";
import { useBuilderStore } from "@/stores/builder-store";
import { usePortfolioStore } from "@/stores/portfolio-store";
import type {
  PortfolioWithRelations,
  SectionWithBlocks,
  BlockWithStyles,
  BlockType,
  BlockStyles,
  ThemeTokens,
  SectionStyles,
  PortfolioStatus,
} from "@/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Constants ───────────────────────────────────────────────────

const DEFAULT_FRAME_WIDTH = 1440;
const DEFAULT_FRAME_HEIGHT = 800;
const DEFAULT_BLOCK_W = 600;
const DEFAULT_BLOCK_H = 0;

type StudioTheme = "dark" | "light";

function getThemeTokens(p: PortfolioWithRelations): ThemeTokens {
  const t = p.theme;
  return {
    mode: t?.mode ?? "DARK",
    primaryColor: t?.primaryColor ?? "#06b6d4",
    secondaryColor: t?.secondaryColor ?? "#8b5cf6",
    accentColor: t?.accentColor ?? "#f43f5e",
    backgroundColor: t?.backgroundColor ?? "#0f172a",
    surfaceColor: t?.surfaceColor ?? "#1e293b",
    textColor: t?.textColor ?? "#f8fafc",
    mutedColor: t?.mutedColor ?? "#94a3b8",
    fontHeading: t?.fontHeading ?? "Outfit",
    fontBody: t?.fontBody ?? "DM Sans",
    fontMono: t?.fontMono ?? "JetBrains Mono",
    borderRadius: t?.borderRadius ?? "0.5rem",
  };
}

// ─── Sortable Wrapper ────────────────────────────────────────────

function SortableItem({ id, children }: { id: string; children: (props: { style: React.CSSProperties; ref: (el: HTMLElement | null) => void; listeners: ReturnType<typeof useSortable>["listeners"]; attributes: ReturnType<typeof useSortable>["attributes"]; isDragging: boolean }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 50 : undefined,
  };
  return <>{children({ style, ref: setNodeRef, listeners, attributes, isDragging })}</>;
}

// ─── Layer Block Item ────────────────────────────────────────────

const LayerBlockItem = memo(function LayerBlockItem({
  block,
  isSelected,
  onSelect,
  onDelete,
  dragHandleProps,
}: {
  block: BlockWithStyles;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  const def = BLOCK_REGISTRY[block.type as keyof typeof BLOCK_REGISTRY];
  const label = def?.label ?? block.type;
  const content = block.content as Record<string, unknown>;
  const preview =
    (content.text as string) ??
    (content.name as string) ??
    (content.title as string) ??
    "";

  return (
    <div
      className="builder-layer-item group flex cursor-pointer items-center gap-1.5 px-2.5 py-[5px]"
      style={{
        backgroundColor: isSelected ? "var(--b-accent-soft)" : "transparent",
        color: isSelected ? "var(--b-accent)" : "var(--b-text-2)",
        opacity: block.isVisible ? 1 : 0.35,
        borderLeft: isSelected ? "2px solid var(--b-accent)" : "2px solid transparent",
      }}
      onClick={onSelect}
    >
      <GripVertical className="h-2.5 w-2.5 flex-shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-30" {...(dragHandleProps ?? {})} />
      <span
        className="w-12 flex-shrink-0 truncate text-[9px] font-bold uppercase tracking-wider"
        style={{ color: isSelected ? "var(--b-accent)" : "var(--b-text-4)" }}
      >
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[10px]" style={{ color: "var(--b-text-3)" }}>
        {preview}
      </span>
      {block.isLocked && <Lock className="h-2.5 w-2.5 flex-shrink-0" style={{ color: "var(--b-text-4)" }} />}
      {!block.isVisible && <EyeOff className="h-2.5 w-2.5 flex-shrink-0" style={{ color: "var(--b-text-4)" }} />}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-40 hover:!opacity-100"
        style={{ color: "var(--b-danger)" }}
      >
        <Trash2 className="h-2.5 w-2.5" />
      </button>
    </div>
  );
});

// ═════════════════════════════════════════════════════════════════
//  MAIN BUILDER WORKSPACE
// ═════════════════════════════════════════════════════════════════

/* ── SEO Editor Panel ─────────────────────────────────────────── */

function SeoEditor({ portfolioId, portfolio }: { portfolioId: string; portfolio: PortfolioWithRelations }) {
  const [seoTitle, setSeoTitle] = useState(portfolio.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(portfolio.seoDescription ?? "");
  const [ogImage, setOgImage] = useState(portfolio.ogImageUrl ?? "");
  const [accessPassword, setAccessPassword] = useState(portfolio.accessPassword ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiPatch(`/portfolios/${portfolioId}`, {
        seoTitle: seoTitle || undefined,
        seoDescription: seoDesc || undefined,
        ogImageUrl: ogImage || undefined,
        accessPassword: accessPassword || "",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3.5 py-3" style={{ borderBottom: "1px solid var(--b-border)" }}>
        <div className="text-[12px] font-semibold" style={{ color: "var(--b-text)" }}>SEO Settings</div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md px-3 py-1 text-[10px] font-semibold transition-all"
          style={{ backgroundColor: saved ? "rgba(16,185,129,0.15)" : "var(--b-accent-soft)", color: saved ? "#10b981" : "var(--b-accent)" }}
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-3)" }}>Meta Title</span>
            <span className="text-[9px] font-mono" style={{ color: seoTitle.length > 60 ? "var(--b-danger)" : "var(--b-text-4)" }}>{seoTitle.length}/60</span>
          </div>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder={portfolio.title}
            maxLength={60}
            className="h-7 w-full rounded-md border px-2.5 text-[11px] outline-none transition-colors focus:border-[var(--b-accent)]"
            style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
          />
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-3)" }}>Meta Description</span>
            <span className="text-[9px] font-mono" style={{ color: seoDesc.length > 160 ? "var(--b-danger)" : "var(--b-text-4)" }}>{seoDesc.length}/160</span>
          </div>
          <textarea
            value={seoDesc}
            onChange={(e) => setSeoDesc(e.target.value)}
            placeholder={portfolio.description ?? "Describe your portfolio..."}
            maxLength={160}
            rows={3}
            className="w-full rounded-md border px-2.5 py-2 text-[11px] outline-none transition-colors focus:border-[var(--b-accent)] resize-none"
            style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
          />
        </div>

        {/* OG Image */}
        <div>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-3)" }}>OG Image</span>
          <ImageUpload
            value={ogImage}
            onChange={(v) => setOgImage(v)}
          />
          <input
            type="text"
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="Or paste URL..."
            className="mt-2 h-7 w-full rounded-md border px-2.5 text-[11px] outline-none transition-colors focus:border-[var(--b-accent)]"
            style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
          />
        </div>

        {/* Google Preview */}
        <div>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-3)" }}>Search Preview</span>
          <div className="rounded-lg border p-3" style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)" }}>
            <p className="truncate text-[13px] font-medium" style={{ color: "#8ab4f8" }}>
              {seoTitle || portfolio.title}
            </p>
            <p className="truncate text-[11px] mt-0.5" style={{ color: "#bdc1c6" }}>
              foliocraft.com/portfolio/{portfolio.user?.username}/{portfolio.slug}
            </p>
            <p className="mt-1 text-[11px] line-clamp-2 leading-relaxed" style={{ color: "var(--b-text-3)" }}>
              {seoDesc || portfolio.description || "No description set."}
            </p>
          </div>
        </div>

        {/* Twitter Card Preview */}
        <div>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-3)" }}>Twitter Card Preview</span>
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--b-border)" }}>
            {ogImage && (
              <div style={{ aspectRatio: "2/1", overflow: "hidden", backgroundColor: "var(--b-surface)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ogImage} alt="Twitter Card" className="h-full w-full" style={{ objectFit: "cover" }} />
              </div>
            )}
            <div className="p-2.5" style={{ backgroundColor: "var(--b-surface)" }}>
              <p className="truncate text-[12px] font-semibold" style={{ color: "var(--b-text)" }}>
                {seoTitle || portfolio.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug" style={{ color: "var(--b-text-3)" }}>
                {seoDesc || portfolio.description || "No description set."}
              </p>
              <p className="mt-1 text-[9px]" style={{ color: "var(--b-text-4)" }}>
                foliocraft.com
              </p>
            </div>
          </div>
        </div>

        {/* Password Protection */}
        <div>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-3)" }}>Password Protection</span>
          <input
            type="text"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            placeholder="Leave empty for public access"
            className="h-7 w-full rounded-md border px-2.5 text-[11px] outline-none transition-colors focus:border-[var(--b-accent)]"
            style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
          />
          <p className="mt-1 text-[9px]" style={{ color: "var(--b-text-4)" }}>
            {accessPassword ? "Visitors must enter this password to view your portfolio." : "Portfolio is publicly accessible."}
          </p>
        </div>
      </div>
    </div>
  );
}

interface BuilderWorkspaceProps {
  portfolio: PortfolioWithRelations;
}

export function BuilderWorkspace({
  portfolio: initialPortfolio,
}: BuilderWorkspaceProps) {
  const router = useRouter();
  const builderStore = useBuilderStore();
  const portfolioStore = usePortfolioStore();
  const portfolio = portfolioStore.currentPortfolio ?? initialPortfolio;
  const theme = getThemeTokens(portfolio);

  // ── Studio theme (synced with user's dashboard theme) ─────────
  const { data: sessionData, update: updateSession } = useSession();
  const [studioTheme, setStudioTheme] = useState<StudioTheme>(
    (sessionData?.user?.theme as StudioTheme) ?? "dark"
  );

  useEffect(() => {
    if (sessionData?.user?.theme) {
      setStudioTheme(sessionData.user.theme as StudioTheme);
    }
  }, [sessionData?.user?.theme]);

  const toggleStudioTheme = async () => {
    const newTheme = studioTheme === "dark" ? "light" : "dark";
    setStudioTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      await apiPatch("/users/me", { theme: newTheme });
      await updateSession({ theme: newTheme });
    } catch {
      setStudioTheme(studioTheme);
    }
  };

  // Dropdown menus render via a Radix Portal (outside data-builder-theme),
  // so CSS vars like var(--b-panel) don't resolve. Use real colors instead.
  const dropdownColors = studioTheme === "dark"
    ? { bg: "#0c0c10", border: "rgba(255,255,255,0.15)", text: "#e4e4e7", textMuted: "#a1a1aa", hover: "#1f1f24", separator: "rgba(255,255,255,0.08)" }
    : { bg: "#ffffff", border: "rgba(0,0,0,0.14)", text: "#1c1917", textMuted: "#44403c", hover: "#e8e4dd", separator: "rgba(0,0,0,0.07)" };

  const [leftTab, setLeftTab] = useState<"layers" | "elements">("layers");

  // ── Panel visibility ────────────────────────────────────────────
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // ── Canvas state ──────────────────────────────────────────────
  const [transform, setTransform] = useState<CanvasTransform>({
    x: 100,
    y: 100,
    scale: 0.6,
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    portfolio.sections[0]?.id ?? null,
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(portfolio.sections.map((s) => s.id)),
  );
  const [showAddSection, setShowAddSection] = useState(false);
  const [addSectionName, setAddSectionName] = useState("");
  const [rightPanel, setRightPanel] = useState<"properties" | "theme" | "seo">(
    "properties",
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [guides, _setGuides] = useState<GuideInfo[]>([]);

  // ── Draw mode (Figma-style click-drag to create) ──────────────
  const [drawMode, setDrawMode] = useState<BlockType | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const drawContainerRef = useRef<HTMLDivElement>(null);

  // ── Context menu ──────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<{ blockId: string; sectionId: string; x: number; y: number } | null>(null);

  const handleBlockContextMenu = (blockId: string, x: number, y: number) => {
    for (const s of portfolio.sections) {
      if (s.blocks.some((b) => b.id === blockId)) {
        setCtxMenu({ blockId, sectionId: s.id, x, y });
        return;
      }
    }
  };

  const closeCtxMenu = () => setCtxMenu(null);

  // Memoize sorted sections
  const sortedSections = useMemo(
    () => [...portfolio.sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [portfolio.sections],
  );

  const visibleSections = useMemo(
    () => sortedSections.filter((s) => s.isVisible),
    [sortedSections],
  );

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null;
    for (const s of portfolio.sections) {
      const b = s.blocks.find((bl) => bl.id === selectedBlockId);
      if (b) return b;
    }
    return null;
  }, [selectedBlockId, portfolio.sections]);

  const hasNoSections = portfolio.sections.length === 0;

  // ── Draw mode: add block at specific position/size ──────────
  const addBlockAt = async (sectionId: string, type: BlockType, x: number, y: number, w: number, h: number) => {
    const def = BLOCK_REGISTRY[type];
    if (!def) return;
    const section = portfolio.sections.find((s) => s.id === sectionId);
    const existingBlocks = section?.blocks ?? [];
    try {
      const res = await apiPost<BlockWithStyles>(
        `/portfolios/${portfolio.id}/sections/${sectionId}/blocks`,
        {
          type,
          sortOrder: existingBlocks.length,
          content: def.defaultContent,
          styles: { ...def.defaultStyles, x, y, w, h },
        },
      );
      builderStore.pushSnapshot("draw-block");
      portfolioStore.addBlockToSection(sectionId, res);
      setSelectedBlockId(res.id);
      setSelectedSectionId(sectionId);
      setRightPanel("properties");
    } catch { /* handle */ }
  };

  // ── Draw mode handlers ────────────────────────────────────────
  const handleDrawMouseDown = useCallback((e: React.MouseEvent) => {
    if (!drawMode || !selectedSectionId || !drawContainerRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = drawContainerRef.current.getBoundingClientRect();
    // Convert screen coords to canvas coords
    const canvasX = (e.clientX - rect.left - transform.x) / transform.scale;
    const canvasY = (e.clientY - rect.top - transform.y) / transform.scale;
    // Find the section frame to get relative position
    const section = portfolio.sections.find((s) => s.id === selectedSectionId);
    if (!section) return;
    const ss = section.styles as SectionStyles;
    const fx = ss.frameX ?? 0;
    const fy = ss.frameY ?? portfolio.sections.indexOf(section) * (DEFAULT_FRAME_HEIGHT + 80);
    const relX = canvasX - fx;
    const relY = canvasY - fy;
    setDrawStart({ x: relX, y: relY });
    setDrawRect({ x: relX, y: relY, w: 0, h: 0 });
  }, [drawMode, selectedSectionId, transform, portfolio.sections]);

  const handleDrawMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawStart || !drawContainerRef.current) return;
    const rect = drawContainerRef.current.getBoundingClientRect();
    const section = portfolio.sections.find((s) => s.id === selectedSectionId);
    if (!section) return;
    const ss = section.styles as SectionStyles;
    const fx = ss.frameX ?? 0;
    const fy = ss.frameY ?? portfolio.sections.indexOf(section) * (DEFAULT_FRAME_HEIGHT + 80);
    const canvasX = (e.clientX - rect.left - transform.x) / transform.scale;
    const canvasY = (e.clientY - rect.top - transform.y) / transform.scale;
    const relX = canvasX - fx;
    const relY = canvasY - fy;
    setDrawRect({
      x: Math.min(drawStart.x, relX),
      y: Math.min(drawStart.y, relY),
      w: Math.abs(relX - drawStart.x),
      h: Math.abs(relY - drawStart.y),
    });
  }, [drawStart, selectedSectionId, transform, portfolio.sections]);

  const handleDrawMouseUp = useCallback(() => {
    if (!drawMode || !selectedSectionId || !drawRect) {
      setDrawMode(null);
      setDrawStart(null);
      setDrawRect(null);
      return;
    }
    const minSize = 20;
    const w = Math.max(drawRect.w, minSize);
    const h = Math.max(drawRect.h, minSize);
    addBlockAt(selectedSectionId, drawMode, Math.round(drawRect.x), Math.round(drawRect.y), Math.round(w), Math.round(h));
    setDrawMode(null);
    setDrawStart(null);
    setDrawRect(null);
  }, [drawMode, selectedSectionId, drawRect, addBlockAt]);

  // ── Selection ─────────────────────────────────────────────────

  const handleCanvasClick = useCallback(() => {
    setSelectedBlockId(null);
    setSelectedSectionId(null);
  }, []);

  const selectBlock = useCallback(
    (blockId: string, _additive: boolean) => {
      setSelectedBlockId(blockId);
      for (const s of portfolio.sections) {
        if (s.blocks.some((b) => b.id === blockId)) {
          setSelectedSectionId(s.id);
          break;
        }
      }
      setRightPanel("properties");
    },
    [portfolio.sections],
  );

  const selectSection = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedBlockId(null);
  }, []);

  // ── Block CRUD ────────────────────────────────────────────────

  const addBlock = async (sectionId: string, type: BlockType) => {
    const def = BLOCK_REGISTRY[type];
    if (!def) return;
    const section = portfolio.sections.find((s) => s.id === sectionId);
    const existingBlocks = section?.blocks ?? [];
    const maxY = existingBlocks.reduce((max, b) => {
      const by = (b.styles.y ?? 0) + (b.styles.h ?? 50);
      return Math.max(max, by);
    }, 20);

    try {
      const res = await apiPost<BlockWithStyles>(
        `/portfolios/${portfolio.id}/sections/${sectionId}/blocks`,
        {
          type,
          sortOrder: existingBlocks.length,
          content: def.defaultContent,
          styles: {
            ...def.defaultStyles,
            x: 40,
            y: maxY + 16,
            w: DEFAULT_BLOCK_W,
            h: DEFAULT_BLOCK_H,
          },
        },
      );
      builderStore.pushSnapshot("add-block");
      portfolioStore.addBlockToSection(sectionId, res);
      setSelectedBlockId(res.id);
      setSelectedSectionId(sectionId);
      setRightPanel("properties");
    } catch {
      /* handle */
    }
  };

  const moveBlock = useCallback(
    (blockId: string, newX: number, newY: number) => {
      if (!selectedSectionId) return;
      const block = portfolio.sections
        .find((s) => s.id === selectedSectionId)
        ?.blocks.find((b) => b.id === blockId);
      if (!block) return;
      portfolioStore.updateBlockInSection(selectedSectionId, blockId, {
        styles: { ...(block.styles as BlockStyles), x: newX, y: newY },
      });
    },
    [selectedSectionId, portfolio.sections, portfolioStore],
  );

  const resizeBlock = useCallback(
    (
      blockId: string,
      newW: number,
      newH: number,
      newX: number,
      newY: number,
    ) => {
      if (!selectedSectionId) return;
      const block = portfolio.sections
        .find((s) => s.id === selectedSectionId)
        ?.blocks.find((b) => b.id === blockId);
      if (!block) return;
      portfolioStore.updateBlockInSection(selectedSectionId, blockId, {
        styles: { ...(block.styles as BlockStyles), x: newX, y: newY, w: newW, h: newH },
      });
    },
    [selectedSectionId, portfolio.sections, portfolioStore],
  );

  const updateBlock = (
    blockId: string,
    sectionId: string,
    updates: { content?: Record<string, unknown>; styles?: BlockStyles },
  ) => {
    builderStore.pushSnapshot("update-block");
    // Local-first: update store instantly, no API call.
    // Changes are persisted via batch save (auto-save or manual).
    portfolioStore.updateBlockInSection(sectionId, blockId, updates as Partial<BlockWithStyles>);
    builderStore.setDirty(true);
    scheduleAutoSave();
  };

  const deleteBlock = async (blockId: string, sectionId: string) => {
    try {
      builderStore.pushSnapshot("delete-block");
      await apiDelete(
        `/portfolios/${portfolio.id}/sections/${sectionId}/blocks/${blockId}`,
      );
      portfolioStore.removeBlockFromSection(sectionId, blockId);
      if (selectedBlockId === blockId) setSelectedBlockId(null);
    } catch {
      /* handle */
    }
  };

  const duplicateBlock = async (
    block: BlockWithStyles,
    sectionId: string,
  ) => {
    builderStore.pushSnapshot("duplicate-block");
    const section = portfolio.sections.find((s) => s.id === sectionId);
    try {
      const res = await apiPost<BlockWithStyles>(
        `/portfolios/${portfolio.id}/sections/${sectionId}/blocks`,
        {
          type: block.type,
          sortOrder: section?.blocks.length ?? 0,
          content: block.content,
          styles: {
            ...(block.styles as BlockStyles),
            x: (block.styles.x ?? 0) + 20,
            y: (block.styles.y ?? 0) + 20,
          },
        },
      );
      portfolioStore.addBlockToSection(sectionId, res);
      setSelectedBlockId(res.id);
    } catch {
      /* handle */
    }
  };

  // ── Section CRUD ──────────────────────────────────────────────

  const addSection = async () => {
    if (!addSectionName.trim()) return;
    const yOffset = portfolio.sections.reduce((max, s) => {
      const ss = s.styles as SectionStyles;
      return Math.max(
        max,
        (ss.frameY ?? 0) + (ss.frameHeight ?? DEFAULT_FRAME_HEIGHT),
      );
    }, 0);

    try {
      const res = await apiPost<SectionWithBlocks>(
        `/portfolios/${portfolio.id}/sections`,
        {
          name: addSectionName.trim(),
          sortOrder: portfolio.sections.length,
          styles: {
            frameX: 0,
            frameY: yOffset + 80,
            frameWidth: DEFAULT_FRAME_WIDTH,
            frameHeight: DEFAULT_FRAME_HEIGHT,
            layout: "absolute",
            // No backgroundColor — inherits from theme.backgroundColor dynamically
          },
        },
      );
      builderStore.pushSnapshot("add-section");
      portfolioStore.addSection(res);
      setAddSectionName("");
      setShowAddSection(false);
      setExpandedSections((p) => new Set([...p, res.id]));
    } catch {
      /* handle */
    }
  };

  const deleteSection = async (id: string) => {
    builderStore.pushSnapshot("delete-section");
    try {
      await apiDelete(
        `/portfolios/${portfolio.id}/sections?sectionId=${id}`,
      );
      portfolioStore.removeSection(id);
      if (selectedSectionId === id) {
        setSelectedSectionId(null);
        setSelectedBlockId(null);
      }
    } catch {
      /* handle */
    }
  };

  // ── Batch Save (1 request instead of N) ─────────────────────────

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const batchSave = useCallback(async () => {
    if (isSavingRef.current || portfolio.sections.length === 0) return;
    isSavingRef.current = true;
    setSaving(true);
    try {
      await apiPut(`/portfolios/${portfolio.id}/batch`, {
        sections: portfolio.sections.map((s) => ({
          id: s.id,
          name: s.name,
          sortOrder: s.sortOrder,
          styles: s.styles,
          isVisible: s.isVisible,
          blocks: s.blocks.map((b) => ({
            id: b.id,
            type: b.type,
            sortOrder: b.sortOrder,
            content: b.content,
            styles: b.styles,
            isVisible: b.isVisible,
            isLocked: b.isLocked,
          })),
        })),
      });
      builderStore.markSaved();
    } catch {
      /* handle */
    }
    isSavingRef.current = false;
    setSaving(false);
  }, [portfolio.sections, portfolio.id, builderStore]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      batchSave();
    }, 2000);
  }, [batchSave]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  // ── DnD reorder (layers panel) ─────────────────────────────────
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
    const newIndex = sortedSections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = [...sortedSections];
    const [moved] = newOrder.splice(oldIndex, 1) as [SectionWithBlocks];
    newOrder.splice(newIndex, 0, moved);
    portfolioStore.reorderSections(newOrder.map((s) => s.id));
    builderStore.setDirty(true);
    scheduleAutoSave();
  };

  const handleBlockDragEnd = (sectionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const section = portfolio.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const blocks = [...section.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const [moved] = blocks.splice(oldIndex, 1) as [BlockWithStyles];
    blocks.splice(newIndex, 0, moved);
    portfolioStore.reorderBlocksInSection(sectionId, blocks.map((b) => b.id));
    builderStore.setDirty(true);
    scheduleAutoSave();
  };

  const handleSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await batchSave();
  };

  const handlePublish = async () => {
    if (publishing) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(false);
    try {
      await batchSave();
      await apiPatch<{ status: string }>(`/portfolios/${portfolio.id}`, { status: "PUBLISHED" });
      // Update local portfolio status so UI reflects the change immediately
      portfolioStore.setCurrentPortfolio({ ...portfolio, status: "PUBLISHED" as PortfolioStatus });
      builderStore.markSaved();
      setPublishSuccess(true);
      // Auto-dismiss success after 4 seconds
      setTimeout(() => setPublishSuccess(false), 4000);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Failed to publish");
      setTimeout(() => setPublishError(null), 5000);
    } finally {
      setPublishing(false);
    }
  };

  const fitToScreen = useCallback(() => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const s of portfolio.sections) {
      const ss = s.styles as SectionStyles;
      const fx = ss.frameX ?? 0;
      const fy = ss.frameY ?? 0;
      const fw = ss.frameWidth ?? DEFAULT_FRAME_WIDTH;
      const fh = ss.frameHeight ?? DEFAULT_FRAME_HEIGHT;
      minX = Math.min(minX, fx);
      minY = Math.min(minY, fy);
      maxX = Math.max(maxX, fx + fw);
      maxY = Math.max(maxY, fy + fh);
    }
    if (!isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 1440;
      maxY = 900;
    }

    const padding = 80;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scaleX = 900 / contentW;
    const scaleY = 600 / contentH;
    const scale = Math.min(scaleX, scaleY, 1);

    setTransform({
      scale,
      x: -minX * scale + padding * scale + 50,
      y: -minY * scale + padding * scale + 50,
    });
  }, [portfolio.sections]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Zoom helpers ────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.min(5, t.scale + 0.1) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.max(0.1, t.scale - 0.1) }));
  }, []);

  const resetZoom = useCallback(() => {
    setTransform((t) => ({ ...t, scale: 1 }));
  }, []);

  // ── Export as JSON ──────────────────────────────────────────────
  const exportAsJson = useCallback(() => {
    const data = {
      title: portfolio.title,
      slug: portfolio.slug,
      theme: portfolio.theme,
      sections: portfolio.sections.map((s) => ({
        name: s.name,
        sortOrder: s.sortOrder,
        styles: s.styles,
        blocks: s.blocks.map((b) => ({
          type: b.type,
          content: b.content,
          styles: b.styles,
          sortOrder: b.sortOrder,
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${portfolio.slug || "portfolio"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [portfolio]);

  // ── Export as HTML ────────────────────────────────────────────────
  const exportAsHtml = useCallback(() => {
    const t = theme;
    const fonts = [t.fontHeading, t.fontBody].filter(Boolean);
    const fontParam = fonts.map(f => f.replace(/ /g, '+')).join('&family=');

    const sections = [...portfolio.sections]
      .filter(s => s.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    let sectionsHtml = '';
    for (const section of sections) {
      const blocks = [...section.blocks]
        .filter(b => b.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      let blocksHtml = '';
      for (const block of blocks) {
        const c = block.content as Record<string, unknown>;
        const s = block.styles as Record<string, unknown>;

        switch (block.type) {
          case 'heading': {
            const level = (c.level as number) ?? 2;
            const text = (c.text as string) ?? '';
            const highlight = c.highlight as string;
            let displayText = text;
            if (highlight && text.includes(highlight)) {
              displayText = text.replace(highlight, `<span style="color:${t.primaryColor}">${highlight}</span>`);
            }
            blocksHtml += `<h${level} style="font-size:${s.fontSize ?? 32}px;font-weight:${s.fontWeight ?? 700};text-align:${s.textAlign ?? 'left'};font-family:'${t.fontHeading}',sans-serif;line-height:${s.lineHeight ?? 1.2};margin-bottom:${s.marginBottom ?? 16}px">${displayText}</h${level}>`;
            break;
          }
          case 'text':
            blocksHtml += `<p style="font-size:${s.fontSize ?? 16}px;line-height:${s.lineHeight ?? 1.7};opacity:${s.opacity ?? 1};text-align:${s.textAlign ?? 'left'};font-family:'${t.fontBody}',sans-serif;margin-bottom:${s.marginBottom ?? 12}px">${(c.text as string) ?? ''}</p>`;
            break;
          case 'button':
            blocksHtml += `<a href="${(c.url as string) ?? '#'}" style="display:inline-block;padding:12px 32px;background:${t.primaryColor};color:#fff;border-radius:${t.borderRadius};font-weight:600;text-decoration:none;font-size:16px;text-align:center">${(c.text as string) ?? 'Button'}</a>`;
            break;
          case 'skill_bar': {
            const name = (c.name as string) ?? '';
            const level = (c.level as number) ?? 0;
            blocksHtml += `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:14px"><span>${name}</span><span>${level}%</span></div><div style="height:6px;background:${t.surfaceColor};border-radius:3px"><div style="height:100%;width:${level}%;background:${t.primaryColor};border-radius:3px"></div></div></div>`;
            break;
          }
          case 'project_card': {
            const title = (c.title as string) ?? '';
            const desc = (c.description as string) ?? '';
            const tech = (c.techStack as string[]) ?? [];
            blocksHtml += `<div style="border:1px solid ${t.surfaceColor};border-radius:12px;padding:24px;margin-bottom:16px"><h3 style="font-size:20px;font-weight:700;font-family:'${t.fontHeading}',sans-serif;margin-bottom:8px">${title}</h3><p style="font-size:14px;opacity:0.7;margin-bottom:12px">${desc}</p><div style="display:flex;gap:8px;flex-wrap:wrap">${tech.map((t2: string) => `<span style="font-size:12px;padding:4px 10px;border:1px solid ${t.surfaceColor};border-radius:6px">${t2}</span>`).join('')}</div></div>`;
            break;
          }
          case 'stat': {
            blocksHtml += `<div style="text-align:center;margin-bottom:16px"><div style="font-size:36px;font-weight:800;color:${t.primaryColor};font-family:'${t.fontHeading}',sans-serif">${(c.value as string) ?? ''}</div><div style="font-size:13px;opacity:0.6">${(c.label as string) ?? ''}</div></div>`;
            break;
          }
          default:
            if (c.text) blocksHtml += `<div style="margin-bottom:12px">${c.text as string}</div>`;
            break;
        }
      }

      sectionsHtml += `<section style="max-width:1100px;margin:0 auto;padding:80px 24px">${blocksHtml}</section>`;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${portfolio.title}</title>
<meta name="description" content="${portfolio.description ?? ''}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fontParam}:wght@300;400;500;600;700;800;900&display=swap">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: ${t.backgroundColor}; color: ${t.textColor}; font-family: '${t.fontBody}', sans-serif; -webkit-font-smoothing: antialiased; }
a { color: ${t.primaryColor}; }
::selection { background: ${t.primaryColor}33; }
</style>
</head>
<body>
${sectionsHtml}
<footer style="text-align:center;padding:32px;opacity:0.3;font-size:13px">&copy; ${new Date().getFullYear()} ${portfolio.user?.name ?? portfolio.title}</footer>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${portfolio.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [portfolio, theme]);

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ? → Toggle shortcuts overlay
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        setShowShortcuts((v) => !v);
        return;
      }
      // Escape closes shortcuts overlay or preview
      if (e.key === "Escape" && showPreview) {
        setShowPreview(false);
        return;
      }
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
        return;
      }

      // Ctrl+Shift+Z — Redo (check before plain Z)
      if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        const r = builderStore.redo();
        if (r) { builderStore.setDirty(true); scheduleAutoSave(); }
        return;
      }
      // Ctrl+Z — Undo
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const r = builderStore.undo();
        if (r) { builderStore.setDirty(true); scheduleAutoSave(); }
        return;
      }

      // V → Select tool
      if (!mod && e.key === "v") { setDrawMode(null); return; }
      // R → Rectangle draw
      if (!mod && e.key === "r") { setDrawMode("rectangle"); return; }
      // O → Circle draw
      if (!mod && e.key === "o") { setDrawMode("circle"); return; }
      // L → Line draw
      if (!mod && e.key === "l") { setDrawMode("line"); return; }
      // T → Add text
      if (!mod && e.key === "t" && selectedSectionId) { addBlock(selectedSectionId, "text"); return; }
      // Escape → Exit draw mode
      if (e.key === "Escape" && drawMode) { setDrawMode(null); setDrawStart(null); setDrawRect(null); return; }

      // Ctrl+S  → Save
      if (mod && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }
      // Ctrl+E  → Export JSON
      if (mod && e.key === "e") {
        e.preventDefault();
        exportAsJson();
        return;
      }
      // Ctrl+H  → Export HTML
      if (mod && e.key === "h") {
        e.preventDefault();
        exportAsHtml();
        return;
      }
      // Ctrl+P  → Preview
      if (mod && e.key === "p") {
        e.preventDefault();
        setShowPreview(true);
        return;
      }
      // Ctrl+\  → Toggle left panel
      if (mod && e.key === "\\") {
        e.preventDefault();
        setShowLeftPanel((v) => !v);
        return;
      }
      // Ctrl+/  → Toggle right panel
      if (mod && e.key === "/") {
        e.preventDefault();
        setShowRightPanel((v) => !v);
        return;
      }
      // Ctrl+0  → Reset zoom
      if (mod && e.key === "0") {
        e.preventDefault();
        resetZoom();
        return;
      }
      // Ctrl+1  → Fit to screen
      if (mod && e.key === "1") {
        e.preventDefault();
        fitToScreen();
        return;
      }
      // Ctrl+=  → Zoom in
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
        return;
      }
      // Ctrl+-  → Zoom out
      if (mod && e.key === "-") {
        e.preventDefault();
        zoomOut();
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, exportAsJson, exportAsHtml, fitToScreen, zoomIn, zoomOut, resetZoom, builderStore, scheduleAutoSave, showShortcuts, showPreview]);

  // ═════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════

  const deviceWidths: Record<string, number | undefined> = { desktop: undefined, tablet: 768, mobile: 375 };
  const previewWidth = deviceWidths[builderStore.devicePreview];

  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: "var(--b-bg)" }}
      data-builder-theme={studioTheme}
    >
      {/* ── TOP TOOLBAR ──────────────────────────────────────────── */}
      <div
        className="builder-toolbar relative z-20 flex h-12 items-center justify-between px-3"
        style={{ borderBottom: "1px solid var(--b-border)" }}
      >
        {/* Left: Back + File + View */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            style={{ color: "var(--b-text-3)" }}
            asChild
          >
            <Link href="/dashboard/portfolios">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div
            className="mx-0.5 h-4 w-px"
            style={{ backgroundColor: "var(--b-border)" }}
          />

          {/* ── File Menu ─────────────────────────────────── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="builder-toolbar-btn flex h-7 items-center rounded-md px-2.5 text-[12px] font-medium"
                style={{ color: "var(--b-text-2)" }}
              >
                File
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56"
              style={{
                backgroundColor: dropdownColors.bg,
                border: `1px solid ${dropdownColors.border}`,
                color: dropdownColors.text,
                boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
              }}
            >
              <DropdownMenuItem
                onClick={handleSave}
                disabled={saving}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save"}
                <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: dropdownColors.separator }} />
              <DropdownMenuItem
                onClick={exportAsJson}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <FileJson className="h-3.5 w-3.5" />
                Export as JSON
                <DropdownMenuShortcut>Ctrl+E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportAsHtml}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Globe className="h-3.5 w-3.5" />
                Export as HTML
                <DropdownMenuShortcut>Ctrl+H</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: dropdownColors.separator }} />
              <DropdownMenuItem
                onClick={() => setShowPreview(true)}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
                <DropdownMenuShortcut>Ctrl+P</DropdownMenuShortcut>
              </DropdownMenuItem>
              {portfolio.status === "PUBLISHED" && portfolio.user.username && (
                <DropdownMenuItem
                  onClick={() => window.open(`/portfolio/${portfolio.user.username}/${portfolio.slug}`, "_blank")}
                  className="text-[12px] focus:bg-[var(--b-surface-hover)]"
                  style={{ color: "var(--b-text-2)" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Live Site
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator style={{ backgroundColor: dropdownColors.separator }} />
              <DropdownMenuItem
                onClick={handlePublish}
                disabled={publishing || saving}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Globe className="h-3.5 w-3.5" />
                {publishing ? "Publishing..." : portfolio.status === "PUBLISHED" ? "Update & Publish" : "Publish"}
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: dropdownColors.separator }} />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/portfolios")}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── View Menu ─────────────────────────────────── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="builder-toolbar-btn flex h-7 items-center rounded-md px-2.5 text-[12px] font-medium"
                style={{ color: "var(--b-text-2)" }}
              >
                View
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56"
              style={{
                backgroundColor: dropdownColors.bg,
                border: `1px solid ${dropdownColors.border}`,
                color: dropdownColors.text,
                boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
              }}
            >
              <DropdownMenuCheckboxItem
                checked={showLeftPanel}
                onCheckedChange={(v) => setShowLeftPanel(!!v)}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <PanelLeft className="mr-2 h-3.5 w-3.5" />
                Left Panel
                <DropdownMenuShortcut>Ctrl+\</DropdownMenuShortcut>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showRightPanel}
                onCheckedChange={(v) => setShowRightPanel(!!v)}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <PanelRight className="mr-2 h-3.5 w-3.5" />
                Right Panel
                <DropdownMenuShortcut>Ctrl+/</DropdownMenuShortcut>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showMinimap}
                onCheckedChange={(v) => setShowMinimap(!!v)}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Maximize className="mr-2 h-3.5 w-3.5" />
                Minimap
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator style={{ backgroundColor: dropdownColors.separator }} />
              <DropdownMenuItem
                onClick={zoomIn}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <ZoomIn className="h-3.5 w-3.5" />
                Zoom In
                <DropdownMenuShortcut>Ctrl+=</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={zoomOut}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <ZoomOut className="h-3.5 w-3.5" />
                Zoom Out
                <DropdownMenuShortcut>Ctrl+-</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={resetZoom}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Layout className="h-3.5 w-3.5" />
                Reset Zoom (100%)
                <DropdownMenuShortcut>Ctrl+0</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={fitToScreen}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Maximize className="h-3.5 w-3.5" />
                Fit to Screen
                <DropdownMenuShortcut>Ctrl+1</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: dropdownColors.separator }} />
              <DropdownMenuItem
                onClick={toggleStudioTheme}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {studioTheme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
                {studioTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: dropdownColors.separator }} />
              <DropdownMenuItem
                onClick={() => setShowShortcuts(true)}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Settings className="h-3.5 w-3.5" />
                Keyboard Shortcuts
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            className="mx-0.5 h-4 w-px"
            style={{ backgroundColor: "var(--b-border)" }}
          />

          {/* Undo / Redo */}
          <button
            className="builder-toolbar-btn flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-25"
            style={{ color: "var(--b-text-3)" }}
            onClick={() => {
              const r = builderStore.undo();
              if (r) { builderStore.setDirty(true); scheduleAutoSave(); }
            }}
            disabled={builderStore.undoStack.length === 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            className="builder-toolbar-btn flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-25"
            style={{ color: "var(--b-text-3)" }}
            onClick={() => {
              const r = builderStore.redo();
              if (r) { builderStore.setDirty(true); scheduleAutoSave(); }
            }}
            disabled={builderStore.redoStack.length === 0}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Center: Name + Status */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--b-text)" }}
            >
              {portfolio.title}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
              style={{
                backgroundColor:
                  portfolio.status === "PUBLISHED"
                    ? "rgba(16,185,129,0.1)"
                    : "var(--b-accent-soft)",
                color:
                  portfolio.status === "PUBLISHED"
                    ? "var(--b-success)"
                    : "var(--b-accent)",
              }}
            >
              {portfolio.status}
            </span>
          </div>
        </div>

        {/* Right: Zoom + Theme + Save + Publish */}
        <div className="flex items-center gap-2">
          <ZoomControls
            transform={transform}
            onTransformChange={setTransform}
            onFitToScreen={fitToScreen}
          />

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

          <div
            className="h-4 w-px"
            style={{ backgroundColor: "var(--b-border)" }}
          />

          {/* Light/Dark toggle */}
          <button
            className="builder-toolbar-btn flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ color: "var(--b-text-3)" }}
            onClick={() =>
              setStudioTheme((t) => (t === "dark" ? "light" : "dark"))
            }
            title={`Switch to ${studioTheme === "dark" ? "light" : "dark"} mode`}
          >
            {studioTheme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>

          <div
            className="h-4 w-px"
            style={{ backgroundColor: "var(--b-border)" }}
          />

          <button
            onClick={() => { setRightPanel("seo"); setSelectedBlockId(null); }}
            className="builder-toolbar-btn flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-medium"
            style={{ color: "var(--b-text-2)" }}
            title="SEO Settings"
          >
            <Globe className="h-3.5 w-3.5" />
            SEO
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="builder-toolbar-btn flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium"
            style={{ color: "var(--b-text-2)" }}
            title="Preview (Ctrl+P)"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>

          <button
            className="builder-toolbar-btn flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium transition-all"
            style={{ color: "var(--b-text-2)" }}
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            className="flex h-8 items-center gap-1.5 rounded-lg px-4 text-[12px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
            style={{
              background: publishing
                ? "var(--b-text-3)"
                : publishSuccess
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, var(--b-accent), #0891b2)",
              boxShadow: publishSuccess
                ? "0 2px 12px rgba(16,185,129,0.3)"
                : "var(--b-publish-shadow), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            onClick={handlePublish}
            disabled={publishing || saving}
          >
            {publishing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Publishing...
              </>
            ) : publishSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Published!
              </>
            ) : portfolio.status === "PUBLISHED" ? (
              <>
                <Globe className="h-3.5 w-3.5" />
                Update
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5" />
                Publish
              </>
            )}
          </button>
        </div>

        {/* Publish feedback bar */}
        {(publishSuccess || publishError) && (
          <div
            className="absolute left-1/2 top-14 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium shadow-lg"
            style={{
              backgroundColor: publishSuccess ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
              color: publishSuccess ? "#10b981" : "#f43f5e",
              border: `1px solid ${publishSuccess ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`,
              backdropFilter: "blur(12px)",
            }}
          >
            {publishSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Portfolio is live!
                {portfolio.user.username && (
                  <a
                    href={`/portfolio/${portfolio.user.username}/${portfolio.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-80"
                  >
                    View site
                    <ExternalLink className="ml-0.5 inline h-3 w-3" />
                  </a>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                {publishError}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Layers / Elements Panel ────────────────────────── */}
        {showLeftPanel && (
        <div
          className="builder-panel flex w-60 flex-shrink-0 flex-col"
          style={{
            backgroundColor: "var(--b-panel)",
            borderRight: "1px solid var(--b-border)",
          }}
        >
          {/* Tab bar */}
          <div
            className="flex flex-shrink-0 gap-0.5 p-1.5"
            style={{ borderBottom: "1px solid var(--b-border)" }}
          >
            {([
              { id: "layers" as const, label: "Layers", icon: <Layers className="h-3 w-3" /> },
              { id: "elements" as const, label: "Elements", icon: <LayoutGrid className="h-3 w-3" /> },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLeftTab(tab.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] transition-all duration-150"
                style={{
                  color: leftTab === tab.id ? "var(--b-accent)" : "var(--b-text-4)",
                  backgroundColor: leftTab === tab.id ? "var(--b-accent-soft)" : "transparent",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Layers Tab ───────────────────────────────────────── */}
          {leftTab === "layers" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Toolbar */}
              <div
                className="flex flex-shrink-0 items-center justify-between px-3 py-2"
                style={{ borderBottom: "1px solid var(--b-border)" }}
              >
                <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--b-text-4)" }}>
                  Frames ({sortedSections.length})
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setShowAddSection(true)}
                    className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
                    style={{ color: "var(--b-text-3)" }}
                    title="Add frame"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { setRightPanel("theme"); setSelectedBlockId(null); }}
                    className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
                    style={{ color: "var(--b-text-3)" }}
                    title="Theme"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Add section input */}
              {showAddSection && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-2.5"
                  style={{ borderBottom: "1px solid var(--b-border)", backgroundColor: "var(--b-surface)" }}
                >
                  <Input
                    value={addSectionName}
                    onChange={(e) => setAddSectionName(e.target.value)}
                    placeholder="Frame name..."
                    className="h-7 border-0 text-[11px]"
                    style={{ backgroundColor: "var(--b-input-bg)", color: "var(--b-text)" }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSection();
                      if (e.key === "Escape") setShowAddSection(false);
                    }}
                  />
                  <button
                    onClick={addSection}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: "var(--b-accent-soft)", color: "var(--b-accent)" }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setShowAddSection(false)}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                    style={{ color: "var(--b-text-4)" }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Section + Block tree */}
              <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
                {hasNoSections && !showAddSection && (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "var(--b-surface)", border: "1px dashed var(--b-border-active)" }}
                    >
                      <Layers className="h-4 w-4" style={{ color: "var(--b-text-4)" }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium" style={{ color: "var(--b-text-3)" }}>No frames yet</p>
                      <p className="mt-0.5 text-[10px]" style={{ color: "var(--b-text-4)" }}>
                        Click <strong>+</strong> above to add one
                      </p>
                    </div>
                  </div>
                )}

                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                  <SortableContext items={sortedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    {sortedSections.map((section) => {
                      const isExpanded = expandedSections.has(section.id);
                      const isSectionSelected = selectedSectionId === section.id && !selectedBlockId;
                      const blockCount = section.blocks.length;
                      const sortedBlocks = [...section.blocks].sort((a, b) => a.sortOrder - b.sortOrder);

                      return (
                        <SortableItem id={section.id} key={section.id}>
                          {({ style, ref, listeners, attributes }) => (
                            <div ref={ref} style={style} className="group/sec">
                              {/* Section (frame) row */}
                              <div
                                className="builder-layer-item flex cursor-pointer items-center gap-1.5 px-2 py-[7px]"
                                style={{
                                  backgroundColor: isSectionSelected ? "var(--b-accent-soft)" : "transparent",
                                  color: isSectionSelected ? "var(--b-accent)" : "var(--b-text-2)",
                                }}
                                onClick={() => selectSection(section.id)}
                              >
                                <span className="flex h-4 w-4 flex-shrink-0 cursor-grab items-center justify-center" {...listeners} {...attributes}>
                                  <GripVertical className="h-3 w-3 opacity-0 transition-opacity group-hover/sec:opacity-30" style={{ color: "var(--b-text-4)" }} />
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
                                  style={{ color: "var(--b-text-4)" }}
                                >
                                  <ChevronRight
                                    className="h-3 w-3 transition-transform duration-150"
                                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0)" }}
                                  />
                                </button>
                                <Layout className="h-3.5 w-3.5 flex-shrink-0" style={{ color: isSectionSelected ? "var(--b-accent)" : "var(--b-text-3)" }} />
                                <span className="flex-1 truncate text-[11px] font-semibold">{section.name}</span>
                                <span className="flex-shrink-0 text-[9px] font-medium" style={{ color: "var(--b-text-4)" }}>
                                  {blockCount}
                                </span>
                                {!section.isVisible && (
                                  <EyeOff className="h-2.5 w-2.5 flex-shrink-0" style={{ color: "var(--b-text-4)" }} />
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover/sec:opacity-40 hover:!opacity-100"
                                  style={{ color: "var(--b-danger)" }}
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>

                              {/* Block children */}
                              {isExpanded && (
                                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd(section.id)}>
                                  <SortableContext items={sortedBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                    <div
                                      className="ml-[18px] border-l py-0.5"
                                      style={{ borderColor: isSectionSelected ? "var(--b-accent-mid)" : "var(--b-border)" }}
                                    >
                                      {blockCount === 0 && (
                                        <p className="px-4 py-2 text-[9px]" style={{ color: "var(--b-text-4)" }}>
                                          No elements — switch to Elements tab to add
                                        </p>
                                      )}
                                      {sortedBlocks.map((block) => (
                                        <SortableItem id={block.id} key={block.id}>
                                          {({ style: blockStyle, ref: blockRef, listeners: blockListeners, attributes: blockAttributes }) => (
                                            <div ref={blockRef} style={blockStyle}>
                                              <LayerBlockItem
                                                block={block}
                                                isSelected={block.id === selectedBlockId}
                                                onSelect={() => selectBlock(block.id, false)}
                                                onDelete={() => deleteBlock(block.id, section.id)}
                                                dragHandleProps={{ ...blockListeners, ...blockAttributes }}
                                              />
                                            </div>
                                          )}
                                        </SortableItem>
                                      ))}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              )}
                            </div>
                          )}
                        </SortableItem>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

          {/* ── Elements Tab ─────────────────────────────────────── */}
          {leftTab === "elements" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Notice */}
              {!selectedSectionId && (
                <div
                  className="mx-2.5 mt-2.5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: "var(--b-accent-soft)",
                    color: "var(--b-accent)",
                    border: "1px solid var(--b-accent-mid)",
                  }}
                >
                  <MousePointer2 className="h-3.5 w-3.5 flex-shrink-0" />
                  Select a frame first to add elements
                </div>
              )}

              {/* Elements list */}
              <div className="flex-1 overflow-y-auto px-2.5 py-2.5 scrollbar-thin">
                {BLOCK_CATEGORIES.map((cat) => {
                  const blocks = getBlocksByCategory(cat.id);
                  return (
                    <div key={cat.id} className="mb-4">
                      <p
                        className="mb-2 flex items-center gap-1.5 px-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: "var(--b-text-4)" }}
                      >
                        {cat.label}
                        <span
                          className="rounded-sm px-1 text-[8px] font-semibold"
                          style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text-4)" }}
                        >
                          {blocks.length}
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {blocks.map((def) => (
                          <button
                            key={def.type}
                            onClick={() => {
                              if (selectedSectionId) addBlock(selectedSectionId, def.type);
                            }}
                            disabled={!selectedSectionId}
                            className="group flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-2.5 text-left transition-all duration-150 disabled:opacity-25"
                            style={{
                              backgroundColor: "var(--b-surface)",
                              border: "1px solid var(--b-border)",
                            }}
                            onMouseEnter={(e) => {
                              if (selectedSectionId) {
                                e.currentTarget.style.borderColor = "var(--b-accent)";
                                e.currentTarget.style.backgroundColor = "var(--b-accent-soft)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--b-border)";
                              e.currentTarget.style.backgroundColor = "var(--b-surface)";
                            }}
                          >
                            <span
                              className="text-[10.5px] font-semibold"
                              style={{ color: "var(--b-text-2)" }}
                            >
                              {def.label}
                            </span>
                            <span
                              className="line-clamp-1 text-[8.5px] leading-tight"
                              style={{ color: "var(--b-text-4)" }}
                            >
                              {def.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        )}

        {/* ── CENTER: Canvas ─────────────────────────────────────── */}
        <div
          ref={drawContainerRef}
          className="relative flex-1 overflow-hidden"
          style={{ cursor: drawMode ? "crosshair" : undefined }}
          onMouseDown={drawMode ? handleDrawMouseDown : undefined}
          onMouseMove={drawMode && drawStart ? handleDrawMouseMove : undefined}
          onMouseUp={drawMode && drawStart ? handleDrawMouseUp : undefined}
        >
          <SmartGuides guides={guides} transform={transform} />

          {/* Draw preview rectangle */}
          {drawMode && drawRect && drawStart && selectedSectionId && (
            (() => {
              const section = portfolio.sections.find((s) => s.id === selectedSectionId);
              if (!section) return null;
              const ss = section.styles as SectionStyles;
              const fx = ss.frameX ?? 0;
              const fy = ss.frameY ?? portfolio.sections.indexOf(section) * (DEFAULT_FRAME_HEIGHT + 80);
              return (
                <div
                  className="pointer-events-none absolute z-50"
                  style={{
                    left: (fx + drawRect.x) * transform.scale + transform.x,
                    top: (fy + drawRect.y) * transform.scale + transform.y,
                    width: drawRect.w * transform.scale,
                    height: drawRect.h * transform.scale,
                    border: "2px dashed var(--b-accent)",
                    borderRadius: drawMode === "circle" ? "50%" : drawMode === "line" ? 0 : 4,
                    backgroundColor: "var(--b-accent-soft)",
                  }}
                />
              );
            })()
          )}

          <CanvasEngine
            transform={transform}
            onTransformChange={setTransform}
            onCanvasClick={drawMode ? undefined : handleCanvasClick}
            cursorOverride={drawMode ? "crosshair" : undefined}
          >
            <div style={{ position: "relative" }}>
              {visibleSections.map((section) => {
                const ss = section.styles as SectionStyles;
                const fx = ss.frameX ?? 0;
                const fy =
                  ss.frameY ??
                  portfolio.sections.indexOf(section) *
                    (DEFAULT_FRAME_HEIGHT + 80);
                const fw = previewWidth ?? ss.frameWidth ?? DEFAULT_FRAME_WIDTH;
                const fh = ss.frameHeight ?? DEFAULT_FRAME_HEIGHT;

                return (
                  <CanvasFrame
                    key={section.id}
                    id={section.id}
                    name={section.name}
                    x={fx}
                    y={fy}
                    width={fw}
                    height={fh}
                    backgroundColor={
                      (ss as Record<string, unknown>).backgroundCustom
                        ? (ss.backgroundColor as string)
                        : theme.backgroundColor
                    }
                    isSelected={
                      selectedSectionId === section.id && !selectedBlockId
                    }
                    onSelect={selectSection}
                  >
                    {[...section.blocks]
                      .filter((b) => b.isVisible)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((block) => (
                        <CanvasElement
                          key={block.id}
                          id={block.id}
                          x={block.styles.x ?? 40}
                          y={block.styles.y ?? 0}
                          w={block.styles.w ?? DEFAULT_BLOCK_W}
                          h={block.styles.h ?? 0}
                          rotation={block.styles.rotation}
                          isSelected={block.id === selectedBlockId}
                          isLocked={block.isLocked}
                          isHidden={!block.isVisible}
                          canvasScale={transform.scale}
                          onSelect={selectBlock}
                          onMove={moveBlock}
                          onResize={resizeBlock}
                          sortOrder={block.sortOrder}
                          onContextMenu={handleBlockContextMenu}
                        >
                          <BlockRenderer
                            block={block}
                            theme={theme}
                            isEditing
                          />
                        </CanvasElement>
                      ))}
                  </CanvasFrame>
                );
              })}
            </div>
          </CanvasEngine>

          {/* Empty canvas state */}
          {hasNoSections && (
            <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: "var(--b-surface)",
                    border: "1px solid var(--b-border)",
                  }}
                >
                  <LayoutGrid
                    className="h-7 w-7"
                    style={{ color: "var(--b-text-4)" }}
                  />
                </div>
                <p
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--b-text-2)" }}
                >
                  Start with a frame
                </p>
                <p
                  className="mx-auto mt-2 max-w-[240px] text-[12px] leading-relaxed"
                  style={{ color: "var(--b-text-3)" }}
                >
                  Frames are sections of your portfolio. Create one to start
                  adding elements.
                </p>
                <button
                  onClick={() => setShowAddSection(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--b-accent), #0891b2)",
                    boxShadow: "var(--b-publish-shadow)",
                  }}
                >
                  <Plus className="h-4 w-4" /> Create Frame
                </button>
              </div>
            </div>
          )}

          {/* ── Bottom Design Toolbar ─────────────────────────────── */}
          {selectedSectionId && (
            <div
              className="absolute bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-0.5 rounded-xl px-1.5 py-1"
              style={{
                backgroundColor: dropdownColors.bg,
                border: `1px solid ${dropdownColors.border}`,
                boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Draw mode indicator */}
              {drawMode && (
                <div className="mr-1 flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ backgroundColor: "var(--b-accent-soft)" }}>
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: "var(--b-accent)" }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--b-accent)" }}>
                    Draw {drawMode}
                  </span>
                  <button
                    onClick={() => setDrawMode(null)}
                    className="ml-0.5 text-[10px] font-bold" style={{ color: "var(--b-accent)" }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Cursor (select) tool */}
              <button
                onClick={() => setDrawMode(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-all"
                style={{
                  backgroundColor: !drawMode ? dropdownColors.hover : "transparent",
                  color: !drawMode ? dropdownColors.text : dropdownColors.textMuted,
                }}
                title="Select (V)"
              >
                <MousePointer2 className="h-4 w-4" />
              </button>

              <div className="mx-0.5 h-5 w-px" style={{ backgroundColor: dropdownColors.separator }} />

              {/* Shape draw tools */}
              {([
                { type: "rectangle" as BlockType, icon: <span className="h-3.5 w-3.5 rounded-[3px] border-2" style={{ borderColor: "currentColor" }} />, label: "Rectangle (R)" },
                { type: "circle" as BlockType, icon: <span className="h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: "currentColor" }} />, label: "Circle (O)" },
                { type: "line" as BlockType, icon: <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: "currentColor" }} />, label: "Line (L)" },
              ]).map((shape) => (
                <button
                  key={shape.type}
                  onClick={() => setDrawMode(drawMode === shape.type ? null : shape.type)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all"
                  style={{
                    backgroundColor: drawMode === shape.type ? "var(--b-accent-soft)" : "transparent",
                    color: drawMode === shape.type ? "var(--b-accent)" : dropdownColors.textMuted,
                  }}
                  title={shape.label}
                >
                  {shape.icon}
                </button>
              ))}

              <div className="mx-0.5 h-5 w-px" style={{ backgroundColor: dropdownColors.separator }} />

              {/* Quick-add elements (click to insert immediately) */}
              {([
                { type: "heading" as BlockType, icon: <span className="text-[12px] font-bold">H</span>, label: "Heading" },
                { type: "text" as BlockType, icon: <span className="text-[12px]">T</span>, label: "Text" },
                { type: "image" as BlockType, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>, label: "Image" },
                { type: "button" as BlockType, icon: <span className="rounded border px-1 text-[8px] font-bold" style={{ borderColor: "currentColor" }}>BTN</span>, label: "Button" },
              ]).map((el) => (
                <button
                  key={el.type}
                  onClick={() => { setDrawMode(null); addBlock(selectedSectionId, el.type); }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all"
                  style={{ color: dropdownColors.textMuted }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  title={el.label}
                >
                  {el.icon}
                </button>
              ))}

              <div className="mx-0.5 h-5 w-px" style={{ backgroundColor: dropdownColors.separator }} />

              {/* Quick insert (no draw, just add) */}
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file || !selectedSectionId) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "");
                    try {
                      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
                      const data = await res.json();
                      if (data.secure_url) {
                        const def = BLOCK_REGISTRY["image"];
                        const section = portfolio.sections.find((s) => s.id === selectedSectionId);
                        const existingBlocks = section?.blocks ?? [];
                        const maxY = existingBlocks.reduce((max, b) => Math.max(max, (b.styles.y ?? 0) + (b.styles.h ?? 50)), 20);
                        const newBlock = await apiPost<BlockWithStyles>(`/portfolios/${portfolio.id}/sections/${selectedSectionId}/blocks`, {
                          type: "image",
                          sortOrder: existingBlocks.length,
                          content: { ...def.defaultContent, src: data.secure_url, alt: file.name },
                          styles: { ...def.defaultStyles, x: 40, y: maxY + 16, w: DEFAULT_BLOCK_W, h: DEFAULT_BLOCK_H },
                        });
                        portfolioStore.addBlockToSection(selectedSectionId, newBlock);
                        setSelectedBlockId(newBlock.id);
                        setRightPanel("properties");
                      }
                    } catch { /* ignore */ }
                  };
                  input.click();
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${studioTheme === "dark" ? "#06b6d4" : "#0d9488"}, ${studioTheme === "dark" ? "#0891b2" : "#0f766e"})`,
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(6,182,212,0.2)",
                }}
                title="Upload image"
              >
                <Plus className="h-3 w-3" />
                Image
              </button>
            </div>
          )}

          {/* ── Context Menu ──────────────────────────────────────── */}
          {ctxMenu && (
            <>
              {/* Backdrop to close */}
              <div className="fixed inset-0 z-[200]" onClick={closeCtxMenu} onContextMenu={(e) => { e.preventDefault(); closeCtxMenu(); }} />
              {/* Menu */}
              <div
                className="fixed z-[201] min-w-[180px] overflow-hidden rounded-lg py-1"
                style={{
                  left: ctxMenu.x,
                  top: ctxMenu.y,
                  backgroundColor: dropdownColors.bg,
                  border: `1px solid ${dropdownColors.border}`,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                }}
              >
                {(() => {
                  const { sectionId: sid, blockId: bid } = ctxMenu;
                  const sec = portfolio.sections.find((s) => s.id === sid);
                  const blk = sec?.blocks.find((b) => b.id === bid);
                  const maxOrd = sec ? Math.max(...sec.blocks.map((b) => b.sortOrder), 0) : 0;
                  const minOrd = sec ? Math.min(...sec.blocks.map((b) => b.sortOrder), 0) : 0;

                  const act = (fn: () => void) => () => { setCtxMenu(null); fn(); };
                  const reorder = (order: number) => act(() => { portfolioStore.updateBlockInSection(sid, bid, { sortOrder: order } as Partial<BlockWithStyles>); builderStore.setDirty(true); });

                  return [
                    { label: "Bring to Front", shortcut: "]", action: reorder(maxOrd + 1), icon: "⇈" },
                    { label: "Bring Forward", shortcut: "↑", action: reorder((blk?.sortOrder ?? 0) + 1), icon: "↑" },
                    { label: "Send Backward", shortcut: "↓", action: reorder(Math.max(0, (blk?.sortOrder ?? 0) - 1)), icon: "↓" },
                    { label: "Send to Back", shortcut: "[", action: reorder(minOrd - 1), icon: "⇊" },
                    { label: "---" },
                    { label: "Duplicate", shortcut: "Ctrl+D", action: act(() => { if (blk) duplicateBlock(blk, sid); }), icon: "⧉" },
                    { label: blk?.isLocked ? "Unlock" : "Lock", action: act(() => { portfolioStore.updateBlockInSection(sid, bid, { isLocked: !blk?.isLocked }); builderStore.setDirty(true); }), icon: blk?.isLocked ? "🔓" : "🔒" },
                    { label: blk?.isVisible ? "Hide" : "Show", action: act(() => { portfolioStore.updateBlockInSection(sid, bid, { isVisible: !blk?.isVisible }); builderStore.setDirty(true); }), icon: blk?.isVisible ? "👁" : "🚫" },
                    { label: "---" },
                    { label: "Delete", shortcut: "⌫", action: act(() => deleteBlock(bid, sid)), danger: true, icon: "🗑" },
                  ] as Array<{ label: string; shortcut?: string; action?: () => void; icon?: string; danger?: boolean }>;
                })().map((item, i) =>
                  item.label === "---" ? (
                    <div key={i} className="mx-2 my-1 h-px" style={{ backgroundColor: dropdownColors.separator }} />
                  ) : (
                    <button
                      key={i}
                      onClick={item.action}
                      className="flex w-full items-center gap-2.5 px-3 py-[6px] text-left text-[12px] transition-colors"
                      style={{ color: item.danger ? "#f43f5e" : dropdownColors.textMuted }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <span className="w-4 text-center text-[10px]">{item.icon}</span>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[10px] opacity-40">{item.shortcut}</span>
                      )}
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {/* ── Minimap ───────────────────────────────────────────── */}
          {showMinimap && portfolio.sections.length > 0 && (() => {
            // Calculate bounds of all frames
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const frames = portfolio.sections.map((s, i) => {
              const ss = s.styles as SectionStyles;
              const fx = ss.frameX ?? 0;
              const fy = ss.frameY ?? i * (DEFAULT_FRAME_HEIGHT + 80);
              const fw = ss.frameWidth ?? DEFAULT_FRAME_WIDTH;
              const fh = ss.frameHeight ?? DEFAULT_FRAME_HEIGHT;
              minX = Math.min(minX, fx); minY = Math.min(minY, fy);
              maxX = Math.max(maxX, fx + fw); maxY = Math.max(maxY, fy + fh);
              return { id: s.id, x: fx, y: fy, w: fw, h: fh, name: s.name };
            });

            if (!isFinite(minX)) return null;

            const pad = 100;
            const worldW = maxX - minX + pad * 2;
            const worldH = maxY - minY + pad * 2;
            const mapW = 160;
            const mapH = Math.min(100, (worldH / worldW) * mapW);
            const scaleM = mapW / worldW;

            // Viewport in canvas coords
            const vpLeft = -transform.x / transform.scale;
            const vpTop = -transform.y / transform.scale;
            const vpW = 900 / transform.scale; // approximate canvas container width
            const vpH = 600 / transform.scale;

            return (
              <div
                className="absolute bottom-3 right-3 z-30 overflow-hidden rounded-lg"
                style={{
                  width: mapW,
                  height: mapH,
                  backgroundColor: "var(--b-panel)",
                  border: "1px solid var(--b-border-active)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                  opacity: 0.85,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mx = (e.clientX - rect.left) / scaleM + minX - pad;
                  const my = (e.clientY - rect.top) / scaleM + minY - pad;
                  setTransform({
                    ...transform,
                    x: -mx * transform.scale + 450,
                    y: -my * transform.scale + 300,
                  });
                }}
              >
                {/* Frame rectangles */}
                {frames.map((f) => (
                  <div
                    key={f.id}
                    className="absolute"
                    style={{
                      left: (f.x - minX + pad) * scaleM,
                      top: (f.y - minY + pad) * scaleM,
                      width: f.w * scaleM,
                      height: f.h * scaleM,
                      backgroundColor: selectedSectionId === f.id ? "var(--b-accent)" : "var(--b-surface)",
                      borderRadius: 2,
                      opacity: selectedSectionId === f.id ? 0.6 : 0.4,
                    }}
                  />
                ))}

                {/* Viewport indicator */}
                <div
                  className="absolute"
                  style={{
                    left: (vpLeft - minX + pad) * scaleM,
                    top: (vpTop - minY + pad) * scaleM,
                    width: vpW * scaleM,
                    height: vpH * scaleM,
                    border: "1.5px solid var(--b-accent)",
                    borderRadius: 2,
                    backgroundColor: "var(--b-accent-soft)",
                  }}
                />
              </div>
            );
          })()}

          {/* Bottom-left keyboard hint */}
          <div
            className="pointer-events-none absolute left-3 top-3 flex items-center gap-3 rounded-lg px-3 py-1.5 text-[10px]"
            style={{
              color: "var(--b-text-4)",
              backgroundColor: "var(--b-hint-bg)",
              backdropFilter: "blur(8px)",
              border: "1px solid var(--b-border)",
            }}
          >
            <span>
              <kbd className="builder-kbd">Scroll</kbd> Pan
            </span>
            <span>
              <kbd className="builder-kbd">Ctrl+Scroll</kbd> Zoom
            </span>
            <span>
              <kbd className="builder-kbd">Space</kbd> Drag
            </span>
          </div>
        </div>

        {/* ── RIGHT: Properties Panel ────────────────────────────── */}
        {showRightPanel && (
        <div
          className="builder-panel w-72 flex-shrink-0"
          style={{
            backgroundColor: "var(--b-panel)",
            borderLeft: "1px solid var(--b-border)",
          }}
        >
          {rightPanel === "theme" ? (
            <ThemeEditor portfolioId={portfolio.id} theme={portfolio.theme} />
          ) : rightPanel === "seo" ? (
            <SeoEditor portfolioId={portfolio.id} portfolio={portfolio} />
          ) : selectedBlock && selectedSectionId ? (
            <BlockPropertiesPanel
              block={selectedBlock}
              onUpdateContent={(content) =>
                updateBlock(selectedBlock.id, selectedSectionId, { content })
              }
              onUpdateStyles={(styles) =>
                updateBlock(selectedBlock.id, selectedSectionId, { styles })
              }
              onDelete={() =>
                deleteBlock(selectedBlock.id, selectedSectionId)
              }
              onDuplicate={() =>
                duplicateBlock(selectedBlock, selectedSectionId)
              }
              onToggleVisibility={() => {
                builderStore.pushSnapshot("toggle-visibility");
                portfolioStore.updateBlockInSection(selectedSectionId, selectedBlock.id, {
                  isVisible: !selectedBlock.isVisible,
                });
                builderStore.setDirty(true);
                scheduleAutoSave();
              }}
              onToggleLock={() => {
                builderStore.pushSnapshot("toggle-lock");
                portfolioStore.updateBlockInSection(selectedSectionId, selectedBlock.id, {
                  isLocked: !selectedBlock.isLocked,
                });
                builderStore.setDirty(true);
                scheduleAutoSave();
              }}
            />
          ) : selectedSectionId ? (
            /* ── Section/Frame Properties ──────────────────────── */
            (() => {
              const sec = portfolio.sections.find((s) => s.id === selectedSectionId);
              if (!sec) return null;
              const ss = sec.styles as SectionStyles;
              const updateSec = (updates: Partial<SectionStyles>) => {
                portfolioStore.updateSection(selectedSectionId, {
                  styles: { ...ss, ...updates },
                });
                builderStore.setDirty(true);
                scheduleAutoSave();
              };
              return (
                <div className="flex h-full flex-col">
                  <div
                    className="flex items-center justify-between px-3 py-2.5"
                    style={{ borderBottom: "1px solid var(--b-border)" }}
                  >
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: "var(--b-text)" }}>
                        Frame
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--b-text-4)" }}>
                        {sec.name}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSection(selectedSectionId)}
                      className="flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ color: "var(--b-danger)" }}
                      title="Delete frame"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* Name */}
                    <div style={{ borderBottom: "1px solid var(--b-border)" }} className="px-3 py-3">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--b-text-3)" }}>
                        Name
                      </span>
                      <input
                        type="text"
                        value={sec.name}
                        onChange={(e) => {
                          portfolioStore.updateSection(selectedSectionId, { name: e.target.value });
                          builderStore.setDirty(true);
                        }}
                        className="h-7 w-full rounded-md border-0 px-2 text-[11px] outline-none"
                        style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text)" }}
                      />
                    </div>

                    {/* Background Color */}
                    <div style={{ borderBottom: "1px solid var(--b-border)" }} className="px-3 py-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--b-text-3)" }}>
                          Background
                        </span>
                        {!!(ss as Record<string, unknown>).backgroundCustom && (
                          <button
                            onClick={() => updateSec({ backgroundCustom: false, backgroundColor: undefined } as Partial<SectionStyles>)}
                            className="text-[9px] font-medium"
                            style={{ color: "var(--b-accent)" }}
                          >
                            Use theme
                          </button>
                        )}
                      </div>
                      {!((ss as Record<string, unknown>).backgroundCustom) && (
                        <div
                          className="mb-1.5 rounded-md px-2 py-1 text-[10px]"
                          style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text-3)" }}
                        >
                          Following portfolio theme
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={
                            (ss as Record<string, unknown>).backgroundCustom && ss.backgroundColor && (ss.backgroundColor as string).startsWith("#")
                              ? (ss.backgroundColor as string)
                              : theme.backgroundColor
                          }
                          onChange={(e) => updateSec({ backgroundColor: e.target.value, backgroundCustom: true } as Partial<SectionStyles>)}
                          className="h-7 w-7 flex-shrink-0 cursor-pointer rounded-md border-0 p-0.5"
                          style={{ backgroundColor: "var(--b-surface)" }}
                        />
                        <input
                          type="text"
                          value={
                            (ss as Record<string, unknown>).backgroundCustom
                              ? ((ss.backgroundColor as string) ?? "")
                              : theme.backgroundColor
                          }
                          onChange={(e) => updateSec({ backgroundColor: e.target.value, backgroundCustom: true } as Partial<SectionStyles>)}
                          placeholder={theme.backgroundColor}
                          className="h-7 flex-1 rounded-md border-0 px-2 font-mono text-[11px] outline-none"
                          style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text)" }}
                        />
                      </div>
                    </div>

                    {/* Frame Dimensions */}
                    <div style={{ borderBottom: "1px solid var(--b-border)" }} className="px-3 py-3">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--b-text-3)" }}>
                        Size
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { label: "W", key: "frameWidth", val: ss.frameWidth ?? 1440 },
                          { label: "H", key: "frameHeight", val: ss.frameHeight ?? 800 },
                          { label: "X", key: "frameX", val: ss.frameX ?? 0 },
                          { label: "Y", key: "frameY", val: ss.frameY ?? 0 },
                        ] as const).map((f) => (
                          <div key={f.key} className="relative">
                            <span
                              className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase"
                              style={{ color: "var(--b-text-4)" }}
                            >
                              {f.label}
                            </span>
                            <input
                              type="number"
                              value={f.val}
                              onChange={(e) => updateSec({ [f.key]: Number(e.target.value) })}
                              className="h-7 w-full rounded-md border-0 text-right text-[11px] font-mono tabular-nums outline-none"
                              style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text)", paddingLeft: 22, paddingRight: 8 }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: "var(--b-surface)",
                  border: "1px solid var(--b-border)",
                }}
              >
                <MousePointer2
                  className="h-5 w-5"
                  style={{ color: "var(--b-text-4)" }}
                />
              </div>
              <p
                className="text-[13px] font-semibold"
                style={{ color: "var(--b-text-2)" }}
              >
                No element selected
              </p>
              <p
                className="mt-1.5 text-[11px] leading-relaxed"
                style={{ color: "var(--b-text-4)" }}
              >
                Click any element on the canvas to inspect and edit its
                properties
              </p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* ── Preview Overlay ──────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-[400] flex flex-col" style={{ backgroundColor: theme.backgroundColor }}>
          {/* Preview toolbar */}
          <div className="flex h-12 items-center justify-between px-4" style={{ backgroundColor: "var(--b-panel)", borderBottom: "1px solid var(--b-border)" }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPreview(false)} className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium" style={{ color: "var(--b-text-2)" }}>
                <X className="h-3.5 w-3.5" /> Close Preview
              </button>
              <span className="text-[11px] font-medium" style={{ color: "var(--b-text-4)" }}>Preview Mode — This is how your portfolio looks to visitors</span>
            </div>
          </div>
          {/* Portfolio content */}
          <div className="flex-1 overflow-y-auto">
            <PortfolioRenderer portfolio={portfolio} />
          </div>
        </div>
      )}

      {/* ── Keyboard Shortcuts Overlay ─────────────────────────── */}
      {showShortcuts && (
        <>
          <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          <div className="fixed left-1/2 top-1/2 z-[301] w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl" style={{ backgroundColor: dropdownColors.bg, border: `1px solid ${dropdownColors.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${dropdownColors.separator}` }}>
              <h2 className="text-[15px] font-bold" style={{ color: dropdownColors.text }}>Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} style={{ color: dropdownColors.textMuted }}><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 p-5">
              {[
                ["Ctrl+S", "Save"],
                ["Ctrl+Z", "Undo"],
                ["Ctrl+Shift+Z", "Redo"],
                ["Ctrl+E", "Export JSON"],
                ["Ctrl+P", "Preview"],
                ["Ctrl+H", "Export HTML"],
                ["Ctrl+\\", "Toggle left panel"],
                ["Ctrl+/", "Toggle right panel"],
                ["Ctrl+0", "Reset zoom"],
                ["Ctrl+1", "Fit to screen"],
                ["Ctrl+=", "Zoom in"],
                ["Ctrl+-", "Zoom out"],
                ["V", "Select tool"],
                ["R", "Rectangle tool"],
                ["O", "Circle tool"],
                ["L", "Line tool"],
                ["T", "Add text"],
                ["Escape", "Cancel / Deselect"],
                ["?", "Show shortcuts"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1.5">
                  <span className="text-[12px]" style={{ color: dropdownColors.textMuted }}>{desc}</span>
                  <kbd className="rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold" style={{ backgroundColor: dropdownColors.hover, color: dropdownColors.text, border: `1px solid ${dropdownColors.separator}` }}>{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
