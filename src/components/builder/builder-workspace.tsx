"use client";

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
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  ExternalLink,
  FileImage,
  FileJson,
  FolderDown,
  FolderUp,
  Globe,
  GripVertical,
  ImageDown,
  Layers,
  Layout,
  LayoutGrid,
  Loader2,
  Lock,
  LogOut,
  Maximize,
  Monitor,
  Moon,
  MousePointer2,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  Rocket,
  Save,
  Settings,
  Sparkles,
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
import { useSession, signOut } from "next-auth/react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BlockPropertiesPanel } from "@/components/builder/block-properties-panel";
import { BlockRenderer } from "@/components/builder/block-renderer";
import { ErrorBoundary } from "@/components/common/error-boundary";
import {
  CanvasElement,
  CanvasFrame,
  SmartGuides,
  type GuideInfo,
} from "@/components/builder/canvas-element";
import {
  CanvasEngine,
  ZoomControls,
  type CanvasTransform,
} from "@/components/builder/canvas-engine";
import { HorizontalRuler, VerticalRuler, RulerCorner } from "@/components/builder/canvas-rulers";
import { AdvancedColorInput } from "@/components/builder/color-picker";
import { CommandPalette } from "@/components/builder/command-palette";
import { FrameTemplateDialog, type FrameTemplate } from "@/components/builder/frame-template-dialog";
import { KeyboardShortcutsModal } from "@/components/builder/keyboard-shortcuts-modal";
import { OnboardingTour } from "@/components/builder/onboarding-tour";
import { SvgImportDialog } from "@/components/builder/svg-import-dialog";
import { ThemeEditor } from "@/components/builder/theme-editor";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ImageUpload } from "@/components/common/image-upload";
import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer";
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
import { BACKGROUND_PATTERNS, generatePatternStyles } from "@/config/background-patterns";
import {
  BLOCK_REGISTRY,
  BLOCK_CATEGORIES,
  getBlocksByCategory,
} from "@/config/block-registry";
import { SHAPE_CATEGORIES, getShapesByCategory } from "@/config/shape-presets";
import { apiGet, apiPatch, apiPut, apiPost, apiDelete } from "@/lib/api";
import { shareCommunityTemplate, type CommunityTemplateCategory } from "@/lib/api/community-templates";
import { saveBackup, markBackupSynced, getUnsyncedBackup, clearBackup } from "@/lib/idb-backup";
import { getInitials } from "@/lib/utils";
import { mergeDeviceStyles, extractOverrides } from "@/lib/utils/device-styles";
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
  depth = 0,
  groupChildren,
  isExpanded,
  onToggleExpand,
  isChildSelected,
  onChildSelect,
  onChildDelete,
}: {
  block: BlockWithStyles;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
  depth?: number;
  groupChildren?: BlockWithStyles[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isChildSelected?: (id: string) => boolean;
  onChildSelect?: (id: string) => void;
  onChildDelete?: (id: string) => void;
}) {
  const def = BLOCK_REGISTRY[block.type as keyof typeof BLOCK_REGISTRY];
  const label = def?.label ?? block.type;
  const content = block.content as Record<string, unknown>;
  const preview =
    (content.text as string) ??
    (content.name as string) ??
    (content.title as string) ??
    "";
  const isGroup = block.type === "group";

  return (
    <>
      <div
        className="builder-layer-item group flex cursor-pointer items-center gap-1 py-[5px] transition-colors duration-100"
        style={{
          paddingLeft: 8 + depth * 14,
          paddingRight: 8,
          backgroundColor: isSelected ? "var(--b-accent-soft)" : "transparent",
          color: isSelected ? "var(--b-accent)" : "var(--b-text-2)",
          opacity: block.isVisible ? 1 : 0.35,
          borderLeft: isSelected ? "2px solid var(--b-accent)" : "2px solid transparent",
        }}
        onClick={onSelect}
      >
        {isGroup && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
            className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
            style={{ color: "var(--b-text-4)" }}
          >
            <ChevronRight
              className="h-2.5 w-2.5 transition-transform duration-150"
              style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0)" }}
            />
          </button>
        )}
        <span className="flex h-4 w-4 flex-shrink-0 cursor-grab items-center justify-center opacity-0 transition-opacity group-hover:opacity-30" {...(dragHandleProps ?? {})}>
          <GripVertical className="h-2.5 w-2.5" style={{ color: "var(--b-text-4)" }} />
        </span>
        <span
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
          style={{
            backgroundColor: isSelected ? "var(--b-accent-mid)" : "var(--b-surface)",
            color: isSelected ? "var(--b-accent)" : "var(--b-text-4)",
            fontSize: 9,
            fontWeight: 700,
          }}
        >
          {label.charAt(0)}
        </span>
        <span
          className="min-w-0 flex-1 truncate text-[10px] font-medium"
          style={{ color: isSelected ? "var(--b-accent)" : "var(--b-text-2)" }}
        >
          {preview || label}
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
      {isGroup && isExpanded && groupChildren && groupChildren.length > 0 && (
        <div className="ml-4 border-l" style={{ borderColor: isSelected ? "var(--b-accent-mid)" : "var(--b-border)" }}>
          {groupChildren
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => (
              <LayerBlockItem
                key={child.id}
                block={child}
                isSelected={isChildSelected?.(child.id) ?? false}
                onSelect={() => onChildSelect?.(child.id)}
                onDelete={() => onChildDelete?.(child.id)}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </>
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
          <div className="mt-2 flex gap-1.5">
            <input
              type="text"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="Or paste URL..."
              className="h-7 flex-1 rounded-md border px-2.5 text-[11px] outline-none transition-colors focus:border-[var(--b-accent)]"
              style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
            />
            <button
              type="button"
              onClick={() => setOgImage(`/api/portfolios/${portfolioId}/og`)}
              className="flex-shrink-0 rounded-md px-2 py-1 text-[9px] font-semibold transition-colors"
              style={{ backgroundColor: "var(--b-accent-soft)", color: "var(--b-accent)" }}
              title="Auto-generate OG image from portfolio"
            >
              Auto
            </button>
          </div>
          <p className="mt-1 text-[9px]" style={{ color: "var(--b-text-4)" }}>
            Click &quot;Auto&quot; to generate from your portfolio title & theme
          </p>
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
                <img src={ogImage} alt="Twitter Card" loading="lazy" decoding="async" className="h-full w-full" style={{ objectFit: "cover" }} />
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

/* ── Version History Panel ──────────────────────────────────────── */

interface VersionData {
  id: string;
  label: string | null;
  createdAt: string;
  data: {
    title?: string;
    description?: string;
    sections: Array<{
      id: string;
      name: string;
      sortOrder: number;
      styles: Record<string, unknown>;
      isVisible: boolean;
      isLocked: boolean;
      blocks: Array<{
        id: string;
        type: string;
        sortOrder: number;
        content: Record<string, unknown>;
        styles: Record<string, unknown>;
        isVisible: boolean;
        isLocked: boolean;
      }>;
    }>;
    theme: Record<string, unknown> | null;
  };
  portfolioTitle: string;
}

function VersionPreviewModal({ portfolioId, version, onClose, onRestore, dropdownColors }: {
  portfolioId: string;
  version: VersionData;
  onClose: () => void;
  onRestore: () => void;
  dropdownColors: { bg: string; border: string; text: string; textMuted: string; hover: string; separator: string };
}) {
  const [restoring, setRestoring] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const restore = async () => {
    setRestoring(true);
    try {
      await apiPost(`/portfolios/${portfolioId}/versions/${version.id}/restore`, {});
      onRestore();
    } catch {} finally { setRestoring(false); setShowRestoreConfirm(false); }
  };

  // Build a PortfolioWithRelations-compatible object for the renderer
  const previewPortfolio = useMemo(() => {
    const d = version.data;
    const t = d.theme as Record<string, unknown> | null;
    return {
      id: portfolioId,
      title: d.title ?? version.portfolioTitle,
      slug: "",
      description: d.description ?? null,
      status: "DRAFT" as const,
      userId: "",
      templateId: null,
      isDefault: false,
      viewCount: 0,
      seoTitle: null,
      seoDescription: null,
      ogImageUrl: null,
      accessPassword: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sections: d.sections.map((s) => ({
        id: s.id,
        portfolioId,
        name: s.name,
        sortOrder: s.sortOrder,
        styles: s.styles,
        isVisible: s.isVisible,
        isLocked: s.isLocked,
        createdAt: new Date(),
        updatedAt: new Date(),
        blocks: s.blocks.map((b) => ({
          id: b.id,
          sectionId: s.id,
          type: b.type,
          sortOrder: b.sortOrder,
          content: b.content,
          styles: b.styles,
          isVisible: b.isVisible,
          isLocked: b.isLocked,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      })),
      theme: t ? {
        id: "",
        portfolioId,
        mode: (t.mode as string) ?? "DARK",
        primaryColor: (t.primaryColor as string) ?? "#6366f1",
        secondaryColor: (t.secondaryColor as string) ?? "#8b5cf6",
        accentColor: (t.accentColor as string) ?? "#06b6d4",
        backgroundColor: (t.backgroundColor as string) ?? "#0f172a",
        surfaceColor: (t.surfaceColor as string) ?? "#1e293b",
        textColor: (t.textColor as string) ?? "#f8fafc",
        mutedColor: (t.mutedColor as string) ?? "#94a3b8",
        fontHeading: (t.fontHeading as string) ?? "Space Grotesk",
        fontBody: (t.fontBody as string) ?? "Inter",
        fontMono: (t.fontMono as string) ?? "JetBrains Mono",
        borderRadius: (t.borderRadius as string) ?? "0.5rem",
        customCss: (t.customCss as string) ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } : null,
      template: null,
      user: { id: "", name: null, username: null, image: null },
    };
  }, [version, portfolioId]);

  return (
    <div className="fixed inset-0 z-[400] flex flex-col" style={{ backgroundColor: dropdownColors.bg }}>
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${dropdownColors.separator}` }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors" style={{ color: dropdownColors.textMuted }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: dropdownColors.text }}>
              {version.label ?? "Auto-save"}
            </p>
            <p className="text-[10px]" style={{ color: dropdownColors.textMuted }}>
              {new Date(version.createdAt).toLocaleString()} — {version.data.sections.length} section{version.data.sections.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRestoreConfirm(true)}
            disabled={restoring}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: "var(--b-accent)" }}
          >
            <Undo2 className="h-3.5 w-3.5" />
            Restore This Version
          </button>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors" style={{ color: dropdownColors.textMuted }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: previewPortfolio.theme?.backgroundColor ?? "#0f172a" }}>
        <PortfolioRenderer portfolio={previewPortfolio as never} />
      </div>

      <ConfirmDialog
        open={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={restore}
        title="Restore this version?"
        description="Current changes will be overwritten with this version's content. This action cannot be undone."
        confirmText="Restore"
        variant="danger"
        loading={restoring}
      />
    </div>
  );
}

function VersionHistoryPanel({ portfolioId, onClose, onRestore, dropdownColors }: { portfolioId: string; onClose: () => void; onRestore: () => void; dropdownColors: { bg: string; border: string; text: string; textMuted: string; hover: string; separator: string } }) {
  const [versions, setVersions] = useState<Array<{ id: string; label: string | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<VersionData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Array<{ id: string; label: string | null; createdAt: string }>>(`/portfolios/${portfolioId}/versions`)
      .then(setVersions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [portfolioId]);

  const restore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      await apiPost(`/portfolios/${portfolioId}/versions/${versionId}/restore`, {});
      onRestore();
    } catch {} finally { setRestoring(null); setConfirmRestoreId(null); }
  };

  const preview = async (versionId: string) => {
    setLoadingPreview(versionId);
    try {
      const data = await apiGet<VersionData>(`/portfolios/${portfolioId}/versions/${versionId}`);
      setPreviewVersion(data);
    } catch {} finally { setLoadingPreview(null); }
  };

  const saveVersion = async () => {
    await apiPost(`/portfolios/${portfolioId}/versions`, { label: "Manual save" });
    const data = await apiGet<Array<{ id: string; label: string | null; createdAt: string }>>(`/portfolios/${portfolioId}/versions`);
    setVersions(data);
  };

  if (previewVersion) {
    return (
      <VersionPreviewModal
        portfolioId={portfolioId}
        version={previewVersion}
        onClose={() => setPreviewVersion(null)}
        onRestore={onRestore}
        dropdownColors={dropdownColors}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[300] bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[301] h-full w-80 overflow-y-auto" style={{ backgroundColor: dropdownColors.bg, borderLeft: `1px solid ${dropdownColors.border}` }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${dropdownColors.separator}` }}>
          <h2 className="text-[14px] font-bold" style={{ color: dropdownColors.text }}>Version History</h2>
          <div className="flex items-center gap-2">
            <button onClick={saveVersion} className="rounded-md px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: "var(--b-accent-soft)", color: "var(--b-accent)" }}>Save Now</button>
            <button onClick={onClose} style={{ color: dropdownColors.textMuted }}><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="p-3 space-y-1.5">
          {loading && <p className="text-[12px] py-8 text-center" style={{ color: dropdownColors.textMuted }}>Loading...</p>}
          {!loading && versions.length === 0 && <p className="text-[12px] py-8 text-center" style={{ color: dropdownColors.textMuted }}>No versions saved yet</p>}
          {versions.map((v) => (
            <div key={v.id} className="rounded-lg p-3" style={{ backgroundColor: dropdownColors.hover }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium" style={{ color: dropdownColors.text }}>{v.label ?? "Auto-save"}</p>
                  <p className="text-[10px]" style={{ color: dropdownColors.textMuted }}>{new Date(v.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  onClick={() => preview(v.id)}
                  disabled={loadingPreview === v.id}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors"
                  style={{ backgroundColor: "var(--b-accent-soft)", color: "var(--b-accent)" }}
                >
                  {loadingPreview === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                  Preview
                </button>
                <button
                  onClick={() => setConfirmRestoreId(v.id)}
                  disabled={restoring === v.id}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors"
                  style={{ color: dropdownColors.textMuted }}
                >
                  <Undo2 className="h-3 w-3" />
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmRestoreId}
        onClose={() => setConfirmRestoreId(null)}
        onConfirm={() => { if (confirmRestoreId) restore(confirmRestoreId); }}
        title="Restore this version?"
        description="Current changes will be overwritten with this version's content. This action cannot be undone."
        confirmText="Restore"
        variant="danger"
        loading={!!restoring}
      />

    </>
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

  const [leftTab, setLeftTab] = useState<"layers" | "elements" | "shapes">("layers");

  // ── Panel visibility ────────────────────────────────────────────
  const showLeftPanel = builderStore.leftPanelOpen;
  const setShowLeftPanel = (v: boolean) => { if (v !== builderStore.leftPanelOpen) builderStore.toggleLeftPanel(); };
  const showRightPanel = builderStore.rightPanelOpen;
  const setShowRightPanel = (v: boolean) => { if (v !== builderStore.rightPanelOpen) builderStore.toggleRightPanel(); };
  const showMinimap = builderStore.showMinimap;
  const setShowMinimap = (v: boolean) => builderStore.setShowMinimap(v);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSvgImport, setShowSvgImport] = useState(false);

  // ── Canvas state ──────────────────────────────────────────────
  const [transform, setTransform] = useState<CanvasTransform>({
    x: 100,
    y: 100,
    scale: 0.6,
  });
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const resizeSnapshotPushed = useRef(false);
  const lastSnapshotTime = useRef(0);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    portfolio.sections[0]?.id ?? null,
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(portfolio.sections.map((s) => s.id)),
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showAddSection, setShowAddSection] = useState(false);
  const [pageDialog, setPageDialog] = useState<{ mode: "add" | "rename" | "delete"; pageId?: string; value?: string } | null>(null);
  const [addSectionName, setAddSectionName] = useState("");
  const [showFrameTemplateDialog, setShowFrameTemplateDialog] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<"properties" | "theme" | "seo">(
    "properties",
  );
  const [saving, setSaving] = useState(false);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const recoveryDataRef = useRef<PortfolioWithRelations | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishPassword, setPublishPassword] = useState(portfolio.accessPassword ?? "");
  const [publishTab, setPublishTab] = useState<"publish" | "template">("publish");
  const [templateName, setTemplateName] = useState(portfolio.title);
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateCategory, setTemplateCategory] = useState<CommunityTemplateCategory>("DEVELOPER");
  const [templateIsDark, setTemplateIsDark] = useState(true);
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [templateTagInput, setTemplateTagInput] = useState("");
  const [sharingTemplate, setSharingTemplate] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [guides, setGuides] = useState<GuideInfo[]>([]);

  // ── Draw mode (Figma-style click-drag to create) ──────────────
  const [drawMode, setDrawMode] = useState<BlockType | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const drawContainerRef = useRef<HTMLDivElement>(null);

  // ── Context menu ──────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<{
    type: "block" | "frame";
    blockId?: string;
    sectionId: string;
    x: number;
    y: number;
  } | null>(null);

  const handleBlockContextMenu = (blockId: string, x: number, y: number) => {
    for (const s of portfolio.sections) {
      if (s.blocks.some((b) => b.id === blockId)) {
        setCtxMenu({ type: "block", blockId, sectionId: s.id, x, y });
        return;
      }
    }
  };

  const handleFrameContextMenu = (sectionId: string, x: number, y: number) => {
    setCtxMenu({ type: "frame", sectionId, x, y });
  };

  const closeCtxMenu = () => setCtxMenu(null);

  // Memoize sorted sections
  const sortedSections = useMemo(
    () => [...portfolio.sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [portfolio.sections],
  );

  const hasPages = portfolio.pages && portfolio.pages.length > 0;
  const visibleSections = useMemo(
    () => sortedSections.filter((s) => {
      if (!s.isVisible) return false;
      if (!hasPages) return true; // No pages = show all (backwards compat)
      if (!currentPageId) return !s.pageId; // Home page = sections with no pageId
      return s.pageId === currentPageId;
    }),
    [sortedSections, currentPageId, hasPages],
  );

  const selectedBlock = useMemo(() => {
    if (selectedBlockIds.size !== 1) return null;
    const id = [...selectedBlockIds][0];
    for (const s of portfolio.sections) {
      const b = s.blocks.find((bl) => bl.id === id);
      if (b) return b;
    }
    return null;
  }, [selectedBlockIds, portfolio.sections]);

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
      setSelectedBlockIds(new Set([res.id]));
      setSelectedSectionId(sectionId);
      setRightPanel("properties");
    } catch { /* handle */ }
  };

  // ── Draw mode handlers ────────────────────────────────────────
  const handleDrawMouseDown = useCallback((e: React.PointerEvent | React.MouseEvent) => {
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

  const handleDrawMouseMove = useCallback((e: React.PointerEvent | React.MouseEvent) => {
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
    setSelectedBlockIds(new Set());
    setSelectedSectionId(null);
  }, []);

  const selectBlock = useCallback(
    (blockId: string, additive: boolean) => {
      setSelectedBlockIds((prev) => {
        if (additive) {
          const next = new Set(prev);
          if (next.has(blockId)) {
            next.delete(blockId);
          } else {
            next.add(blockId);
          }
          return next;
        }
        return new Set([blockId]);
      });
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
    setSelectedBlockIds(new Set());
  }, []);

  // ── Block CRUD ────────────────────────────────────────────────

  const addBlock = (sectionId: string, type: BlockType, overrides?: { content?: Record<string, unknown>; styles?: Partial<BlockStyles> }) => {
    const def = BLOCK_REGISTRY[type];
    if (!def) return;
    const section = portfolio.sections.find((s) => s.id === sectionId);
    const existingBlocks = section?.blocks ?? [];
    const maxY = existingBlocks.reduce((max, b) => {
      const by = (b.styles.y ?? 0) + (b.styles.h ?? 50);
      return Math.max(max, by);
    }, 20);

    // Local-first: generate ID client-side, add to store instantly
    // Block is persisted via batch save (auto-save or manual)
    const newBlock = {
      id: crypto.randomUUID(),
      sectionId,
      type,
      sortOrder: existingBlocks.length,
      isVisible: true,
      isLocked: false,
      content: { ...def.defaultContent, ...overrides?.content },
      styles: {
        ...def.defaultStyles,
        x: 40,
        y: maxY + 16,
        w: DEFAULT_BLOCK_W,
        h: DEFAULT_BLOCK_H,
        ...overrides?.styles,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as BlockWithStyles;

    builderStore.pushSnapshot("add-block");
    portfolioStore.addBlockToSection(sectionId, newBlock);
    setSelectedBlockIds(new Set([newBlock.id]));
    setSelectedSectionId(sectionId);
    setRightPanel("properties");
    builderStore.setDirty(true);
    scheduleAutoSave();
  };

  const moveBlock = useCallback(
    (blockId: string, newX: number, newY: number) => {
      if (!selectedSectionId) return;
      const section = portfolio.sections.find((s) => s.id === selectedSectionId);
      if (!section) return;
      const block = section.blocks.find((b) => b.id === blockId);
      if (!block) return;
      const gs = builderStore.gridSize;
      const snap = builderStore.snapToGrid;
      const device = builderStore.devicePreview;

      const startPos = dragStartPositions.current.get(blockId);
      const dx = startPos ? newX - startPos.x : 0;
      const dy = startPos ? newY - startPos.y : 0;

      const toMove: Array<{ b: typeof block; tx: number; ty: number }> = [];
      if (selectedBlockIds.has(blockId) && startPos) {
        for (const b of section.blocks) {
          if (!selectedBlockIds.has(b.id)) continue;
          const bStart = dragStartPositions.current.get(b.id);
          if (!bStart) continue;
          toMove.push({ b, tx: bStart.x + dx, ty: bStart.y + dy });
        }
      }
      if (toMove.length === 0) {
        toMove.push({ b: block, tx: newX, ty: newY });
      }

      // ── Smart alignment guides ──────────────────────────
      const SNAP_THRESHOLD = 5;
      const ss = section.styles as SectionStyles;
      const frameW = ss.frameWidth ?? DEFAULT_FRAME_WIDTH;
      const frameH = ss.frameHeight ?? DEFAULT_FRAME_HEIGHT;
      const movingW = (block.styles as BlockStyles).w ?? DEFAULT_BLOCK_W;
      const movingH = (block.styles as BlockStyles).h ?? 50;
      let snappedX = toMove[0]?.tx ?? newX;
      let snappedY = toMove[0]?.ty ?? newY;
      const newGuides: GuideInfo[] = [];

      // Collect edges of other blocks (not being moved)
      const otherBlocks = section.blocks.filter(
        (b) => b.isVisible && !selectedBlockIds.has(b.id) && !b.parentId
      );
      const edges = {
        vLines: [0, frameW, frameW / 2] as number[], // frame left, right, center
        hLines: [0, frameH, frameH / 2] as number[], // frame top, bottom, center
      };
      for (const ob of otherBlocks) {
        const obs = ob.styles as BlockStyles;
        const ox = obs.x ?? 0;
        const oy = obs.y ?? 0;
        const ow = obs.w ?? 200;
        const oh = obs.h ?? 50;
        edges.vLines.push(ox, ox + ow, ox + ow / 2); // left, right, center
        edges.hLines.push(oy, oy + oh, oy + oh / 2); // top, bottom, center
      }

      // Check vertical alignment (x-axis snap)
      const movingEdgesX = [snappedX, snappedX + movingW, snappedX + movingW / 2];
      for (const mx of movingEdgesX) {
        for (const vl of edges.vLines) {
          if (Math.abs(mx - vl) < SNAP_THRESHOLD) {
            const offset = vl - mx;
            snappedX += offset;
            newGuides.push({
              type: "vertical",
              position: vl,
              start: Math.min(snappedY, 0) - 20,
              end: Math.max(snappedY + movingH, frameH) + 20,
            });
            break;
          }
        }
      }

      // Check horizontal alignment (y-axis snap)
      const movingEdgesY = [snappedY, snappedY + movingH, snappedY + movingH / 2];
      for (const my of movingEdgesY) {
        for (const hl of edges.hLines) {
          if (Math.abs(my - hl) < SNAP_THRESHOLD) {
            const offset = hl - my;
            snappedY += offset;
            newGuides.push({
              type: "horizontal",
              position: hl,
              start: Math.min(snappedX, 0) - 20,
              end: Math.max(snappedX + movingW, frameW) + 20,
            });
            break;
          }
        }
      }

      // Add frame-relative offset for guide rendering
      const fx = ss.frameX ?? 0;
      const fy = ss.frameY ?? portfolio.sections.indexOf(section) * (DEFAULT_FRAME_HEIGHT + 80);
      setGuides(
        newGuides.map((g) =>
          g.type === "vertical"
            ? { ...g, position: g.position + fx, start: g.start + fy, end: g.end + fy }
            : { ...g, position: g.position + fy, start: g.start + fx, end: g.end + fx }
        ),
      );

      // Apply snapped position (override grid snap when guide snapping)
      const hasGuideSnap = newGuides.length > 0;
      const snapDx = snappedX - (toMove[0]?.tx ?? newX);
      const snapDy = snappedY - (toMove[0]?.ty ?? newY);

      for (const { b, tx, ty } of toMove) {
        const finalX = hasGuideSnap ? tx + snapDx : (snap ? Math.round(tx / gs) * gs : tx);
        const finalY = hasGuideSnap ? ty + snapDy : (snap ? Math.round(ty / gs) * gs : ty);
        if (device === "desktop") {
          portfolioStore.updateBlockInSection(selectedSectionId, b.id, {
            styles: { ...(b.styles as BlockStyles), x: finalX, y: finalY },
          });
        } else {
          const field = device === "tablet" ? "tabletStyles" : "mobileStyles";
          const existing = (b[field] ?? {}) as Partial<BlockStyles>;
          portfolioStore.updateBlockInSection(selectedSectionId, b.id, {
            [field]: { ...existing, x: finalX, y: finalY },
          });
        }
      }
    },
    [selectedSectionId, selectedBlockIds, portfolio.sections, portfolioStore, builderStore.gridSize, builderStore.snapToGrid, builderStore.devicePreview, setGuides],
  );

  const handleBlockDragStart = useCallback(
    (blockId: string) => {
      builderStore.pushSnapshot("move-block");
      if (!selectedSectionId) return;
      const section = portfolio.sections.find((s) => s.id === selectedSectionId);
      if (!section) return;
      const device = builderStore.devicePreview;
      const snapshot = new Map<string, { x: number; y: number }>();
      for (const b of section.blocks) {
        if (!selectedBlockIds.has(b.id)) continue;
        const ms = mergeDeviceStyles(
          b.styles,
          b.tabletStyles as Partial<BlockStyles>,
          b.mobileStyles as Partial<BlockStyles>,
          device,
        );
        snapshot.set(b.id, { x: ms.x ?? 0, y: ms.y ?? 0 });
      }
      if (!snapshot.has(blockId)) {
        const b = section.blocks.find((bl) => bl.id === blockId);
        if (b) {
          const ms = mergeDeviceStyles(
            b.styles,
            b.tabletStyles as Partial<BlockStyles>,
            b.mobileStyles as Partial<BlockStyles>,
            device,
          );
          snapshot.set(blockId, { x: ms.x ?? 0, y: ms.y ?? 0 });
        }
      }
      dragStartPositions.current = snapshot;
    },
    [selectedSectionId, selectedBlockIds, portfolio.sections, builderStore.devicePreview],
  );

  const handleMarqueeEnd = useCallback(
    (canvasX1: number, canvasY1: number, canvasX2: number, canvasY2: number) => {
      const intersecting = new Set<string>();
      let hitSectionId: string | null = null;
      for (const section of portfolio.sections) {
        if (!section.isVisible) continue;
        // Restrict marquee to a single section — moveBlock assumes selectedSectionId
        if (hitSectionId && section.id !== hitSectionId) continue;
        // Frame offset — block x/y are relative to the frame, marquee coords are absolute canvas
        const ss = section.styles as SectionStyles;
        const fx = ss.frameX ?? 0;
        const fy = ss.frameY ?? portfolio.sections.indexOf(section) * (DEFAULT_FRAME_HEIGHT + 80);
        for (const block of section.blocks) {
          if (!block.isVisible) continue;
          const bs = block.styles as BlockStyles;
          const bx = (bs.x ?? 0) + fx;
          const by = (bs.y ?? 0) + fy;
          const bw = bs.w ?? 200;
          const bh = bs.h ?? 50;
          if (bx < canvasX2 && bx + bw > canvasX1 && by < canvasY2 && by + bh > canvasY1) {
            intersecting.add(block.id);
            hitSectionId = section.id;
          }
        }
      }
      if (intersecting.size > 0) {
        setSelectedBlockIds(intersecting);
        if (hitSectionId) setSelectedSectionId(hitSectionId);
        setRightPanel("properties");
      }
    },
    [portfolio.sections],
  );

  const moveFrame = useCallback(
    (sectionId: string, newX: number, newY: number) => {
      if (!resizeSnapshotPushed.current) {
        builderStore.pushSnapshot("move-frame");
        resizeSnapshotPushed.current = true;
      }
      const section = portfolio.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const ss = section.styles as SectionStyles;
      portfolioStore.updateSection(sectionId, {
        styles: { ...ss, frameX: newX, frameY: newY },
      });
    },
    [portfolio.sections, portfolioStore],
  );

  const resizeFrame = useCallback(
    (sectionId: string, newW: number, newH: number) => {
      if (!resizeSnapshotPushed.current) {
        builderStore.pushSnapshot("resize-frame");
        resizeSnapshotPushed.current = true;
      }
      const section = portfolio.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const ss = section.styles as SectionStyles;
      portfolioStore.updateSection(sectionId, {
        styles: { ...ss, frameWidth: newW, frameHeight: newH },
      });
    },
    [portfolio.sections, portfolioStore],
  );

  const resizeBlock = useCallback(
    (
      blockId: string,
      newW: number,
      newH: number,
      newX: number,
      newY: number,
    ) => {
      if (!resizeSnapshotPushed.current) {
        builderStore.pushSnapshot("resize-block");
        resizeSnapshotPushed.current = true;
      }
      if (!selectedSectionId) return;
      const block = portfolio.sections
        .find((s) => s.id === selectedSectionId)
        ?.blocks.find((b) => b.id === blockId);
      if (!block) return;
      const gs = builderStore.gridSize;
      const snap = builderStore.snapToGrid;
      const sx = snap ? Math.round(newX / gs) * gs : newX;
      const sy = snap ? Math.round(newY / gs) * gs : newY;
      const sw = Math.max(20, snap ? Math.round(newW / gs) * gs : newW);
      const sh = Math.max(10, snap ? Math.round(newH / gs) * gs : newH);
      const device = builderStore.devicePreview;
      if (device === "desktop") {
        portfolioStore.updateBlockInSection(selectedSectionId, blockId, {
          styles: { ...(block.styles as BlockStyles), x: sx, y: sy, w: sw, h: sh },
        });
      } else {
        const field = device === "tablet" ? "tabletStyles" : "mobileStyles";
        const existing = (block[field] ?? {}) as Partial<BlockStyles>;
        portfolioStore.updateBlockInSection(selectedSectionId, blockId, {
          [field]: { ...existing, x: sx, y: sy, w: sw, h: sh },
        });
      }
    },
    [selectedSectionId, portfolio.sections, portfolioStore, builderStore.gridSize, builderStore.snapToGrid, builderStore.devicePreview],
  );

  const updateBlock = (
    blockId: string,
    sectionId: string,
    updates: { content?: Record<string, unknown>; styles?: BlockStyles },
  ) => {
    // Debounce snapshots — only push if last one was 500ms+ ago (avoids flooding on rapid edits)
    const now = Date.now();
    if (now - lastSnapshotTime.current > 500) {
      builderStore.pushSnapshot("update-block");
      lastSnapshotTime.current = now;
    }
    const device = builderStore.devicePreview;
    if (device === "desktop" || !updates.styles) {
      portfolioStore.updateBlockInSection(sectionId, blockId, updates as Partial<BlockWithStyles>);
    } else {
      // In tablet/mobile mode, extract only changed properties as sparse overrides
      const block = portfolio.sections
        .flatMap((s) => s.blocks)
        .find((b) => b.id === blockId);
      const baseStyles = block?.styles ?? ({} as BlockStyles);
      const overrides = extractOverrides(baseStyles, updates.styles);
      const field = device === "tablet" ? "tabletStyles" : "mobileStyles";
      const existing = (block?.[field] ?? {}) as Partial<BlockStyles>;
      const merged = { ...existing, ...overrides };
      portfolioStore.updateBlockInSection(sectionId, blockId, {
        ...(updates.content ? { content: updates.content } : {}),
        [field]: merged,
      } as Partial<BlockWithStyles>);
    }
    builderStore.setDirty(true);
    scheduleAutoSave();
  };

  const deleteBlock = (blockId: string, sectionId: string) => {
    builderStore.pushSnapshot("delete-block");
    // Remove from store instantly (local-first)
    portfolioStore.removeBlockFromSection(sectionId, blockId);
    if (selectedBlockIds.has(blockId)) {
      setSelectedBlockIds((prev) => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }
    // Delete from DB in background
    apiDelete(`/portfolios/${portfolio.id}/sections/${sectionId}/blocks/${blockId}`).catch(() => {});
    builderStore.setDirty(true);
    scheduleAutoSave();
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
          tabletStyles: block.tabletStyles ?? {},
          mobileStyles: block.mobileStyles ?? {},
        },
      );
      portfolioStore.addBlockToSection(sectionId, res);
      setSelectedBlockIds(new Set([res.id]));
    } catch {
      /* handle */
    }
  };

  // ── Group / Ungroup ──────────────────────────────────────────

  const groupSelectedBlocks = () => {
    if (selectedBlockIds.size < 2 || !selectedSectionId) return;
    const section = portfolio.sections.find((s) => s.id === selectedSectionId);
    if (!section) return;
    const blocks = section.blocks.filter((b) => selectedBlockIds.has(b.id));
    if (blocks.length < 2) return;

    // Ensure all selected blocks are in the same section and are top-level
    if (blocks.some((b) => b.parentId)) return;

    builderStore.pushSnapshot("group-blocks");

    // Compute bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of blocks) {
      const bs = b.styles as BlockStyles;
      const bx = bs.x ?? 0;
      const by = bs.y ?? 0;
      const bw = bs.w ?? DEFAULT_BLOCK_W;
      const bh = bs.h ?? 0;
      if (bx < minX) minX = bx;
      if (by < minY) minY = by;
      if (bx + bw > maxX) maxX = bx + bw;
      if (by + bh > maxY) maxY = by + bh;
    }

    const groupId = crypto.randomUUID();
    const groupBlock: BlockWithStyles = {
      id: groupId,
      sectionId: selectedSectionId,
      type: "group",
      sortOrder: Math.max(...section.blocks.map((b) => b.sortOrder), 0) + 1,
      isVisible: true,
      isLocked: false,
      content: {},
      styles: {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY,
        backgroundColor: "transparent",
        overflow: "visible",
      } as BlockStyles,
      tabletStyles: {},
      mobileStyles: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as BlockWithStyles;

    portfolioStore.addBlockToSection(selectedSectionId, groupBlock);

    // Update children: set parentId and make positions relative to group
    for (const b of blocks) {
      const bs = b.styles as BlockStyles;
      portfolioStore.updateBlockInSection(selectedSectionId, b.id, {
        parentId: groupId,
        styles: { ...bs, x: (bs.x ?? 0) - minX, y: (bs.y ?? 0) - minY },
      } as Partial<BlockWithStyles>);
    }

    setSelectedBlockIds(new Set([groupId]));
    setExpandedGroups((prev) => new Set([...prev, groupId]));
    builderStore.setDirty(true);
    scheduleAutoSave();
  };

  const ungroupBlock = () => {
    if (selectedBlockIds.size !== 1 || !selectedSectionId) return;
    const groupId = [...selectedBlockIds][0]!;
    const section = portfolio.sections.find((s) => s.id === selectedSectionId);
    if (!section) return;
    const group = section.blocks.find((b) => b.id === groupId);
    if (!group || group.type !== "group") return;

    builderStore.pushSnapshot("ungroup-blocks");

    const gs = group.styles as BlockStyles;
    const gx = gs.x ?? 0;
    const gy = gs.y ?? 0;
    const children = section.blocks.filter((b) => b.parentId === groupId);
    const childIds = new Set<string>();

    // Move children back to top level
    for (const child of children) {
      const cs = child.styles as BlockStyles;
      portfolioStore.updateBlockInSection(selectedSectionId, child.id, {
        parentId: null,
        styles: { ...cs, x: (cs.x ?? 0) + gx, y: (cs.y ?? 0) + gy },
      } as Partial<BlockWithStyles>);
      childIds.add(child.id);
    }

    // Remove group block
    portfolioStore.removeBlockFromSection(selectedSectionId, groupId);
    apiDelete(`/portfolios/${portfolio.id}/sections/${selectedSectionId}/blocks/${groupId}`).catch(() => {});

    setSelectedBlockIds(childIds);
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
    builderStore.setDirty(true);
    scheduleAutoSave();
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
          pageId: currentPageId,
        },
      );
      builderStore.pushSnapshot("add-section");
      portfolioStore.addSection({ ...res, pageId: currentPageId } as SectionWithBlocks);
      setAddSectionName("");
      setShowAddSection(false);
      setExpandedSections((p) => new Set([...p, res.id]));
    } catch {
      /* handle */
    }
  };

  const addPage = async (title: string) => {
    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      const res = await apiPost<{ id: string; title: string; slug: string; sortOrder: number; isDefault: boolean }>(`/portfolios/${portfolio.id}/pages`, { title, slug });
      portfolioStore.replacePortfolio({ ...portfolio, pages: [...(portfolio.pages ?? []), res] });
      setCurrentPageId(res.id);
    } catch {
      /* handle */
    }
  };

  const deletePage = async (pageId: string) => {
    const page = portfolio.pages?.find((p) => p.id === pageId);
    if (!page || page.isDefault) return;
    try {
      await apiDelete(`/portfolios/${portfolio.id}/pages/${pageId}`);
      portfolioStore.replacePortfolio({
        ...portfolio,
        pages: (portfolio.pages ?? []).filter((p) => p.id !== pageId),
        sections: portfolio.sections.map((s) => s.pageId === pageId ? { ...s, pageId: null } : s),
      });
      if (currentPageId === pageId) setCurrentPageId(null);
    } catch {
      /* handle */
    }
  };

  const renamePage = async (pageId: string, newTitle: string) => {
    const newSlug = newTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      await apiPatch(`/portfolios/${portfolio.id}/pages/${pageId}`, { title: newTitle, slug: newSlug });
      portfolioStore.replacePortfolio({
        ...portfolio,
        pages: (portfolio.pages ?? []).map((p) => p.id === pageId ? { ...p, title: newTitle, slug: newSlug } : p),
      });
    } catch {
      /* handle */
    }
  };

  const addSectionFromTemplate = async (template: FrameTemplate) => {
    const yOffset = portfolio.sections.reduce((max, s) => {
      const ss = s.styles as SectionStyles;
      return Math.max(max, (ss.frameY ?? 0) + (ss.frameHeight ?? DEFAULT_FRAME_HEIGHT));
    }, 0);

    try {
      // Create the section
      const res = await apiPost<SectionWithBlocks>(
        `/portfolios/${portfolio.id}/sections`,
        {
          name: template.name,
          sortOrder: portfolio.sections.length,
          styles: {
            frameX: 0,
            frameY: yOffset + 80,
            frameWidth: DEFAULT_FRAME_WIDTH,
            frameHeight: template.frameHeight,
            layout: "absolute",
            // Enable stagger for templates with multiple blocks
            ...(template.id !== "blank" ? { staggerChildren: true, staggerAnimation: "fade-up", staggerDelay: 100 } : {}),
          },
          pageId: currentPageId,
        },
      );

      builderStore.pushSnapshot("add-section-template");
      portfolioStore.addSection({ ...res, pageId: currentPageId } as SectionWithBlocks);
      setExpandedSections((p) => new Set([...p, res.id]));
      setSelectedSectionId(res.id);
      setSelectedBlockIds(new Set());

      // Add template blocks
      const templateBlocks = template.blocks(theme);
      for (let i = 0; i < templateBlocks.length; i++) {
        const tb = templateBlocks[i]!;
        const def = BLOCK_REGISTRY[tb.type as BlockType];
        if (!def) continue;

        const newBlock = {
          id: crypto.randomUUID(),
          sectionId: res.id,
          type: tb.type,
          sortOrder: i,
          isVisible: true,
          isLocked: false,
          content: { ...def.defaultContent, ...tb.content },
          styles: { ...def.defaultStyles, ...tb.styles },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as BlockWithStyles;

        portfolioStore.addBlockToSection(res.id, newBlock);
      }

      builderStore.setDirty(true);
      scheduleAutoSave();
      setShowFrameTemplateDialog(false);
    } catch {
      /* handle */
    }
  };

  const exportFrameAsPng = async (sectionId: string, frameName: string) => {
    const frameEl = document.querySelector(`[data-frame-id="${sectionId}"]`) as HTMLElement | null;
    if (!frameEl) return;

    try {
      const { toPng } = await import("html-to-image");

      // Temporarily remove selection styles for clean export
      const prevBorder = frameEl.style.border;
      const prevBoxShadow = frameEl.style.boxShadow;
      frameEl.style.border = "none";
      frameEl.style.boxShadow = "none";

      // Hide selection overlays and resize handles inside the frame
      const overlays = frameEl.querySelectorAll<HTMLElement>("[class*='z-10'], [class*='z-20'], [class*='z-30'], [class*='z-50']");
      const prevDisplay: string[] = [];
      overlays.forEach((el, i) => {
        prevDisplay[i] = el.style.display;
        if (el.style.pointerEvents === "none" || el.style.cursor) el.style.display = "none";
      });

      const dataUrl = await toPng(frameEl, {
        pixelRatio: 2,
        backgroundColor: frameEl.style.backgroundColor || "#0f172a",
      });

      // Restore styles
      frameEl.style.border = prevBorder;
      frameEl.style.boxShadow = prevBoxShadow;
      overlays.forEach((el, i) => { el.style.display = prevDisplay[i] ?? ""; });

      // Download
      const link = document.createElement("a");
      link.download = `${frameName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export frame:", err);
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
        setSelectedBlockIds(new Set());
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
      await apiPut(
        `/portfolios/${portfolio.id}/batch`,
        {
          sections: portfolio.sections.map((s) => ({
            id: s.id,
            name: s.name,
            sortOrder: s.sortOrder,
            styles: s.styles,
            isVisible: s.isVisible,
            pageId: s.pageId ?? null,
            blocks: s.blocks.map((b) => ({
              id: b.id,
              type: b.type,
              sortOrder: b.sortOrder,
              content: b.content,
              styles: b.styles,
              tabletStyles: b.tabletStyles ?? {},
              mobileStyles: b.mobileStyles ?? {},
              isVisible: b.isVisible,
              isLocked: b.isLocked,
              parentId: b.parentId ?? null,
            })),
          })),
        },
        { timeout: 60000 },
      );
      builderStore.markSaved();
      markBackupSynced(portfolio.id);
    } catch {
      /* handle */
    }
    isSavingRef.current = false;
    setSaving(false);
  }, [portfolio.sections, portfolio.id, builderStore]);

  // ── Smart Save: save on idle (10s), blur, Ctrl+S, drag end ──
  // scheduleAutoSave = lightweight: just backup to IndexedDB + reset idle timer
  // Actual server save happens on: idle timeout, page blur, Ctrl+S, drag/resize end

  const scheduleAutoSave = useCallback(() => {
    // Immediately backup to IndexedDB (survives tab close / crash)
    saveBackup(portfolio);
    builderStore.setDirty(true);

    // Reset idle timer — save after 10s of inactivity
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      batchSave();
    }, 10000);
  }, [batchSave, portfolio, builderStore]);

  const handleBlockDragOrResizeEnd = useCallback(() => {
    resizeSnapshotPushed.current = false;
    setGuides([]);
    builderStore.setDirty(true);
    saveBackup(portfolio);
    batchSave();
  }, [builderStore, batchSave, portfolio]);

  // Cleanup idle timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  // Save on page blur / tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && builderStore.isDirty) {
        batchSave();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [batchSave, builderStore.isDirty]);

  // ── Save to IndexedDB on tab close (last chance before crash) ──
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (builderStore.isDirty) {
        saveBackup(portfolio);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [portfolio, builderStore.isDirty]);

  // ── Load editor preferences from DB (new device) ──
  useEffect(() => {
    builderStore.loadPrefsFromDb();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Crash Recovery: check for unsynced IndexedDB backup on mount ──
  useEffect(() => {
    (async () => {
      const backup = await getUnsyncedBackup(portfolio.id);
      if (backup && backup.savedAt > (portfolio.updatedAt ? new Date(portfolio.updatedAt).getTime() : 0)) {
        recoveryDataRef.current = backup.data;
        setShowRecoveryBanner(true);
      } else {
        // No recovery needed — clear stale backup
        clearBackup(portfolio.id);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    setShowPublishDialog(false);
    try {
      await batchSave();
      await apiPatch<{ status: string }>(`/portfolios/${portfolio.id}`, {
        status: "PUBLISHED",
        accessPassword: publishPassword || undefined,
      });
      // Update local portfolio status so UI reflects the change immediately
      portfolioStore.setCurrentPortfolio({ ...portfolio, status: "PUBLISHED" as PortfolioStatus });
      builderStore.markSaved();
      setPublishSuccess(true);
      // Save a version snapshot on publish
      apiPost(`/portfolios/${portfolio.id}/versions`, { label: "Published" }).catch(() => {});
      // Auto-dismiss success after 4 seconds
      setTimeout(() => setPublishSuccess(false), 4000);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Failed to publish");
      setTimeout(() => setPublishError(null), 5000);
    } finally {
      setPublishing(false);
    }
  };

  const handleShareTemplate = async () => {
    setSharingTemplate(true);
    setShareError(null);
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
    } catch (e: unknown) {
      setShareError(e instanceof Error ? e.message : "Failed to share template");
    } finally {
      setSharingTemplate(false);
    }
  };

  const handleCommand = useCallback((commandId: string) => {
    switch (commandId) {
      case "save": handleSave(); break;
      case "publish": setShowPublishDialog(true); break;
      case "preview": setShowPreview(true); break;
      case "export-json": exportAsJson(); break;
      case "export-html": exportAsHtml(); break;
      case "version-history": setShowVersions(true); break;
      case "back-to-dashboard": router.push("/dashboard/portfolios"); break;
      case "undo": builderStore.undo(); break;
      case "redo": builderStore.redo(); break;
      case "toggle-left-panel": builderStore.toggleLeftPanel(); break;
      case "toggle-right-panel": builderStore.toggleRightPanel(); break;
      case "zoom-in": zoomIn(); break;
      case "zoom-out": zoomOut(); break;
      case "reset-zoom": resetZoom(); break;
      case "fit-to-screen": fitToScreen(); break;
      case "device-desktop": builderStore.setDevicePreview("desktop"); break;
      case "device-tablet": builderStore.setDevicePreview("tablet"); break;
      case "device-mobile": builderStore.setDevicePreview("mobile"); break;
      case "show-shortcuts": setShowShortcuts(true); break;
      case "open-docs": window.open("/docs", "_blank"); break;
      default:
        if (commandId.startsWith("add-")) {
          const blockType = commandId.replace("add-", "") as BlockType;
          if (selectedSectionId) {
            addBlock(selectedSectionId, blockType);
          }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSectionId]);

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
      if (next.has(id)) next.delete(id); else next.add(id);
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
          tabletStyles: b.tabletStyles ?? {},
          mobileStyles: b.mobileStyles ?? {},
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

  // ── Export as .folio file ──────────────────────────────────────
  const exportAsFolio = useCallback(() => {
    const sectionCount = portfolio.sections.length;
    const blockCount = portfolio.sections.reduce((sum, s) => sum + s.blocks.length, 0);
    const folioData = {
      _format: "foliocraft",
      _version: 1,
      _description: `Foliocraft portfolio: ${portfolio.title}`,
      exportedAt: new Date().toISOString(),
      meta: {
        title: portfolio.title,
        author: portfolio.user?.name ?? portfolio.user?.username ?? "Unknown",
        sections: sectionCount,
        blocks: blockCount,
        theme: portfolio.theme?.mode ?? "dark",
        primaryColor: portfolio.theme?.primaryColor ?? "#6366f1",
      },
      portfolio: {
        title: portfolio.title,
        slug: portfolio.slug,
        description: portfolio.description,
        status: portfolio.status,
        theme: portfolio.theme,
        sections: portfolio.sections.map((s) => ({
          name: s.name,
          sortOrder: s.sortOrder,
          isVisible: s.isVisible,
          isLocked: s.isLocked,
          styles: s.styles,
          blocks: s.blocks.map((b) => ({
            type: b.type,
            content: b.content,
            styles: b.styles,
            tabletStyles: b.tabletStyles ?? {},
            mobileStyles: b.mobileStyles ?? {},
            sortOrder: b.sortOrder,
            isVisible: b.isVisible,
            isLocked: b.isLocked,
            parentId: b.parentId ?? null,
          })),
        })),
      },
    };
    const blob = new Blob([JSON.stringify(folioData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${portfolio.slug || "portfolio"}.folio`;
    a.click();
    URL.revokeObjectURL(url);
  }, [portfolio]);

  // ── Import .folio file ────────────────────────────────────────
  const importFolio = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".folio,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate format
        const folioPortfolio = data._format === "foliocraft" ? data.portfolio : data;
        if (!folioPortfolio?.sections || !Array.isArray(folioPortfolio.sections)) {
          alert("Invalid .folio file — no sections found.");
          return;
        }

        builderStore.pushSnapshot("import-folio");

        // Import theme if present
        if (folioPortfolio.theme && portfolio.theme) {
          const { id: _id, portfolioId: _pid, ...themeData } = folioPortfolio.theme;
          portfolioStore.updateTheme({ ...portfolio.theme, ...themeData });
        }

        // Clear existing sections and replace with imported ones
        // Remove all current sections
        for (const s of [...portfolio.sections]) {
          portfolioStore.removeSection(s.id);
        }

        // Add imported sections with new IDs
        for (const section of folioPortfolio.sections) {
          const sectionId = crypto.randomUUID();
          const newSection = {
            id: sectionId,
            portfolioId: portfolio.id,
            name: section.name ?? "Imported Section",
            sortOrder: section.sortOrder ?? 0,
            isVisible: section.isVisible ?? true,
            isLocked: section.isLocked ?? false,
            styles: section.styles ?? {},
            createdAt: new Date(),
            updatedAt: new Date(),
            blocks: (section.blocks ?? []).map((b: Record<string, unknown>, i: number) => ({
              id: crypto.randomUUID(),
              sectionId,
              type: b.type ?? "text",
              content: b.content ?? {},
              styles: b.styles ?? {},
              tabletStyles: b.tabletStyles ?? {},
              mobileStyles: b.mobileStyles ?? {},
              sortOrder: b.sortOrder ?? i,
              isVisible: b.isVisible ?? true,
              isLocked: b.isLocked ?? false,
              parentId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          };
          portfolioStore.addSection(newSection as unknown as import("@/types").SectionWithBlocks);
        }

        builderStore.setDirty(true);
        scheduleAutoSave();
        alert(`Imported ${folioPortfolio.sections.length} section(s) from "${file.name}"`);
      } catch {
        alert("Failed to import file. Make sure it's a valid .folio or JSON file.");
      }
    };
    input.click();
  }, [portfolio, portfolioStore, builderStore, scheduleAutoSave]);


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

      // Ctrl+K → Command palette
      if (mod && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
        return;
      }
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

      const singleId = selectedBlockIds.size === 1 ? [...selectedBlockIds][0]! : null;

      // Arrow keys → Move selected block
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && singleId && selectedSectionId) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const block = portfolio.sections
          .find((s) => s.id === selectedSectionId)
          ?.blocks.find((b) => b.id === singleId);
        if (!block) return;
        const device = builderStore.devicePreview;
        const ms = mergeDeviceStyles(block.styles, block.tabletStyles as Partial<BlockStyles>, block.mobileStyles as Partial<BlockStyles>, device);
        let nx = ms.x ?? 0;
        let ny = ms.y ?? 0;
        if (e.key === "ArrowUp") ny -= step;
        if (e.key === "ArrowDown") ny += step;
        if (e.key === "ArrowLeft") nx -= step;
        if (e.key === "ArrowRight") nx += step;
        if (device === "desktop") {
          portfolioStore.updateBlockInSection(selectedSectionId, singleId, {
            styles: { ...(block.styles as BlockStyles), x: nx, y: ny },
          });
        } else {
          const field = device === "tablet" ? "tabletStyles" : "mobileStyles";
          const existing = (block[field] ?? {}) as Partial<BlockStyles>;
          portfolioStore.updateBlockInSection(selectedSectionId, singleId, {
            [field]: { ...existing, x: nx, y: ny },
          });
        }
        builderStore.setDirty(true);
        scheduleAutoSave();
        return;
      }

      // Delete / Backspace → Delete selected block
      if ((e.key === "Delete" || e.key === "Backspace") && singleId && selectedSectionId) {
        // Don't delete if user is typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        deleteBlock(singleId, selectedSectionId);
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

      // Ctrl+Alt+C → Copy styles
      if (mod && e.altKey && e.key === "c" && singleId) {
        e.preventDefault();
        const block = portfolio.sections.flatMap(s => s.blocks).find(b => b.id === singleId);
        if (block) {
          const { x: _x, y: _y, w: _w, h: _h, ...visualStyles } = block.styles as Record<string, unknown>;
          builderStore.copyStyles(structuredClone(visualStyles));
        }
        return;
      }
      // Ctrl+Alt+V → Paste styles
      if (mod && e.altKey && e.key === "v" && singleId && builderStore.styleClipboard && selectedSectionId) {
        e.preventDefault();
        builderStore.pushSnapshot("paste-styles");
        const block = portfolio.sections.flatMap(s => s.blocks).find(b => b.id === singleId);
        if (block) {
          const currentStyles = block.styles as BlockStyles;
          const merged = { ...currentStyles, ...builderStore.styleClipboard, x: currentStyles.x, y: currentStyles.y, w: currentStyles.w, h: currentStyles.h };
          portfolioStore.updateBlockInSection(selectedSectionId, singleId, { styles: merged } as Partial<BlockWithStyles>);
          builderStore.setDirty(true);
          scheduleAutoSave();
        }
        return;
      }
      // Ctrl+C → Copy block
      if (mod && e.key === "c" && singleId) {
        e.preventDefault();
        const block = portfolio.sections.flatMap(s => s.blocks).find(b => b.id === singleId);
        if (block) {
          builderStore.copyBlock({
            type: block.type,
            content: structuredClone(block.content as Record<string, unknown>),
            styles: structuredClone(block.styles as Record<string, unknown>),
            tabletStyles: structuredClone((block.tabletStyles ?? {}) as Record<string, unknown>),
            mobileStyles: structuredClone((block.mobileStyles ?? {}) as Record<string, unknown>),
          });
        }
        return;
      }
      // Ctrl+V → Paste block with copied content & styles (local-first)
      if (mod && e.key === "v" && builderStore.clipboard && selectedSectionId) {
        e.preventDefault();
        const clip = builderStore.clipboard;
        const section = portfolio.sections.find(s => s.id === selectedSectionId);
        const existingBlocks = section?.blocks ?? [];
        const maxY = existingBlocks.reduce((max, b) => Math.max(max, (b.styles.y ?? 0) + (b.styles.h ?? 50)), 20);
        const pastedBlock = {
          id: crypto.randomUUID(),
          sectionId: selectedSectionId,
          type: clip.type,
          sortOrder: existingBlocks.length,
          isVisible: true,
          isLocked: false,
          content: structuredClone(clip.content),
          styles: { ...clip.styles, x: ((clip.styles.x as number) ?? 40) + 20, y: maxY + 16 },
          tabletStyles: structuredClone(clip.tabletStyles),
          mobileStyles: structuredClone(clip.mobileStyles),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as BlockWithStyles;
        builderStore.pushSnapshot("paste-block");
        portfolioStore.addBlockToSection(selectedSectionId, pastedBlock);
        setSelectedBlockIds(new Set([pastedBlock.id]));
        setRightPanel("properties");
        builderStore.setDirty(true);
        scheduleAutoSave();
        return;
      }

      // Ctrl+Shift+G → Ungroup (check before Ctrl+G)
      if (mod && e.key === "g" && e.shiftKey) {
        e.preventDefault();
        ungroupBlock();
        return;
      }
      // Ctrl+G → Group selected blocks
      if (mod && e.key === "g" && !e.shiftKey) {
        e.preventDefault();
        groupSelectedBlocks();
        return;
      }

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
        builderStore.toggleLeftPanel();
        return;
      }
      // Ctrl+/  → Toggle right panel
      if (mod && e.key === "/") {
        e.preventDefault();
        builderStore.toggleRightPanel();
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

  const canvasFrames = useMemo(
    () =>
      visibleSections.map((section) => {
        const ss = section.styles as SectionStyles;
        return {
          id: section.id,
          x: ss.frameX ?? 0,
          y:
            ss.frameY ??
            portfolio.sections.indexOf(section) * (DEFAULT_FRAME_HEIGHT + 80),
          w: previewWidth ?? ss.frameWidth ?? DEFAULT_FRAME_WIDTH,
          h: ss.frameHeight ?? DEFAULT_FRAME_HEIGHT,
        };
      }),
    [visibleSections, portfolio.sections, previewWidth],
  );

  const selectedFrameId =
    selectedSectionId && selectedBlockIds.size === 0 ? selectedSectionId : null;

  return (
    <>
    {/* Mobile warning — editor requires desktop */}
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center lg:hidden">
      <Monitor className="h-12 w-12 text-muted-foreground/40" />
      <h2 className="text-lg font-bold text-foreground">Desktop Required</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        The studio editor works best on desktop screens (1024px+). Please switch to a larger screen to edit your portfolio.
      </p>
      <Link href="/dashboard/portfolios" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        Back to Dashboard
      </Link>
    </div>
    <div
      className="hidden h-screen flex-col lg:flex"
      style={{ backgroundColor: "var(--b-bg)" }}
      data-builder-theme={studioTheme}
    >
      {/* ── Crash Recovery Banner ──────────────────────────────────── */}
      {showRecoveryBanner && (
        <div
          className="relative z-30 flex items-center justify-between px-4 py-2.5 text-[12px]"
          style={{ backgroundColor: "#f59e0b20", borderBottom: "1px solid #f59e0b40", color: "#fbbf24" }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Unsaved changes recovered from your last session.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (recoveryDataRef.current) {
                  builderStore.pushSnapshot("crash-recovery");
                  portfolioStore.replacePortfolio(recoveryDataRef.current);
                  builderStore.setDirty(true);
                  scheduleAutoSave();
                }
                setShowRecoveryBanner(false);
                recoveryDataRef.current = null;
              }}
              className="rounded-md px-3 py-1 text-[11px] font-semibold transition-colors"
              style={{ backgroundColor: "#f59e0b", color: "#000" }}
            >
              Restore
            </button>
            <button
              onClick={() => {
                clearBackup(portfolio.id);
                setShowRecoveryBanner(false);
                recoveryDataRef.current = null;
              }}
              className="rounded-md px-3 py-1 text-[11px] font-medium transition-colors hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── TOP TOOLBAR ──────────────────────────────────────────── */}
      <div
        data-tour="top-bar"
        className="builder-toolbar relative z-20 flex h-12 items-center justify-between px-3"
        style={{ borderBottom: "1px solid var(--b-border)" }}
      >
        {/* Left: Back + File + View */}
        <div className="flex items-center gap-1">
          <Link href="/dashboard/portfolios" className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors" style={{ color: "var(--b-text-3)" }}>
            <ArrowLeft className="h-3.5 w-3.5" />
            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "linear-gradient(135deg, var(--b-accent), #0891b2)" }}>
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </Link>

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
                onClick={exportAsFolio}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <FolderDown className="h-3.5 w-3.5" />
                Save as .folio
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={importFolio}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <FolderUp className="h-3.5 w-3.5" />
                Import .folio
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
              <DropdownMenuItem
                onClick={() => setShowVersions(true)}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Clock className="h-3.5 w-3.5" />
                Version History
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
                onClick={() => setShowPublishDialog(true)}
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
              <DropdownMenuCheckboxItem
                checked={builderStore.showGrid}
                onCheckedChange={(v) => builderStore.setShowGrid(!!v)}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Show Grid
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={builderStore.showRulers}
                onCheckedChange={(v) => builderStore.setShowRulers(!!v)}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Show Rulers
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={builderStore.snapToGrid}
                onCheckedChange={(v) => builderStore.setSnapToGrid(!!v)}
                className="text-[12px]"
                style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Snap to Grid
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
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
          <div className="flex items-center gap-2 px-4">
            <span
              className="max-w-[200px] truncate text-[13px] font-semibold"
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

        {/* Right: Theme + Save + Publish */}
        <div className="flex items-center gap-2">
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
            onClick={toggleStudioTheme}
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
            onClick={() => { setRightPanel("seo"); setSelectedBlockIds(new Set()); }}
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
            onClick={() => setShowPublishDialog(true)}
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

          <div className="mx-1 h-4 w-px" style={{ backgroundColor: "var(--b-border)" }} />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors" style={{ color: "var(--b-text-2)" }}>
                {sessionData?.user?.image ? (
                  <img src={sessionData.user.image} alt="" loading="lazy" decoding="async" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text-3)" }}>
                    {getInitials(sessionData?.user?.name)}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} style={{ backgroundColor: dropdownColors.bg, borderColor: dropdownColors.border, minWidth: 180 }}>
              <div className="px-3 py-2" style={{ borderBottom: `1px solid ${dropdownColors.separator}` }}>
                <p className="text-[12px] font-semibold" style={{ color: dropdownColors.text }}>{sessionData?.user?.name ?? "User"}</p>
                <p className="text-[10px]" style={{ color: dropdownColors.textMuted }}>{sessionData?.user?.email}</p>
              </div>
              <DropdownMenuItem asChild className="text-[12px]" style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                <Link href="/dashboard"><LayoutGrid className="mr-2 h-3.5 w-3.5" />Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-[12px]" style={{ color: dropdownColors.textMuted, backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                <Link href="/dashboard/settings"><Settings className="mr-2 h-3.5 w-3.5" />Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: dropdownColors.separator }} />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-[12px]" style={{ color: "#ef4444", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dropdownColors.hover; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                <LogOut className="mr-2 h-3.5 w-3.5" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* ── PAGE SWITCHER BAR ────────────────────────────────────── */}
      {(
        <div
          className="flex flex-shrink-0 items-center gap-1 overflow-x-auto px-3 py-1.5 scrollbar-thin"
          style={{ borderBottom: "1px solid var(--b-border)", backgroundColor: "var(--b-panel)" }}
        >
          <button
            onClick={() => setCurrentPageId(null)}
            className="flex-shrink-0 rounded-md px-3 py-1 text-[11px] font-semibold transition-colors"
            style={{
              backgroundColor: !currentPageId ? "var(--b-accent-soft)" : "transparent",
              color: !currentPageId ? "var(--b-accent)" : "var(--b-text-4)",
            }}
          >
            Home
          </button>
          {(portfolio.pages ?? []).filter(p => !p.isDefault).map((page) => (
            <button
              key={page.id}
              onClick={() => setCurrentPageId(page.id)}
              onDoubleClick={() => setPageDialog({ mode: "rename", pageId: page.id, value: page.title })}
              onContextMenu={(e) => {
                e.preventDefault();
                setPageDialog({ mode: "delete", pageId: page.id });
              }}
              className="flex-shrink-0 rounded-md px-3 py-1 text-[11px] font-semibold transition-colors"
              style={{
                backgroundColor: currentPageId === page.id ? "var(--b-accent-soft)" : "transparent",
                color: currentPageId === page.id ? "var(--b-accent)" : "var(--b-text-4)",
              }}
              title={`Right-click for options`}
            >
              {page.title}
            </button>
          ))}
          <button
            onClick={() => setPageDialog({ mode: "add", value: "" })}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors"
            style={{ color: "var(--b-text-4)" }}
            title="Add page"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Layers / Elements Panel ────────────────────────── */}
        {showLeftPanel && (
        <div
          data-tour="left-panel"
          className="builder-panel flex w-60 flex-shrink-0 flex-col"
          style={{
            backgroundColor: "var(--b-panel)",
            borderRight: "1px solid var(--b-border)",
          }}
        >
          {/* Tab bar */}
          <div
            className="flex flex-shrink-0 px-2 pt-2 pb-0"
            style={{ borderBottom: "1px solid var(--b-border)" }}
          >
            {([
              { id: "layers" as const, label: "Layers" },
              { id: "elements" as const, label: "Elements" },
              { id: "shapes" as const, label: "Shapes" },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLeftTab(tab.id)}
                className="relative flex-1 pb-2 text-center text-[10px] font-semibold tracking-wide transition-colors duration-150"
                style={{
                  color: leftTab === tab.id ? "var(--b-text)" : "var(--b-text-4)",
                }}
              >
                {tab.label}
                {leftTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full"
                    style={{ backgroundColor: "var(--b-accent)" }}
                  />
                )}
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
                    onClick={() => setShowFrameTemplateDialog(true)}
                    className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
                    style={{ color: "var(--b-text-3)" }}
                    title="Add frame"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { setRightPanel("theme"); setSelectedBlockIds(new Set()); }}
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
                      const isSectionSelected = selectedSectionId === section.id && selectedBlockIds.size === 0;
                      const blockCount = section.blocks.length;
                      const sortedBlocks = [...section.blocks]
                        .filter((b) => !b.parentId)
                        .sort((a, b) => a.sortOrder - b.sortOrder);

                      return (
                        <SortableItem id={section.id} key={section.id}>
                          {({ style, ref, listeners, attributes }) => (
                            <div ref={ref} style={style} className="group/sec">
                              {/* Section (frame) row */}
                              <div
                                className="builder-layer-item flex cursor-pointer items-center gap-1 px-2 py-[6px] transition-colors duration-100"
                                style={{
                                  backgroundColor: isSectionSelected ? "var(--b-accent-soft)" : "transparent",
                                  color: isSectionSelected ? "var(--b-accent)" : "var(--b-text-2)",
                                  borderLeft: isSectionSelected ? "2px solid var(--b-accent)" : "2px solid transparent",
                                }}
                                onClick={() => selectSection(section.id)}
                              >
                                <span className="flex h-4 w-4 flex-shrink-0 cursor-grab items-center justify-center opacity-0 transition-opacity group-hover/sec:opacity-30" {...listeners} {...attributes}>
                                  <GripVertical className="h-2.5 w-2.5" style={{ color: "var(--b-text-4)" }} />
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
                                  style={{ color: "var(--b-text-4)" }}
                                >
                                  <ChevronRight
                                    className="h-2.5 w-2.5 transition-transform duration-150"
                                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0)" }}
                                  />
                                </button>
                                <span
                                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
                                  style={{
                                    backgroundColor: isSectionSelected ? "var(--b-accent-mid)" : "var(--b-surface)",
                                    border: `1px solid ${isSectionSelected ? "var(--b-accent)" : "var(--b-border)"}`,
                                  }}
                                >
                                  <Layout className="h-3 w-3" style={{ color: isSectionSelected ? "var(--b-accent)" : "var(--b-text-4)" }} />
                                </span>
                                <span className="flex-1 truncate text-[10.5px] font-semibold">{section.name}</span>
                                <span
                                  className="flex h-4 min-w-[16px] flex-shrink-0 items-center justify-center rounded-full px-1 text-[8px] font-bold"
                                  style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text-4)" }}
                                >
                                  {blockCount}
                                </span>
                                {!section.isVisible && (
                                  <EyeOff className="h-2.5 w-2.5 flex-shrink-0" style={{ color: "var(--b-text-4)" }} />
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover/sec:opacity-40 hover:!opacity-100"
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
                                      {sortedBlocks.map((block) => {
                                        const groupChildren = block.type === "group"
                                          ? section.blocks.filter((c) => c.parentId === block.id)
                                          : undefined;
                                        return (
                                          <SortableItem id={block.id} key={block.id}>
                                            {({ style: blockStyle, ref: blockRef, listeners: blockListeners, attributes: blockAttributes }) => (
                                              <div ref={blockRef} style={blockStyle}>
                                                <LayerBlockItem
                                                  block={block}
                                                  isSelected={selectedBlockIds.has(block.id)}
                                                  onSelect={() => selectBlock(block.id, false)}
                                                  onDelete={() => deleteBlock(block.id, section.id)}
                                                  dragHandleProps={{ ...blockListeners, ...blockAttributes }}
                                                  groupChildren={groupChildren}
                                                  isExpanded={expandedGroups.has(block.id)}
                                                  onToggleExpand={() => setExpandedGroups((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(block.id)) next.delete(block.id);
                                                    else next.add(block.id);
                                                    return next;
                                                  })}
                                                  isChildSelected={(id) => selectedBlockIds.has(id)}
                                                  onChildSelect={(id) => selectBlock(id, false)}
                                                  onChildDelete={(id) => deleteBlock(id, section.id)}
                                                />
                                              </div>
                                            )}
                                          </SortableItem>
                                        );
                                      })}
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
              {portfolio.sections.length === 0 && (
                <div
                  className="mx-2.5 mt-2.5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: "var(--b-accent-soft)",
                    color: "var(--b-accent)",
                    border: "1px solid var(--b-accent-mid)",
                  }}
                >
                  <MousePointer2 className="h-3.5 w-3.5 flex-shrink-0" />
                  Create a frame first to add elements
                </div>
              )}

              {/* Elements list */}
              <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
                {BLOCK_CATEGORIES.map((cat) => {
                  const blocks = getBlocksByCategory(cat.id);
                  if (blocks.length === 0) return null;
                  return (
                    <div key={cat.id} className="mb-3">
                      <p
                        className="mb-1.5 flex items-center gap-1.5 px-1.5 text-[8px] font-extrabold uppercase tracking-[0.15em]"
                        style={{ color: "var(--b-text-4)", opacity: 0.7 }}
                      >
                        {cat.label}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {blocks.map((def) => (
                          <button
                            key={def.type}
                            onClick={() => {
                              const targetSection = selectedSectionId ?? portfolio.sections[0]?.id;
                              if (targetSection) {
                                setSelectedSectionId(targetSection);
                                addBlock(targetSection, def.type);
                              }
                            }}
                            disabled={portfolio.sections.length === 0}
                            className="group flex flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-center transition-all duration-150 disabled:opacity-20"
                            style={{
                              backgroundColor: "transparent",
                              border: "1px solid transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "var(--b-accent-mid)";
                              e.currentTarget.style.backgroundColor = "var(--b-accent-soft)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "transparent";
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150"
                              style={{ backgroundColor: "var(--b-surface)", border: "1px solid var(--b-border)" }}
                            >
                              <span style={{ color: "var(--b-text-3)", fontSize: 13 }}>
                                {def.label.charAt(0)}
                              </span>
                            </div>
                            <span
                              className="w-full truncate text-[9px] font-medium leading-tight"
                              style={{ color: "var(--b-text-3)" }}
                            >
                              {def.label}
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

          {/* ── Shapes Tab ─────────────────────────────────────── */}
          {leftTab === "shapes" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {portfolio.sections.length === 0 && (
                <div
                  className="mx-2 mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: "var(--b-accent-soft)",
                    color: "var(--b-accent)",
                    border: "1px solid var(--b-accent-mid)",
                  }}
                >
                  <MousePointer2 className="h-3.5 w-3.5 flex-shrink-0" />
                  Create a frame first to add shapes
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
                {SHAPE_CATEGORIES.map((cat) => {
                  const shapes = getShapesByCategory(cat.id);
                  return (
                    <div key={cat.id} className="mb-3">
                      <p
                        className="mb-1.5 flex items-center gap-1.5 px-1.5 text-[8px] font-extrabold uppercase tracking-[0.15em]"
                        style={{ color: "var(--b-text-4)", opacity: 0.7 }}
                      >
                        {cat.label}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {shapes.map((shape) => (
                          <button
                            key={shape.id}
                            onClick={() => {
                              const targetSection = selectedSectionId ?? portfolio.sections[0]?.id;
                              if (!targetSection) return;
                              setSelectedSectionId(targetSection);
                              const section = portfolio.sections.find((s) => s.id === targetSection);
                              if (!section) return;
                              const sectionSt = section.styles as SectionStyles;
                              const fw = sectionSt.frameWidth ?? DEFAULT_FRAME_WIDTH;
                              const fh = sectionSt.frameHeight ?? DEFAULT_FRAME_HEIGHT;
                              const w = shape.category === "dividers" ? fw : Math.min(shape.defaultWidth, 400);
                              const h = shape.category === "dividers" ? shape.defaultHeight : Math.min(shape.defaultHeight, 400);
                              const x = shape.category === "dividers" ? 0 : Math.round((fw - w) / 2);
                              const y = shape.category === "dividers" ? fh - h : Math.round((fh - h) / 2);
                              addBlock(targetSection, "shape" as BlockType, {
                                content: { svgId: shape.id, color: "primary" },
                                styles: { x, y, w, h },
                              });
                            }}
                            disabled={portfolio.sections.length === 0}
                            className="group flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all duration-200 disabled:opacity-20"
                            style={{
                              backgroundColor: "var(--b-surface)",
                              border: "1px solid var(--b-border)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "var(--b-accent-mid)";
                              e.currentTarget.style.backgroundColor = "var(--b-accent-soft)";
                              const svgEl = e.currentTarget.querySelector(".shape-preview");
                              if (svgEl) (svgEl as HTMLElement).style.color = "var(--b-accent)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--b-border)";
                              e.currentTarget.style.backgroundColor = "var(--b-surface)";
                              const svgEl = e.currentTarget.querySelector(".shape-preview");
                              if (svgEl) (svgEl as HTMLElement).style.color = "var(--b-text-3)";
                            }}
                          >
                            <div
                              className="shape-preview flex h-14 w-full items-center justify-center overflow-hidden rounded-md transition-colors duration-200"
                              style={{ color: "var(--b-text-3)", backgroundColor: "var(--b-bg)", padding: shape.category === "dividers" ? "0 4px" : "4px" }}
                              dangerouslySetInnerHTML={{ __html: shape.svg }}
                            />
                            <span
                              className="w-full truncate text-center text-[8.5px] font-semibold"
                              style={{ color: "var(--b-text-4)" }}
                            >
                              {shape.name}
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
          data-tour="canvas"
          ref={drawContainerRef}
          className="relative flex-1 overflow-hidden"
          style={{ cursor: drawMode ? "crosshair" : undefined }}
          onPointerDown={drawMode ? handleDrawMouseDown : undefined}
          onPointerMove={drawMode && drawStart ? handleDrawMouseMove : undefined}
          onPointerUp={drawMode && drawStart ? handleDrawMouseUp : undefined}
        >
          {/* Rulers */}
          {builderStore.showRulers && (
            <>
              <RulerCorner />
              <HorizontalRuler transform={transform} width={drawContainerRef.current?.clientWidth ?? 1200} />
              <VerticalRuler transform={transform} height={drawContainerRef.current?.clientHeight ?? 800} />
            </>
          )}

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
            showGrid={builderStore.showGrid}
            onMarqueeEnd={drawMode ? undefined : handleMarqueeEnd}
            frames={drawMode ? undefined : canvasFrames}
            selectedFrameId={drawMode ? null : selectedFrameId}
            onFrameMove={drawMode ? undefined : moveFrame}
            onFrameDragEnd={drawMode ? undefined : handleBlockDragOrResizeEnd}
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

                // Resolve pattern for canvas frame
                const resolvePatternColor = (v: string): string => {
                  const map: Record<string, string> = {
                    primary: theme.primaryColor, secondary: theme.secondaryColor,
                    accent: theme.accentColor, text: theme.textColor,
                    muted: theme.mutedColor, surface: theme.surfaceColor,
                  };
                  return map[v] ?? v;
                };
                const framePatternStyle = ss.pattern && ss.pattern.id !== "none"
                  ? generatePatternStyles(ss.pattern.id, resolvePatternColor(ss.pattern.color), ss.pattern.opacity, ss.pattern.scale)
                  : undefined;

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
                    patternStyle={framePatternStyle}
                    isSelected={
                      selectedSectionId === section.id && selectedBlockIds.size === 0
                    }
                    canvasScale={transform.scale}
                    onSelect={selectSection}
                    onResize={resizeFrame}
                    onResizeEnd={handleBlockDragOrResizeEnd}
                    onContextMenu={handleFrameContextMenu}
                  >
                    {[...section.blocks]
                      .filter((b) => b.isVisible && !b.parentId)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((block) => {
                        const ms = mergeDeviceStyles(block.styles, block.tabletStyles as Partial<BlockStyles>, block.mobileStyles as Partial<BlockStyles>, builderStore.devicePreview);
                        const mergedBlock = { ...block, styles: ms } as BlockWithStyles;
                        return (
                          <CanvasElement
                            key={block.id}
                            id={block.id}
                            x={ms.x ?? 40}
                            y={ms.y ?? 0}
                            w={ms.w ?? DEFAULT_BLOCK_W}
                            h={ms.h ?? 0}
                            rotation={ms.rotation}
                            isSelected={selectedBlockIds.has(block.id)}
                            isLocked={block.isLocked}
                            isHidden={!block.isVisible}
                            canvasScale={transform.scale}
                            onSelect={selectBlock}
                            onMove={moveBlock}
                            onResize={resizeBlock}
                            onDragStart={handleBlockDragStart}
                            onDragEnd={handleBlockDragOrResizeEnd}
                            sortOrder={block.sortOrder}
                            onContextMenu={handleBlockContextMenu}
                          >
                            <ErrorBoundary>
                              <BlockRenderer
                                block={mergedBlock}
                                theme={theme}
                                isEditing
                              />
                            </ErrorBoundary>
                            {block.type === "group" &&
                              section.blocks
                                .filter((c) => c.parentId === block.id && c.isVisible)
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((child) => {
                                  const cms = mergeDeviceStyles(child.styles, child.tabletStyles as Partial<BlockStyles>, child.mobileStyles as Partial<BlockStyles>, builderStore.devicePreview);
                                  const mergedChild = { ...child, styles: cms } as BlockWithStyles;
                                  return (
                                    <CanvasElement
                                      key={child.id}
                                      id={child.id}
                                      x={cms.x ?? 0}
                                      y={cms.y ?? 0}
                                      w={cms.w ?? DEFAULT_BLOCK_W}
                                      h={cms.h ?? 0}
                                      rotation={cms.rotation}
                                      isSelected={selectedBlockIds.has(child.id)}
                                      isLocked={child.isLocked}
                                      isHidden={!child.isVisible}
                                      canvasScale={transform.scale}
                                      onSelect={selectBlock}
                                      onMove={moveBlock}
                                      onResize={resizeBlock}
                                      onDragStart={handleBlockDragStart}
                                      onDragEnd={handleBlockDragOrResizeEnd}
                                      sortOrder={child.sortOrder}
                                      onContextMenu={handleBlockContextMenu}
                                    >
                                      <ErrorBoundary>
                                        <BlockRenderer
                                          block={mergedChild}
                                          theme={theme}
                                          isEditing
                                        />
                                      </ErrorBoundary>
                                    </CanvasElement>
                                  );
                                })}
                          </CanvasElement>
                        );
                      })}
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
                  onClick={() => setShowFrameTemplateDialog(true)}
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
                        setSelectedBlockIds(new Set([newBlock.id]));
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

              {/* SVG Import button */}
              <button
                onClick={() => setShowSvgImport(true)}
                className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition-all hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: dropdownColors.hover,
                  color: dropdownColors.text,
                }}
                title="Import SVG"
              >
                <FileImage className="h-3 w-3" />
                SVG
              </button>
            </div>
          )}

          {/* SVG Import Dialog */}
          <SvgImportDialog
            open={showSvgImport}
            onClose={() => setShowSvgImport(false)}
            onImport={({ svg, viewBox, width, height, filename }) => {
              if (!selectedSectionId) return;
              const w = Math.min(width, 600);
              const h = Math.min(height, 600);
              addBlock(selectedSectionId, "custom_svg" as BlockType, {
                content: { svg, originalFilename: filename, viewBox },
                styles: { w, h },
              });
            }}
          />

          {/* ── Context Menu ──────────────────────────────────────── */}
          {ctxMenu && (
            <>
              <div className="fixed inset-0 z-[200]" onClick={closeCtxMenu} onContextMenu={(e) => { e.preventDefault(); closeCtxMenu(); }} />
              <div
                className="fixed z-[201] min-w-[200px] overflow-hidden rounded-lg py-1"
                style={{
                  left: ctxMenu.x,
                  top: ctxMenu.y,
                  backgroundColor: dropdownColors.bg,
                  border: `1px solid ${dropdownColors.border}`,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                }}
              >
                {(() => {
                  const { sectionId: sid } = ctxMenu;
                  const sec = portfolio.sections.find((s) => s.id === sid);
                  const act = (fn: () => void) => () => { setCtxMenu(null); fn(); };

                  // ── Frame context menu ──
                  if (ctxMenu.type === "frame") {
                    const blockCount = sec?.blocks.length ?? 0;
                    const hasClipboard = !!builderStore.clipboard;
                    return [
                      { label: "Select Frame", action: act(() => { setSelectedSectionId(sid); setSelectedBlockIds(new Set()); }), icon: "◻" },
                      { label: "Select All Elements", action: act(() => { if (sec) { setSelectedSectionId(sid); setSelectedBlockIds(new Set(sec.blocks.filter((b) => !b.parentId).map((b) => b.id))); } }), icon: "⊞", shortcut: "Ctrl+A" },
                      { label: "---" },
                      ...(hasClipboard ? [{ label: "Paste", shortcut: "Ctrl+V", action: act(() => { const clip = builderStore.clipboard; if (!clip) return; const newBlock = { id: crypto.randomUUID(), sectionId: sid, type: clip.type, sortOrder: blockCount, isVisible: true, isLocked: false, content: structuredClone(clip.content), styles: { ...structuredClone(clip.styles), x: 60, y: 60 }, tabletStyles: structuredClone(clip.tabletStyles ?? {}), mobileStyles: structuredClone(clip.mobileStyles ?? {}), createdAt: new Date(), updatedAt: new Date() } as unknown as BlockWithStyles; builderStore.pushSnapshot("paste"); portfolioStore.addBlockToSection(sid, newBlock); setSelectedBlockIds(new Set([newBlock.id])); setSelectedSectionId(sid); builderStore.setDirty(true); scheduleAutoSave(); }), icon: "📋" }] : []),
                      { label: "---" },
                      { label: sec?.isVisible ? "Hide Frame" : "Show Frame", action: act(() => { if (sec) portfolioStore.updateSection(sid, { isVisible: !sec.isVisible }); builderStore.setDirty(true); scheduleAutoSave(); }), icon: sec?.isVisible ? "👁" : "🚫" },
                      { label: sec?.isLocked ? "Unlock Frame" : "Lock Frame", action: act(() => { if (sec) portfolioStore.updateSection(sid, { isLocked: !sec.isLocked }); builderStore.setDirty(true); scheduleAutoSave(); }), icon: sec?.isLocked ? "🔓" : "🔒" },
                      { label: "---" },
                      { label: "Rename Frame", action: act(() => { const name = prompt("Frame name:", sec?.name); if (name && sec) { portfolioStore.updateSection(sid, { name }); builderStore.setDirty(true); scheduleAutoSave(); } }), icon: "✏" },
                      { label: "---" },
                      { label: "Delete Frame", action: act(() => deleteSection(sid)), danger: true, icon: "🗑" },
                    ] as Array<{ label: string; shortcut?: string; action?: () => void; icon?: string; danger?: boolean }>;
                  }

                  // ── Block context menu ──
                  const bid = ctxMenu.blockId!;
                  const blk = sec?.blocks.find((b) => b.id === bid);
                  const maxOrd = sec ? Math.max(...sec.blocks.map((b) => b.sortOrder), 0) : 0;
                  const minOrd = sec ? Math.min(...sec.blocks.map((b) => b.sortOrder), 0) : 0;
                  const reorder = (order: number) => act(() => { portfolioStore.updateBlockInSection(sid, bid, { sortOrder: order } as Partial<BlockWithStyles>); builderStore.setDirty(true); });
                  const doCopy = () => { if (blk) builderStore.copyBlock({ type: blk.type, content: structuredClone(blk.content as Record<string, unknown>), styles: structuredClone(blk.styles as Record<string, unknown>), tabletStyles: structuredClone((blk.tabletStyles ?? {}) as Record<string, unknown>), mobileStyles: structuredClone((blk.mobileStyles ?? {}) as Record<string, unknown>) }); };

                  return [
                    { label: "Cut", shortcut: "Ctrl+X", action: act(() => { doCopy(); deleteBlock(bid, sid); }), icon: "✂" },
                    { label: "Copy", shortcut: "Ctrl+C", action: act(() => doCopy()), icon: "📋" },
                    { label: "Copy Styles", shortcut: "Ctrl+Alt+C", action: act(() => { if (blk) { const { x: _x, y: _y, w: _w, h: _h, ...vs } = blk.styles as Record<string, unknown>; builderStore.copyStyles(structuredClone(vs)); } }), icon: "🎨" },
                    ...(builderStore.styleClipboard ? [{ label: "Paste Styles", shortcut: "Ctrl+Alt+V", action: act(() => { if (blk) { builderStore.pushSnapshot("paste-styles"); const cs = blk.styles as BlockStyles; portfolioStore.updateBlockInSection(sid, bid, { styles: { ...cs, ...builderStore.styleClipboard, x: cs.x, y: cs.y, w: cs.w, h: cs.h } } as Partial<BlockWithStyles>); builderStore.setDirty(true); scheduleAutoSave(); } }), icon: "🎨" }] : []),
                    { label: "Duplicate", shortcut: "Ctrl+D", action: act(() => { if (blk) duplicateBlock(blk, sid); }), icon: "⧉" },
                    { label: "---" },
                    { label: "Bring to Front", shortcut: "]", action: reorder(maxOrd + 1), icon: "⇈" },
                    { label: "Bring Forward", shortcut: "↑", action: reorder((blk?.sortOrder ?? 0) + 1), icon: "↑" },
                    { label: "Send Backward", shortcut: "↓", action: reorder(Math.max(0, (blk?.sortOrder ?? 0) - 1)), icon: "↓" },
                    { label: "Send to Back", shortcut: "[", action: reorder(minOrd - 1), icon: "⇊" },
                    { label: "---" },
                    ...(selectedBlockIds.size >= 2 ? [{ label: "Group Selection", shortcut: "Ctrl+G", action: act(() => groupSelectedBlocks()), icon: "⊞" }] : []),
                    ...(blk?.type === "group" ? [{ label: "Ungroup", shortcut: "Ctrl+Shift+G", action: act(() => ungroupBlock()), icon: "⊟" }] : []),
                    ...((selectedBlockIds.size >= 2 || blk?.type === "group") ? [{ label: "---" }] : []),
                    { label: blk?.isLocked ? "Unlock" : "Lock", shortcut: blk?.isLocked ? "" : "", action: act(() => { portfolioStore.updateBlockInSection(sid, bid, { isLocked: !blk?.isLocked }); builderStore.setDirty(true); }), icon: blk?.isLocked ? "🔓" : "🔒" },
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
          {showMinimap && portfolio.sections.length > 0 && selectedSectionId && (() => {
            const selIdx = portfolio.sections.findIndex((s) => s.id === selectedSectionId);
            const sel = portfolio.sections[selIdx];
            if (!sel) return null;

            const ss = sel.styles as SectionStyles;
            const fx = ss.frameX ?? 0;
            const fy = ss.frameY ?? selIdx * (DEFAULT_FRAME_HEIGHT + 80);
            const fw = ss.frameWidth ?? DEFAULT_FRAME_WIDTH;
            const fh = ss.frameHeight ?? DEFAULT_FRAME_HEIGHT;
            const minX = fx;
            const minY = fy;
            const pad = 30;
            const worldW = fw + pad * 2;
            const worldH = fh + pad * 2;
            const mapW = 200;
            const mapH = Math.min(130, (worldH / worldW) * mapW);
            const scaleM = mapW / worldW;

            const vpLeft = -transform.x / transform.scale;
            const vpTop = -transform.y / transform.scale;
            const vpW = 900 / transform.scale;
            const vpH = 600 / transform.scale;

            const visibleBlocks = [...sel.blocks].filter((b) => b.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);

            return (
              <div
                className="absolute bottom-3 right-3 z-30 flex flex-col overflow-hidden rounded-xl"
                style={{
                  width: mapW,
                  backgroundColor: "var(--b-panel)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "var(--b-border-active)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03) inset",
                }}
              >
                {/* Content area */}
                <div
                  className="relative cursor-crosshair"
                  style={{ height: mapH }}
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
                  {/* Rendered frame content */}
                  <div
                    className="absolute overflow-hidden"
                    style={{
                      left: pad * scaleM,
                      top: pad * scaleM,
                      width: fw * scaleM,
                      height: fh * scaleM,
                      backgroundColor: "var(--b-surface)",
                      borderRadius: 3,
                    }}
                  >
                    <div
                      className="pointer-events-none absolute left-0 top-0 origin-top-left"
                      style={{ width: fw, height: fh, transform: `scale(${scaleM})` }}
                    >
                      {visibleBlocks.map((block) => {
                        const bs = block.styles as BlockStyles;
                        const isSelectedBlock = selectedBlockIds.has(block.id);
                        return (
                          <div
                            key={block.id}
                            className="absolute"
                            style={{
                              left: bs.x ?? 0,
                              top: bs.y ?? 0,
                              width: bs.w ?? 200,
                              height: bs.h === 0 ? "auto" : (bs.h ?? "auto"),
                            }}
                          >
                            <ErrorBoundary>
                              <BlockRenderer block={block} theme={theme} isEditing />
                            </ErrorBoundary>
                            {/* Selected block highlight */}
                            {isSelectedBlock && (
                              <div
                                className="absolute inset-0"
                                style={{
                                  outline: `${2 / scaleM}px solid var(--b-accent)`,
                                  outlineOffset: `${1 / scaleM}px`,
                                  borderRadius: 2,
                                  boxShadow: `0 0 ${8 / scaleM}px var(--b-accent)`,
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Viewport indicator */}
                  <div
                    className="absolute transition-all duration-100"
                    style={{
                      left: (vpLeft - minX + pad) * scaleM,
                      top: (vpTop - minY + pad) * scaleM,
                      width: vpW * scaleM,
                      height: vpH * scaleM,
                      borderWidth: 1.5,
                      borderStyle: "solid",
                      borderColor: "var(--b-accent)",
                      borderRadius: 3,
                      backgroundColor: "rgba(20,184,166,0.06)",
                      boxShadow: "0 0 0 1px rgba(20,184,166,0.15)",
                    }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Zoom controls — bottom left */}
          <div className="absolute bottom-3 left-3 z-30">
            <ZoomControls
              transform={transform}
              onTransformChange={setTransform}
              onFitToScreen={fitToScreen}
            />
          </div>

        </div>

        {/* ── RIGHT: Properties Panel ────────────────────────────── */}
        {showRightPanel && (
        <div
          data-tour="right-panel"
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
          ) : selectedBlockIds.size > 1 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ color: "var(--b-text-3)" }}>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--b-surface)", border: "1px solid var(--b-border)" }}
              >
                <MousePointer2 className="h-5 w-5" style={{ color: "var(--b-accent)" }} />
              </div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--b-text-2)" }}>
                {selectedBlockIds.size} blocks selected
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--b-text-4)" }}>
                Drag any selected block to move them all together. Click a single block to edit its properties.
              </p>
              <button
                className="mt-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
                style={{ backgroundColor: "var(--b-surface)", border: "1px solid var(--b-border)", color: "var(--b-text-3)" }}
                onClick={() => setSelectedBlockIds(new Set())}
              >
                Clear selection
              </button>
            </div>
          ) : selectedBlock && selectedSectionId ? (
            <BlockPropertiesPanel
              block={{
                ...selectedBlock,
                styles: mergeDeviceStyles(selectedBlock.styles, selectedBlock.tabletStyles as Partial<BlockStyles>, selectedBlock.mobileStyles as Partial<BlockStyles>, builderStore.devicePreview),
              } as BlockWithStyles}
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => exportFrameAsPng(selectedSectionId, sec.name)}
                        className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-white/10"
                        style={{ color: "var(--b-text-3)" }}
                        title="Export frame as PNG"
                      >
                        <ImageDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteSection(selectedSectionId)}
                        className="flex h-6 w-6 items-center justify-center rounded-md"
                        style={{ color: "var(--b-danger)" }}
                        title="Delete frame"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
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
                      <AdvancedColorInput
                        value={
                          (ss as Record<string, unknown>).backgroundCustom
                            ? ((ss.backgroundColor as string) ?? "")
                            : theme.backgroundColor
                        }
                        onChange={(v) => updateSec({ backgroundColor: v, backgroundCustom: true } as Partial<SectionStyles>)}
                        placeholder={theme.backgroundColor}
                      />
                    </div>

                    {/* Background Pattern */}
                    <div style={{ borderBottom: "1px solid var(--b-border)" }} className="px-3 py-3">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--b-text-3)" }}>
                        Pattern
                      </span>
                      {/* Pattern grid */}
                      <div className="mb-2 grid grid-cols-4 gap-1">
                        {BACKGROUND_PATTERNS.map((p) => {
                          const isActive = (ss.pattern?.id ?? "none") === p.id;
                          const previewColor = theme.textColor;
                          const preview = p.id === "none" ? {} : p.generate(previewColor, 0.4, 0.5);
                          return (
                            <button
                              key={p.id}
                              title={p.name}
                              onClick={() => {
                                if (p.id === "none") {
                                  updateSec({ pattern: undefined } as Partial<SectionStyles>);
                                } else {
                                  updateSec({
                                    pattern: {
                                      id: p.id,
                                      color: ss.pattern?.color ?? "primary",
                                      opacity: ss.pattern?.opacity ?? 0.1,
                                      scale: ss.pattern?.scale ?? 1,
                                    },
                                  });
                                }
                              }}
                              className="relative flex h-8 items-center justify-center overflow-hidden rounded-md transition-all"
                              style={{
                                backgroundColor: "var(--b-surface)",
                                border: isActive ? "1.5px solid var(--b-accent)" : "1px solid var(--b-border)",
                                ...(p.id !== "none" ? {
                                  backgroundImage: (preview as Record<string, string>).backgroundImage,
                                  backgroundSize: (preview as Record<string, string>).backgroundSize,
                                  backgroundPosition: (preview as Record<string, string>).backgroundPosition,
                                } : {}),
                              }}
                            >
                              {p.id === "none" && (
                                <span className="text-[8px] font-bold" style={{ color: "var(--b-text-4)" }}>None</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {ss.pattern && ss.pattern.id !== "none" && (
                        <div className="space-y-2">
                          <div>
                            <span className="mb-1 block text-[9px] font-semibold uppercase" style={{ color: "var(--b-text-4)" }}>Color</span>
                            <AdvancedColorInput
                              value={ss.pattern.color ?? "primary"}
                              onChange={(v) => updateSec({ pattern: { ...ss.pattern!, color: v } })}
                              placeholder="primary"
                            />
                          </div>
                          <div>
                            <span className="mb-1 block text-[9px] font-semibold uppercase" style={{ color: "var(--b-text-4)" }}>Opacity</span>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={ss.pattern.opacity ?? 0.1}
                              onChange={(e) => updateSec({ pattern: { ...ss.pattern!, opacity: Number(e.target.value) } })}
                              className="w-full"
                            />
                            <span className="text-[9px] font-mono" style={{ color: "var(--b-text-4)" }}>{(ss.pattern.opacity ?? 0.1).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="mb-1 block text-[9px] font-semibold uppercase" style={{ color: "var(--b-text-4)" }}>Scale</span>
                            <input
                              type="range"
                              min={0.5}
                              max={3}
                              step={0.1}
                              value={ss.pattern.scale ?? 1}
                              onChange={(e) => updateSec({ pattern: { ...ss.pattern!, scale: Number(e.target.value) } })}
                              className="w-full"
                            />
                            <span className="text-[9px] font-mono" style={{ color: "var(--b-text-4)" }}>{(ss.pattern.scale ?? 1).toFixed(1)}x</span>
                          </div>
                        </div>
                      )}
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

                    {/* Counter Animation */}
                    <div style={{ borderTop: "1px solid var(--b-border)", padding: "12px" }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-semibold" style={{ color: "var(--b-text-2)" }}>Counter Animation</span>
                          <p className="mt-0.5 text-[9px]" style={{ color: "var(--b-text-4)" }}>Stat blocks count up from 0 on scroll</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={ss.counterAnimation ?? false}
                            onChange={(e) => {
                              if (!selectedSectionId) return;
                              builderStore.pushSnapshot("counter-toggle");
                              portfolioStore.updateSection(selectedSectionId, { styles: { ...ss, counterAnimation: e.target.checked } });
                              builderStore.setDirty(true);
                              scheduleAutoSave();
                            }}
                            className="peer sr-only"
                          />
                          <div className="peer h-4 w-7 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:bg-teal-500 peer-checked:after:translate-x-full" />
                        </label>
                      </div>
                    </div>

                    {/* Stagger Animation */}
                    <div style={{ borderTop: "1px solid var(--b-border)", padding: "12px" }}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold" style={{ color: "var(--b-text-2)" }}>Stagger Children</span>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={ss.staggerChildren ?? false}
                            onChange={(e) => {
                              if (!selectedSectionId) return;
                              builderStore.pushSnapshot("stagger-toggle");
                              portfolioStore.updateSection(selectedSectionId, { styles: { ...ss, staggerChildren: e.target.checked } });
                              builderStore.setDirty(true);
                              scheduleAutoSave();
                            }}
                            className="peer sr-only"
                          />
                          <div className="peer h-4 w-7 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:bg-teal-500 peer-checked:after:translate-x-full" />
                        </label>
                      </div>
                      {ss.staggerChildren && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-14 text-[10px]" style={{ color: "var(--b-text-3)" }}>Animation</span>
                            <select
                              value={ss.staggerAnimation ?? "fade-up"}
                              onChange={(e) => {
                                if (!selectedSectionId) return;
                                portfolioStore.updateSection(selectedSectionId, { styles: { ...ss, staggerAnimation: e.target.value as SectionStyles["staggerAnimation"] } });
                                builderStore.setDirty(true);
                                scheduleAutoSave();
                              }}
                              className="h-6 flex-1 rounded border px-1 text-[10px] outline-none"
                              style={{ backgroundColor: "var(--b-input)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
                            >
                              <option value="fade-up">Fade Up</option>
                              <option value="fade-in">Fade In</option>
                              <option value="slide-left">Slide Left</option>
                              <option value="slide-right">Slide Right</option>
                              <option value="scale">Scale</option>
                              <option value="blur-in">Blur In</option>
                              <option value="bounce-in">Bounce In</option>
                              <option value="flip-x">Flip X</option>
                              <option value="flip-y">Flip Y</option>
                              <option value="rotate-in">Rotate In</option>
                              <option value="zoom-in">Zoom In</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-14 text-[10px]" style={{ color: "var(--b-text-3)" }}>Delay</span>
                            <input
                              type="number"
                              min={0}
                              max={1000}
                              step={10}
                              value={ss.staggerDelay ?? 100}
                              onChange={(e) => {
                                if (!selectedSectionId) return;
                                portfolioStore.updateSection(selectedSectionId, { styles: { ...ss, staggerDelay: Number(e.target.value) } });
                                builderStore.setDirty(true);
                                scheduleAutoSave();
                              }}
                              className="h-6 w-16 rounded border px-1.5 text-[10px] outline-none"
                              style={{ backgroundColor: "var(--b-input)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
                            />
                            <span className="text-[9px]" style={{ color: "var(--b-text-4)" }}>ms</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-14 text-[10px]" style={{ color: "var(--b-text-3)" }}>From</span>
                            <select
                              value={ss.staggerFrom ?? "start"}
                              onChange={(e) => {
                                if (!selectedSectionId) return;
                                portfolioStore.updateSection(selectedSectionId, { styles: { ...ss, staggerFrom: e.target.value as SectionStyles["staggerFrom"] } });
                                builderStore.setDirty(true);
                                scheduleAutoSave();
                              }}
                              className="h-6 rounded border px-1 text-[10px] outline-none"
                              style={{ backgroundColor: "var(--b-input)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
                            >
                              <option value="start">Start → End</option>
                              <option value="end">End → Start</option>
                              <option value="center">Center → Edges</option>
                              <option value="random">Random</option>
                            </select>
                          </div>
                          <p className="text-[9px]" style={{ color: "var(--b-text-4)" }}>
                            Blocks with entrance animations will play one-by-one
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Auto Layout */}
                    <div style={{ borderTop: "1px solid var(--b-border)", padding: "12px" }}>
                      <button
                        onClick={() => {
                          if (!selectedSectionId) return;
                          const section = portfolio.sections.find(s => s.id === selectedSectionId);
                          if (!section) return;

                          builderStore.pushSnapshot("auto-layout");

                          const sorted = [...section.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
                          const padding = 40;
                          const gap = 16;
                          let currentY = padding;

                          for (const block of sorted) {
                            const h = block.styles.h || 60;
                            portfolioStore.updateBlockInSection(selectedSectionId, block.id, {
                              styles: { ...(block.styles as BlockStyles), x: padding, y: currentY, w: (ss.frameWidth ? ss.frameWidth - padding * 2 : 1360) },
                            } as Partial<BlockWithStyles>);
                            currentY += h + gap;
                          }

                          builderStore.setDirty(true);
                          scheduleAutoSave();
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-[11px] font-semibold transition-colors"
                        style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text-2)", border: "1px solid var(--b-border)" }}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Auto Layout
                      </button>
                      <p className="mt-1.5 text-center text-[9px]" style={{ color: "var(--b-text-4)" }}>
                        Stack all blocks vertically with even spacing
                      </p>
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

      {/* ── Keyboard Shortcuts Modal ─────────────────────────── */}
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        dropdownColors={dropdownColors}
      />

      {/* ── Command Palette ────────────────────────────────────── */}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onExecute={handleCommand}
        dropdownColors={dropdownColors}
      />

      {/* ── Onboarding Tour ────────────────────────────────────── */}
      <OnboardingTour dropdownColors={dropdownColors} />

      {/* ── Publish Dialog ────────────────────────────────────────── */}
      {showPublishDialog && (
        <>
          <div
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowPublishDialog(false); setPublishTab("publish"); }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-dialog-title"
            className="fixed left-1/2 top-1/2 z-[301] w-[460px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl"
            style={{ backgroundColor: dropdownColors.bg, border: `1px solid ${dropdownColors.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
          >
            <div className="px-5 pt-5">
              <h2 id="publish-dialog-title" className="text-[15px] font-bold" style={{ color: dropdownColors.text }}>
                {publishTab === "publish"
                  ? (portfolio.status === "PUBLISHED" ? "Update & Publish" : "Publish Portfolio")
                  : "Share as Template"}
              </h2>
              {/* Tab pill toggle */}
              <div className="mt-3 flex gap-1 rounded-lg p-1" style={{ backgroundColor: dropdownColors.hover }}>
                <button
                  onClick={() => setPublishTab("publish")}
                  className="flex-1 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all"
                  style={{
                    backgroundColor: publishTab === "publish" ? dropdownColors.bg : "transparent",
                    color: publishTab === "publish" ? dropdownColors.text : dropdownColors.textMuted,
                    boxShadow: publishTab === "publish" ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  Publish
                </button>
                <button
                  onClick={() => setPublishTab("template")}
                  className="flex-1 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all"
                  style={{
                    backgroundColor: publishTab === "template" ? dropdownColors.bg : "transparent",
                    color: publishTab === "template" ? dropdownColors.text : dropdownColors.textMuted,
                    boxShadow: publishTab === "template" ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  Share as Template
                </button>
              </div>
            </div>

            {/* ── Publish tab ── */}
            {publishTab === "publish" && (
              <>
                <div className="space-y-4 px-5 pt-4">
                  {/* Password protection (optional) */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: dropdownColors.textMuted }}>
                      <Lock className="h-3 w-3" />
                      Password Protection
                      <span className="rounded px-1 py-0.5 text-[8px] font-semibold normal-case tracking-normal" style={{ backgroundColor: dropdownColors.hover, color: dropdownColors.textMuted }}>Optional</span>
                    </label>
                    <input
                      type="text"
                      value={publishPassword}
                      onChange={(e) => setPublishPassword(e.target.value)}
                      placeholder="Leave empty for public access"
                      className="h-8 w-full rounded-lg border px-3 text-[12px] outline-none transition-colors"
                      style={{ backgroundColor: dropdownColors.hover, borderColor: dropdownColors.separator, color: dropdownColors.text }}
                    />
                    <p className="mt-1 text-[9px]" style={{ color: dropdownColors.textMuted }}>
                      {publishPassword ? "Visitors must enter this password to view." : "Anyone with the URL can view."}
                    </p>
                  </div>

                  {/* Portfolio URL preview */}
                  <div className="rounded-lg p-3" style={{ backgroundColor: dropdownColors.hover }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: dropdownColors.textMuted }}>Portfolio URL</p>
                    <p className="mt-1 truncate font-mono text-[11px]" style={{ color: dropdownColors.text }}>
                      /portfolio/{portfolio.user?.username}/{portfolio.slug}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-4">
                  <button
                    onClick={() => { setShowPublishDialog(false); setPublishTab("publish"); }}
                    className="rounded-lg px-3.5 py-2 text-[12px] font-medium transition-colors"
                    style={{ color: dropdownColors.textMuted }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, var(--b-accent, #14b8a6), #0891b2)" }}
                  >
                    {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                    {publishing ? "Publishing..." : portfolio.status === "PUBLISHED" ? "Update & Publish" : "Publish"}
                  </button>
                </div>
              </>
            )}

            {/* ── Share as Template tab ── */}
            {publishTab === "template" && (
              <>
                {portfolio.status !== "PUBLISHED" ? (
                  <div className="px-5 py-6">
                    <p className="text-[12px] leading-relaxed" style={{ color: dropdownColors.textMuted }}>
                      Publish your portfolio first before sharing it as a template.
                    </p>
                  </div>
                ) : shareSuccess ? (
                  <div className="px-5 py-6">
                    <p className="text-[13px] font-semibold" style={{ color: "#10b981" }}>
                      ✓ Template shared to community!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 px-5 pt-4">
                    {/* Template Name */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: dropdownColors.textMuted }}>
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        maxLength={80}
                        placeholder="My Awesome Portfolio"
                        className="h-8 w-full rounded-lg border px-3 text-[12px] outline-none transition-colors"
                        style={{ backgroundColor: dropdownColors.hover, borderColor: dropdownColors.separator, color: dropdownColors.text }}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: dropdownColors.textMuted }}>
                        Description
                      </label>
                      <textarea
                        value={templateDesc}
                        onChange={(e) => setTemplateDesc(e.target.value)}
                        maxLength={300}
                        rows={3}
                        placeholder="Describe your template..."
                        className="w-full resize-none rounded-lg border px-3 py-2 text-[12px] outline-none transition-colors"
                        style={{ backgroundColor: dropdownColors.hover, borderColor: dropdownColors.separator, color: dropdownColors.text }}
                      />
                    </div>

                    {/* Category + Color Theme row */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: dropdownColors.textMuted }}>
                          Category
                        </label>
                        <select
                          value={templateCategory}
                          onChange={(e) => setTemplateCategory(e.target.value as CommunityTemplateCategory)}
                          className="h-8 w-full rounded-lg border px-2 text-[12px] outline-none transition-colors"
                          style={{ backgroundColor: dropdownColors.hover, borderColor: dropdownColors.separator, color: dropdownColors.text }}
                        >
                          <option value="DEVELOPER">Developer</option>
                          <option value="DESIGNER">Designer</option>
                          <option value="WRITER">Writer</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: dropdownColors.textMuted }}>
                          Color Theme
                        </label>
                        <select
                          value={templateIsDark ? "dark" : "light"}
                          onChange={(e) => setTemplateIsDark(e.target.value === "dark")}
                          className="h-8 w-full rounded-lg border px-2 text-[12px] outline-none transition-colors"
                          style={{ backgroundColor: dropdownColors.hover, borderColor: dropdownColors.separator, color: dropdownColors.text }}
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                        </select>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: dropdownColors.textMuted }}>
                        Tags <span className="normal-case font-normal tracking-normal">({templateTags.length}/5)</span>
                      </label>
                      {templateTags.length < 5 && (
                        <input
                          type="text"
                          value={templateTagInput}
                          onChange={(e) => setTemplateTagInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const tag = templateTagInput.trim();
                              if (tag && /^[a-z0-9-]+$/.test(tag) && !templateTags.includes(tag) && templateTags.length < 5) {
                                setTemplateTags([...templateTags, tag]);
                                setTemplateTagInput("");
                              }
                            }
                          }}
                          placeholder="Press Enter to add tag"
                          className="h-8 w-full rounded-lg border px-3 text-[12px] outline-none transition-colors"
                          style={{ backgroundColor: dropdownColors.hover, borderColor: dropdownColors.separator, color: dropdownColors.text }}
                        />
                      )}
                      {templateTags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {templateTags.map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ backgroundColor: dropdownColors.hover, color: dropdownColors.text, border: `1px solid ${dropdownColors.separator}` }}
                            >
                              {tag}
                              <button
                                onClick={() => setTemplateTags(templateTags.filter((t) => t !== tag))}
                                className="opacity-60 hover:opacity-100"
                                style={{ color: dropdownColors.textMuted }}
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Share error */}
                    {shareError && (
                      <p className="text-[11px]" style={{ color: "#f43f5e" }}>{shareError}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {portfolio.status === "PUBLISHED" && !shareSuccess && (
                  <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-3">
                    <button
                      onClick={() => { setShowPublishDialog(false); setPublishTab("publish"); }}
                      className="rounded-lg px-3.5 py-2 text-[12px] font-medium transition-colors"
                      style={{ color: dropdownColors.textMuted }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShareTemplate}
                      disabled={sharingTemplate || !templateName.trim() || !templateDesc.trim()}
                      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
                    >
                      {sharingTemplate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {sharingTemplate ? "Sharing..." : "Share Template"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ── Version History Panel ────────────────────────────────── */}
      {showVersions && (
        <VersionHistoryPanel
          portfolioId={portfolio.id}
          onClose={() => setShowVersions(false)}
          onRestore={() => { setShowVersions(false); window.location.reload(); }}
          dropdownColors={dropdownColors}
        />
      )}

      {/* ── Frame Template Dialog ──────────────────────────────────── */}
      <FrameTemplateDialog
        open={showFrameTemplateDialog}
        onClose={() => setShowFrameTemplateDialog(false)}
        onSelect={addSectionFromTemplate}
        theme={theme}
      />

      {/* ── Page Dialog (add / rename / delete) ──────────────── */}
      {pageDialog && (
        <>
          <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm" onClick={() => setPageDialog(null)} />
          <div
            className="fixed left-1/2 top-1/2 z-[301] w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl"
            style={{ backgroundColor: dropdownColors.bg, border: `1px solid ${dropdownColors.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${dropdownColors.separator}` }}>
              <h3 className="text-[15px] font-bold" style={{ color: dropdownColors.text }}>
                {pageDialog.mode === "add" ? "Add Page" : pageDialog.mode === "rename" ? "Rename Page" : "Delete Page"}
              </h3>
            </div>
            <div className="p-5">
              {pageDialog.mode === "delete" ? (
                <p className="text-[13px] leading-relaxed" style={{ color: dropdownColors.textMuted }}>
                  Delete this page? Its sections will be moved to the Home page.
                </p>
              ) : (
                <input
                  autoFocus
                  type="text"
                  placeholder="Page name..."
                  value={pageDialog.value ?? ""}
                  onChange={(e) => setPageDialog({ ...pageDialog, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pageDialog.value?.trim()) {
                      if (pageDialog.mode === "add") { addPage(pageDialog.value.trim()); setPageDialog(null); }
                      else if (pageDialog.mode === "rename" && pageDialog.pageId) { renamePage(pageDialog.pageId, pageDialog.value.trim()); setPageDialog(null); }
                    }
                    if (e.key === "Escape") setPageDialog(null);
                  }}
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[var(--b-accent)]"
                  style={{ backgroundColor: dropdownColors.hover, borderColor: dropdownColors.separator, color: dropdownColors.text }}
                />
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 pb-4">
              <button
                onClick={() => setPageDialog(null)}
                className="rounded-lg px-4 py-2 text-[12px] font-medium transition-colors"
                style={{ color: dropdownColors.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pageDialog.mode === "add" && pageDialog.value?.trim()) { addPage(pageDialog.value.trim()); }
                  else if (pageDialog.mode === "rename" && pageDialog.pageId && pageDialog.value?.trim()) { renamePage(pageDialog.pageId, pageDialog.value.trim()); }
                  else if (pageDialog.mode === "delete" && pageDialog.pageId) { deletePage(pageDialog.pageId); }
                  setPageDialog(null);
                }}
                className="rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-colors"
                style={{ backgroundColor: pageDialog.mode === "delete" ? "#f43f5e" : "var(--b-accent)" }}
              >
                {pageDialog.mode === "add" ? "Create Page" : pageDialog.mode === "rename" ? "Rename" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
