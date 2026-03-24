"use client";

import {
  AlignCenter, AlignLeft, AlignRight, ChevronDown,
  Code, Copy, Eye, EyeOff, Link2, Lock, Trash2, Unlock,
  Type, Paintbrush, Box, Layers, Move, Sparkles,
  Smartphone, Monitor, SquareDashedBottom,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";

import { AdvancedColorInput } from "@/components/builder/color-picker";
import { ImageUpload } from "@/components/common/image-upload";
import { Tooltip } from "@/components/builder/tooltip";
import { BLOCK_REGISTRY } from "@/config/block-registry";
import { usePortfolioStore } from "@/stores/portfolio-store";
import type { BlockWithStyles, BlockStyles } from "@/types";

// ─── Props ───────────────────────────────────────────────────────

interface BlockPropertiesPanelProps {
  block: BlockWithStyles;
  onUpdateContent: (content: Record<string, unknown>) => void;
  onUpdateStyles: (styles: BlockStyles) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}

// ─── Section (Collapsible Group) ─────────────────────────────────

function Section({
  title, icon, children, defaultOpen = true,
}: {
  title: string; icon?: ReactNode; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--b-border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 transition-colors hover:brightness-110"
        style={{ color: open ? "var(--b-text-2)" : "var(--b-text-3)" }}
      >
        {icon && <span className="flex-shrink-0 opacity-50">{icon}</span>}
        <span className="flex-1 text-left text-[10px] font-bold uppercase tracking-[0.1em]">
          {title}
        </span>
        <ChevronDown
          className="h-3 w-3 transition-transform duration-200"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", opacity: 0.4 }}
        />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 pt-0.5">{children}</div>
      )}
    </div>
  );
}

// ─── Row / Grid ──────────────────────────────────────────────────

function PropRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="w-[52px] flex-shrink-0 text-[10px] font-medium"
        style={{ color: "var(--b-text-3)" }}
      >
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function PropGrid({ children }: { children: ReactNode }) {
  return <div className="space-y-2.5">{children}</div>;
}

function SubLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  const label = (
    <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-4)" }}>
      {children}
    </span>
  );
  if (hint) return <Tooltip content={hint} side="top">{label}</Tooltip>;
  return label;
}

// ─── Input Primitives ────────────────────────────────────────────

function NumInput({
  value, onChange, placeholder, label,
}: {
  value: number | string | undefined;
  onChange: (v: number) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="relative">
      {label && (
        <span
          className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase"
          style={{ color: "var(--b-text-4)" }}
        >
          {label}
        </span>
      )}
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        className="h-7 w-full rounded-md border text-right text-[11px] font-mono tabular-nums outline-none transition-colors focus:border-[var(--b-accent)]"
        style={{
          backgroundColor: "var(--b-surface)",
          borderColor: "var(--b-border)",
          color: "var(--b-text)",
          paddingLeft: label ? 22 : 8,
          paddingRight: 8,
        }}
      />
    </div>
  );
}

function TextInput({
  value, onChange, placeholder,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-7 w-full rounded-md border px-2.5 text-[11px] outline-none transition-colors focus:border-[var(--b-accent)]"
      style={{
        backgroundColor: "var(--b-surface)",
        borderColor: "var(--b-border)",
        color: "var(--b-text)",
      }}
    />
  );
}

function SelectInput({
  value, onChange, options,
}: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 w-full rounded-md border px-2 text-[11px] outline-none transition-colors focus:border-[var(--b-accent)]"
      style={{
        backgroundColor: "var(--b-surface)",
        borderColor: "var(--b-border)",
        color: "var(--b-text)",
      }}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ColorInput replaced by AdvancedColorInput from color-picker.tsx

function ToggleGroup({
  value, onChange, options,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: Array<{ value: string; icon?: ReactNode; label?: string }>;
}) {
  return (
    <div
      className="flex gap-0.5 rounded-md p-0.5"
      style={{ backgroundColor: "var(--b-surface)" }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="flex h-6 flex-1 items-center justify-center rounded text-[10px] font-medium transition-all duration-150"
          style={{
            backgroundColor: value === o.value ? "var(--b-accent-soft)" : "transparent",
            color: value === o.value ? "var(--b-accent)" : "var(--b-text-3)",
            boxShadow: value === o.value ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
          }}
        >
          {o.icon ?? o.label}
        </button>
      ))}
    </div>
  );
}

function SpacingBox({
  label, top, right, bottom, left, onChange,
}: {
  label: string;
  top?: number; right?: number; bottom?: number; left?: number;
  onChange: (side: string, value: number) => void;
}) {
  const inputStyle = {
    backgroundColor: "var(--b-surface-hover, var(--b-panel))",
    color: "var(--b-text-2)",
    borderColor: "var(--b-border)",
  };
  return (
    <div>
      <SubLabel>{label}</SubLabel>
      <div
        className="relative flex items-center justify-center rounded-lg border p-1.5"
        style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", minHeight: 76 }}
      >
        <input
          type="number" value={top ?? ""} onChange={(e) => onChange("top", Number(e.target.value))} placeholder="0"
          className="absolute left-1/2 top-1.5 h-5 w-10 -translate-x-1/2 rounded border text-center text-[10px] outline-none"
          style={inputStyle}
        />
        <input
          type="number" value={bottom ?? ""} onChange={(e) => onChange("bottom", Number(e.target.value))} placeholder="0"
          className="absolute bottom-1.5 left-1/2 h-5 w-10 -translate-x-1/2 rounded border text-center text-[10px] outline-none"
          style={inputStyle}
        />
        <input
          type="number" value={left ?? ""} onChange={(e) => onChange("left", Number(e.target.value))} placeholder="0"
          className="absolute left-1.5 top-1/2 h-5 w-10 -translate-y-1/2 rounded border text-center text-[10px] outline-none"
          style={inputStyle}
        />
        <input
          type="number" value={right ?? ""} onChange={(e) => onChange("right", Number(e.target.value))} placeholder="0"
          className="absolute right-1.5 top-1/2 h-5 w-10 -translate-y-1/2 rounded border text-center text-[10px] outline-none"
          style={inputStyle}
        />
        <div
          className="rounded-md border-2 border-dashed px-3 py-1 text-[8px] font-bold uppercase tracking-widest"
          style={{ borderColor: "var(--b-border-active)", color: "var(--b-text-4)" }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────

export function BlockPropertiesPanel({
  block, onUpdateContent, onUpdateStyles,
  onDelete, onDuplicate, onToggleVisibility, onToggleLock,
}: BlockPropertiesPanelProps) {
  const [content, setContent] = useState<Record<string, unknown>>(block.content as Record<string, unknown>);
  const [styles, setStyles] = useState<BlockStyles>(block.styles);
  const def = BLOCK_REGISTRY[block.type as keyof typeof BLOCK_REGISTRY];

  useEffect(() => {
    setContent(block.content as Record<string, unknown>);
    setStyles(block.styles);
  }, [block.id, block.content, block.styles]);

  const contentRef = useRef(content);
  contentRef.current = content;
  const stylesRef = useRef(styles);
  stylesRef.current = styles;

  const updateContent = useCallback((key: string, value: unknown) => {
    const updated = { ...contentRef.current, [key]: value };
    contentRef.current = updated;
    setContent(updated);
    onUpdateContent(updated);
  }, [onUpdateContent]);

  const updateStyle = useCallback((key: keyof BlockStyles, value: unknown) => {
    const updated = { ...stylesRef.current, [key]: value };
    stylesRef.current = updated;
    setStyles(updated);
    onUpdateStyles(updated);
  }, [onUpdateStyles]);

  const isTextType = ["heading", "text", "quote", "list", "button", "badge", "stat", "link", "code"].includes(block.type);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-3.5 py-3"
        style={{ borderBottom: "1px solid var(--b-border)" }}
      >
        {/* Block identity */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--b-accent-soft)" }}
          >
            <Box className="h-3.5 w-3.5" style={{ color: "var(--b-accent)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold" style={{ color: "var(--b-text)" }}>
              {def?.label ?? block.type}
            </div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--b-text-4)" }}>
              {def?.category ?? "element"}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="mt-2.5 flex items-center gap-1 rounded-lg p-1"
          style={{ backgroundColor: "var(--b-surface)" }}
        >
          {[
            { icon: block.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />, onClick: onToggleVisibility, title: block.isVisible ? "Hide" : "Show", active: block.isVisible },
            { icon: block.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />, onClick: onToggleLock, title: block.isLocked ? "Unlock" : "Lock", active: block.isLocked },
            { icon: <Copy className="h-3 w-3" />, onClick: onDuplicate, title: "Duplicate" },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              title={btn.title}
              className="flex h-6 flex-1 items-center justify-center gap-1 rounded-md text-[9px] font-medium transition-colors"
              style={{
                color: btn.active ? "var(--b-accent)" : "var(--b-text-3)",
                backgroundColor: btn.active ? "var(--b-accent-soft)" : "transparent",
              }}
            >
              {btn.icon}
              <span className="hidden sm:inline">{btn.title}</span>
            </button>
          ))}

          {/* Delete -- separated */}
          <div className="mx-0.5 h-4 w-px" style={{ backgroundColor: "var(--b-border)" }} />
          <button
            onClick={onDelete}
            title="Delete"
            className="flex h-6 w-7 items-center justify-center rounded-md transition-colors"
            style={{ color: "var(--b-danger)" }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Properties ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Content (always first) ────────────────────────────── */}
        <Section title="Content" icon={<Type className="h-3 w-3" />}>
          <ContentEditor type={block.type} content={content} updateContent={updateContent} />
        </Section>

        {/* ── Position & Size ──────────────────────────────────── */}
        <Section title="Transform" icon={<Move className="h-3 w-3" />}>
          <PropGrid>
            <div>
              <SubLabel hint="X/Y coordinates relative to the section's top-left corner">Position</SubLabel>
              <div className="grid grid-cols-2 gap-1.5">
                <NumInput label="X" value={styles.x} onChange={(v) => updateStyle("x", v)} />
                <NumInput label="Y" value={styles.y} onChange={(v) => updateStyle("y", v)} />
              </div>
            </div>
            <div>
              <SubLabel>Size</SubLabel>
              <div className="grid grid-cols-2 gap-1.5">
                <NumInput label="W" value={styles.w} onChange={(v) => updateStyle("w", v)} />
                <NumInput label="H" value={styles.h} onChange={(v) => updateStyle("h", v)} placeholder="auto" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <SubLabel>Rotation</SubLabel>
                <NumInput label="R" value={styles.rotation} onChange={(v) => updateStyle("rotation", v)} placeholder="0" />
              </div>
              <div>
                <SubLabel>Opacity</SubLabel>
                <NumInput label="O" value={styles.opacity} onChange={(v) => updateStyle("opacity", v)} placeholder="1" />
              </div>
            </div>
          </PropGrid>
        </Section>

        {/* ── Fill & Stroke ──────────────────────────────────────── */}
        <Section title="Appearance" icon={<Paintbrush className="h-3 w-3" />}>
          <PropGrid>
            <div>
              <SubLabel>Background</SubLabel>
              <AdvancedColorInput
                value={styles.backgroundColor}
                onChange={(v) => updateStyle("backgroundColor", v)}
                placeholder="transparent"
              />
            </div>

            <div>
              <SubLabel>Border</SubLabel>
              <AdvancedColorInput
                value={styles.borderColor}
                onChange={(v) => updateStyle("borderColor", v)}
                placeholder="none"
              />
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                <div>
                  <span className="mb-0.5 block text-[8px]" style={{ color: "var(--b-text-4)" }}>Width</span>
                  <NumInput value={styles.borderWidth} onChange={(v) => updateStyle("borderWidth", v)} placeholder="0" />
                </div>
                <div>
                  <span className="mb-0.5 block text-[8px]" style={{ color: "var(--b-text-4)" }}>Radius</span>
                  <NumInput value={styles.borderRadius} onChange={(v) => updateStyle("borderRadius", v)} placeholder="0" />
                </div>
                <div>
                  <span className="mb-0.5 block text-[8px]" style={{ color: "var(--b-text-4)" }}>Style</span>
                  <SelectInput
                    value={styles.borderStyle}
                    onChange={(v) => updateStyle("borderStyle", v)}
                    options={[
                      { label: "Solid", value: "solid" },
                      { label: "Dashed", value: "dashed" },
                      { label: "Dotted", value: "dotted" },
                      { label: "None", value: "none" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Radius presets */}
            <div>
              <SubLabel>Corner Presets</SubLabel>
              <div className="flex gap-1">
                {([
                  { label: "None", value: 0 },
                  { label: "SM", value: 4 },
                  { label: "MD", value: 8 },
                  { label: "LG", value: 16 },
                  { label: "Full", value: "50%" },
                ] as const).map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => updateStyle("borderRadius", preset.value)}
                    className="flex-1 rounded-md py-1 text-[9px] font-semibold transition-all duration-150"
                    style={{
                      backgroundColor: String(styles.borderRadius) === String(preset.value) ? "var(--b-accent-soft)" : "var(--b-surface)",
                      color: String(styles.borderRadius) === String(preset.value) ? "var(--b-accent)" : "var(--b-text-3)",
                      border: String(styles.borderRadius) === String(preset.value)
                        ? "1px solid var(--b-accent-mid)" : "1px solid var(--b-border)",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shadow */}
            <PropRow label="Shadow">
              <SelectInput
                value={styles.boxShadow}
                onChange={(v) => updateStyle("boxShadow", v)}
                options={[
                  { label: "None", value: "none" },
                  { label: "Small", value: "sm" },
                  { label: "Medium", value: "md" },
                  { label: "Large", value: "lg" },
                  { label: "XL", value: "xl" },
                ]}
              />
            </PropRow>
          </PropGrid>
        </Section>

        {/* ── Typography ───────────────────────────────────────── */}
        {isTextType && (
          <Section title="Typography" icon={<Type className="h-3 w-3" />}>
            <PropGrid>
              <PropRow label="Font">
                <SelectInput
                  value={styles.fontFamily}
                  onChange={(v) => updateStyle("fontFamily", v)}
                  options={[
                    { label: "Heading", value: "heading" },
                    { label: "Body", value: "body" },
                    { label: "Mono", value: "mono" },
                  ]}
                />
              </PropRow>

              <div>
                <SubLabel>Size & Weight</SubLabel>
                <div className="grid grid-cols-2 gap-1.5">
                  <NumInput value={styles.fontSize} onChange={(v) => updateStyle("fontSize", v)} placeholder="16" />
                  <SelectInput
                    value={styles.fontWeight}
                    onChange={(v) => updateStyle("fontWeight", Number(v))}
                    options={[
                      { label: "Light", value: "300" },
                      { label: "Regular", value: "400" },
                      { label: "Medium", value: "500" },
                      { label: "Semi", value: "600" },
                      { label: "Bold", value: "700" },
                      { label: "Extra", value: "800" },
                      { label: "Black", value: "900" },
                    ]}
                  />
                </div>
              </div>

              <div>
                <SubLabel hint="Line height: 1.0 = tight, 1.5 = normal. Letter spacing in pixels.">Line Height & Spacing</SubLabel>
                <div className="grid grid-cols-2 gap-1.5">
                  <NumInput value={styles.lineHeight} onChange={(v) => updateStyle("lineHeight", v)} placeholder="1.5" />
                  <NumInput value={styles.letterSpacing} onChange={(v) => updateStyle("letterSpacing", v)} placeholder="0" />
                </div>
              </div>

              <PropRow label="Align">
                <ToggleGroup
                  value={styles.textAlign}
                  onChange={(v) => updateStyle("textAlign", v)}
                  options={[
                    { value: "left", icon: <AlignLeft className="h-3 w-3" /> },
                    { value: "center", icon: <AlignCenter className="h-3 w-3" /> },
                    { value: "right", icon: <AlignRight className="h-3 w-3" /> },
                  ]}
                />
              </PropRow>

              <PropRow label="Transform">
                <SelectInput
                  value={styles.textTransform}
                  onChange={(v) => updateStyle("textTransform", v)}
                  options={[
                    { label: "None", value: "none" },
                    { label: "Uppercase", value: "uppercase" },
                    { label: "Lowercase", value: "lowercase" },
                    { label: "Capitalize", value: "capitalize" },
                  ]}
                />
              </PropRow>

              <PropRow label="Color">
                <AdvancedColorInput
                  value={styles.color}
                  onChange={(v) => updateStyle("color", v)}
                  placeholder="inherit"
                />
              </PropRow>
            </PropGrid>
          </Section>
        )}

        {/* ── Spacing ─────────────────────────────────────────── */}
        <Section title="Spacing" icon={<SquareDashedBottom className="h-3 w-3" />} defaultOpen={false}>
          <div className="space-y-4">
            <SpacingBox
              label="Padding"
              top={styles.paddingTop} right={styles.paddingRight}
              bottom={styles.paddingBottom} left={styles.paddingLeft}
              onChange={(side, val) =>
                updateStyle(`padding${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof BlockStyles, val)
              }
            />
            <SpacingBox
              label="Margin"
              top={styles.marginTop} right={styles.marginRight}
              bottom={styles.marginBottom} left={styles.marginLeft}
              onChange={(side, val) =>
                updateStyle(`margin${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof BlockStyles, val)
              }
            />
          </div>
        </Section>

        {/* ── Layout ──────────────────────────────────────────── */}
        <Section title="Layout" icon={<Layers className="h-3 w-3" />} defaultOpen={false}>
          <PropGrid>
            <PropRow label="Display">
              <SelectInput
                value={styles.display}
                onChange={(v) => updateStyle("display", v)}
                options={[
                  { label: "Block", value: "block" },
                  { label: "Flex", value: "flex" },
                  { label: "Grid", value: "grid" },
                  { label: "Inline Flex", value: "inline-flex" },
                ]}
              />
            </PropRow>
            <PropRow label="Direction">
              <SelectInput
                value={styles.flexDirection}
                onChange={(v) => updateStyle("flexDirection", v)}
                options={[
                  { label: "Row", value: "row" },
                  { label: "Column", value: "column" },
                ]}
              />
            </PropRow>
            <div>
              <SubLabel>Alignment</SubLabel>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <span className="mb-0.5 block text-[8px]" style={{ color: "var(--b-text-4)" }}>Align</span>
                  <SelectInput
                    value={styles.alignItems}
                    onChange={(v) => updateStyle("alignItems", v)}
                    options={[
                      { label: "Start", value: "start" },
                      { label: "Center", value: "center" },
                      { label: "End", value: "end" },
                      { label: "Stretch", value: "stretch" },
                    ]}
                  />
                </div>
                <div>
                  <span className="mb-0.5 block text-[8px]" style={{ color: "var(--b-text-4)" }}>Justify</span>
                  <SelectInput
                    value={styles.justifyContent}
                    onChange={(v) => updateStyle("justifyContent", v)}
                    options={[
                      { label: "Start", value: "start" },
                      { label: "Center", value: "center" },
                      { label: "End", value: "end" },
                      { label: "Between", value: "between" },
                    ]}
                  />
                </div>
              </div>
            </div>
            <PropRow label="Gap">
              <NumInput value={styles.gap} onChange={(v) => updateStyle("gap", v)} placeholder="0" />
            </PropRow>

            <div>
              <SubLabel>Sizing</SubLabel>
              <div className="space-y-1.5">
                <PropRow label="Width">
                  <TextInput value={styles.width} onChange={(v) => updateStyle("width", v)} placeholder="auto" />
                </PropRow>
                <PropRow label="Max W">
                  <TextInput value={styles.maxWidth} onChange={(v) => updateStyle("maxWidth", v)} placeholder="none" />
                </PropRow>
                <PropRow label="Min H">
                  <TextInput value={styles.minHeight} onChange={(v) => updateStyle("minHeight", v)} placeholder="auto" />
                </PropRow>
              </div>
            </div>

            <PropRow label="Overflow">
              <SelectInput
                value={styles.overflow}
                onChange={(v) => updateStyle("overflow", v)}
                options={[
                  { label: "Visible", value: "visible" },
                  { label: "Hidden", value: "hidden" },
                  { label: "Auto", value: "auto" },
                ]}
              />
            </PropRow>
          </PropGrid>
        </Section>

        {/* ── Effects ──────────────────────────────────────────── */}
        <Section title="Effects" icon={<Sparkles className="h-3 w-3" />} defaultOpen={false}>
          <PropGrid>
            {/* Entrance Animation */}
            <div>
              <SubLabel hint="How the block appears when scrolled into view">Entrance Animation</SubLabel>
              <SelectInput
                value={styles.animation}
                onChange={(v) => updateStyle("animation", v)}
                options={[
                  { label: "None", value: "none" },
                  { label: "Fade Up", value: "fade-up" },
                  { label: "Fade In", value: "fade-in" },
                  { label: "Slide Left", value: "slide-left" },
                  { label: "Slide Right", value: "slide-right" },
                  { label: "Scale", value: "scale" },
                  { label: "Blur In", value: "blur-in" },
                  { label: "Bounce In", value: "bounce-in" },
                  { label: "Flip X", value: "flip-x" },
                  { label: "Flip Y", value: "flip-y" },
                  { label: "Rotate In", value: "rotate-in" },
                  { label: "Zoom In", value: "zoom-in" },
                ]}
              />
            </div>

            {/* Duration & Delay */}
            {styles.animation && styles.animation !== "none" && (
              <>
                <div>
                  <SubLabel hint="Animation duration in seconds">Duration & Delay</SubLabel>
                  <div className="grid grid-cols-2 gap-1.5">
                    <NumInput label="Dur" value={styles.animationDuration} onChange={(v) => updateStyle("animationDuration", v)} placeholder="0.6" />
                    <NumInput label="Del" value={styles.animationDelay} onChange={(v) => updateStyle("animationDelay", v)} placeholder="0" />
                  </div>
                </div>

                <div>
                  <SubLabel hint="Spring and bounce use physics-based motion">Easing</SubLabel>
                  <SelectInput
                    value={styles.animationEasing}
                    onChange={(v) => updateStyle("animationEasing", v)}
                    options={[
                      { label: "Ease Out", value: "ease-out" },
                      { label: "Ease In", value: "ease-in" },
                      { label: "Ease In-Out", value: "ease-in-out" },
                      { label: "Spring", value: "spring" },
                      { label: "Bounce", value: "bounce" },
                    ]}
                  />
                </div>
              </>
            )}

            {/* Scroll Trigger */}
            <div>
              <SubLabel hint="Control how the block interacts with scrolling">Scroll Effect</SubLabel>
              <SelectInput
                value={styles.scrollTrigger}
                onChange={(v) => updateStyle("scrollTrigger", v)}
                options={[
                  { label: "None", value: "none" },
                  { label: "Reveal on Scroll", value: "reveal" },
                  { label: "Parallax", value: "parallax" },
                ]}
              />
            </div>

            {styles.scrollTrigger === "parallax" && (
              <div>
                <SubLabel hint="Higher = more parallax movement">Parallax Speed</SubLabel>
                <NumInput value={styles.parallaxSpeed} onChange={(v) => updateStyle("parallaxSpeed", v)} placeholder="0.5" />
              </div>
            )}

            {/* Hover Effect */}
            <div>
              <SubLabel hint="Interactive effect when visitors hover over this block">Hover Effect</SubLabel>
              <SelectInput
                value={styles.hoverEffect}
                onChange={(v) => updateStyle("hoverEffect", v)}
                options={[
                  { label: "None", value: "none" },
                  { label: "Lift", value: "lift" },
                  { label: "3D Tilt", value: "tilt-3d" },
                  { label: "Glow", value: "glow" },
                  { label: "Grow", value: "grow" },
                  { label: "Shake", value: "shake" },
                ]}
              />
            </div>
          </PropGrid>
        </Section>

        {/* ── Responsive ──────────────────────────────────────── */}
        <Section title="Responsive" icon={<Smartphone className="h-3 w-3" />} defaultOpen={false}>
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[11px] transition-colors" style={{ color: "var(--b-text-2)", backgroundColor: styles.hideOnMobile ? "var(--b-accent-soft)" : "transparent" }}>
              <input
                type="checkbox"
                checked={styles.hideOnMobile ?? false}
                onChange={(e) => updateStyle("hideOnMobile", e.target.checked)}
                className="rounded"
              />
              <Smartphone className="h-3 w-3" style={{ opacity: 0.5 }} />
              Hide on mobile
            </label>
            <label className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[11px] transition-colors" style={{ color: "var(--b-text-2)", backgroundColor: styles.hideOnDesktop ? "var(--b-accent-soft)" : "transparent" }}>
              <input
                type="checkbox"
                checked={styles.hideOnDesktop ?? false}
                onChange={(e) => updateStyle("hideOnDesktop", e.target.checked)}
                className="rounded"
              />
              <Monitor className="h-3 w-3" style={{ opacity: 0.5 }} />
              Hide on desktop
            </label>
          </div>
        </Section>

        {/* ── Custom CSS ────────────────────────────────────── */}
        <Section title="Custom CSS" icon={<Code className="h-3 w-3" />} defaultOpen={false}>
          <div>
            <textarea
              value={styles.customCss ?? ""}
              onChange={(e) => updateStyle("customCss", e.target.value)}
              placeholder={"/* Custom CSS */\nbackground: linear-gradient(...);\nbox-shadow: 0 4px 20px rgba(0,0,0,0.3);"}
              rows={6}
              className="w-full rounded-md border px-2.5 py-2 font-mono text-[10px] outline-none transition-colors focus:border-[var(--b-accent)]"
              style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)", resize: "vertical" }}
            />
            <p className="mt-1.5 text-[9px]" style={{ color: "var(--b-text-4)" }}>
              CSS properties applied directly to this block. Use standard CSS syntax.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── Button/Link Editor with Section Linking ────────────────────

function ButtonContentEditor({
  content, updateContent, field, isLink,
}: {
  content: Record<string, unknown>;
  updateContent: (key: string, value: unknown) => void;
  field: (label: string, key: string, opts?: { type?: "textarea" | "number" | "select"; placeholder?: string; options?: Array<{ label: string; value: string }> }) => ReactNode;
  isLink?: boolean;
}) {
  const portfolio = usePortfolioStore((s) => s.currentPortfolio);
  const sections = portfolio?.sections ?? [];

  const currentUrl = (content.url as string) ?? "";
  const isInternalLink = currentUrl.startsWith("#section-");
  const linkedSectionId = isInternalLink ? currentUrl.replace("#section-", "") : "";

  // Track mode explicitly so toggling to "section" works even with empty URL
  const [linkMode, setLinkMode] = useState<"url" | "section">(isInternalLink ? "section" : "url");

  // Sync mode when content changes externally
  useEffect(() => {
    setLinkMode(currentUrl.startsWith("#section-") ? "section" : "url");
  }, [currentUrl]);

  const linkToSection = (sectionId: string) => {
    if (sectionId) {
      updateContent("url", `#section-${sectionId}`);
      updateContent("newTab", false);
    } else {
      updateContent("url", "");
    }
  };

  const linkedSection = sections.find((s) => s.id === linkedSectionId);

  return (
    <div className="space-y-2.5">
      {field("Label", "text")}

      <div>
        <SubLabel hint="Link to an external URL or scroll to a section in your portfolio">Link To</SubLabel>
        <ToggleGroup
          value={linkMode}
          onChange={(v) => {
            const mode = v as "url" | "section";
            setLinkMode(mode);
            if (mode === "section") {
              if (sections[0]) linkToSection(sections[0].id);
            } else {
              updateContent("url", "");
            }
          }}
          options={[
            { value: "url", label: "URL" },
            { value: "section", label: "Section" },
          ]}
        />
      </div>

      {linkMode === "section" ? (
        <div>
          <SubLabel>Target Section</SubLabel>
          {sections.length > 0 ? (
            <>
              <select
                value={linkedSectionId}
                onChange={(e) => linkToSection(e.target.value)}
                className="h-7 w-full rounded-md border px-2 text-[11px] outline-none"
                style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {linkedSection && (
                <div
                  className="mt-1.5 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium"
                  style={{ backgroundColor: "var(--b-accent-soft)", color: "var(--b-accent)" }}
                >
                  <Link2 className="h-3 w-3" />
                  Scrolls to &quot;{linkedSection.name}&quot;
                </div>
              )}
            </>
          ) : (
            <p className="text-[10px]" style={{ color: "var(--b-text-4)" }}>
              No sections available. Add sections to your portfolio first.
            </p>
          )}
        </div>
      ) : (
        field("URL", "url", { placeholder: "https://..." })
      )}

      {!isLink && (
        <>
          {field("Variant", "variant", { type: "select", options: [{ label: "Solid", value: "solid" }, { label: "Outline", value: "outline" }, { label: "Ghost", value: "ghost" }, { label: "Link", value: "link" }] })}
          {field("Size", "size", { type: "select", options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }] })}
        </>
      )}

      {linkMode === "url" && (
        <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]" style={{ color: "var(--b-text-2)" }}>
          <input type="checkbox" checked={(content.newTab as boolean) ?? false} onChange={(e) => updateContent("newTab", e.target.checked)} className="rounded" />
          Open in new tab
        </label>
      )}
    </div>
  );
}

// ─── Content Editor ──────────────────────────────────────────────

function ContentEditor({
  type, content, updateContent,
}: {
  type: string;
  content: Record<string, unknown>;
  updateContent: (key: string, value: unknown) => void;
}) {
  const field = (label: string, key: string, opts?: { type?: "textarea" | "number" | "select"; placeholder?: string; rows?: number; options?: Array<{ label: string; value: string }> }) => {
    const val = content[key];
    if (opts?.type === "textarea") {
      return (
        <div>
          <SubLabel>{label}</SubLabel>
          <textarea
            value={(val as string) ?? ""}
            onChange={(e) => updateContent(key, e.target.value)}
            rows={opts.rows ?? 3}
            className="w-full rounded-md border px-2.5 py-2 text-[11px] outline-none transition-colors focus:border-[var(--b-accent)]"
            style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)", resize: "vertical" }}
          />
        </div>
      );
    }
    if (opts?.type === "number") {
      return (
        <div>
          <SubLabel>{label}</SubLabel>
          <NumInput value={val as number} onChange={(v) => updateContent(key, v)} placeholder={opts.placeholder} />
        </div>
      );
    }
    if (opts?.type === "select" && opts.options) {
      return (
        <div>
          <SubLabel>{label}</SubLabel>
          <SelectInput value={val as string} onChange={(v) => updateContent(key, v)} options={opts.options} />
        </div>
      );
    }
    return (
      <div>
        <SubLabel>{label}</SubLabel>
        <TextInput value={(val as string) ?? ""} onChange={(v) => updateContent(key, v)} placeholder={opts?.placeholder} />
      </div>
    );
  };

  switch (type) {
    case "heading":
      return (
        <div className="space-y-2.5">
          {field("Text", "text")}
          {field("Level", "level", { type: "select", options: [1,2,3,4,5,6].map((l) => ({ label: `H${l}`, value: String(l) })) })}
          {field("Highlight", "highlight", { placeholder: "Colored portion" })}
        </div>
      );
    case "text":
      return <div className="space-y-2.5">{field("Text", "text", { type: "textarea", rows: 5 })}</div>;
    case "button":
      return <ButtonContentEditor content={content} updateContent={updateContent} field={field} />;
    case "link":
      return <ButtonContentEditor content={content} updateContent={updateContent} field={field} isLink />;
    case "image":
      return (
        <div className="space-y-2.5">
          <div>
            <SubLabel>Image</SubLabel>
            <ImageUpload
              value={(content.src as string) ?? ""}
              onChange={(v) => updateContent("src", v)}
            />
          </div>
          {field("Alt Text", "alt")}
          {field("Caption", "caption")}
          {field("Aspect Ratio", "aspectRatio", { placeholder: "16/9" })}
        </div>
      );
    case "avatar":
      return (
        <div className="space-y-2.5">
          <div>
            <SubLabel>Avatar Image</SubLabel>
            <ImageUpload
              value={(content.src as string) ?? ""}
              onChange={(v) => updateContent("src", v)}
              compact
            />
          </div>
          {field("Alt Text", "alt")}
          {field("Size", "size", { type: "select", options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }, { label: "XL", value: "xl" }] })}
        </div>
      );
    case "skill_bar":
      return (
        <div className="space-y-2.5">
          {field("Skill Name", "name")}
          {field("Level (0-100)", "level", { type: "number" })}
          <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]" style={{ color: "var(--b-text-2)" }}>
            <input type="checkbox" checked={(content.showPercentage as boolean) ?? true} onChange={(e) => updateContent("showPercentage", e.target.checked)} className="rounded" />
            Show percentage
          </label>
        </div>
      );
    case "project_card":
      return (
        <div className="space-y-2.5">
          {field("Title", "title")}
          {field("Description", "description", { type: "textarea" })}
          {field("Image URL", "imageUrl")}
          <div>
            <SubLabel>Tech Stack</SubLabel>
            <TextInput
              value={((content.techStack as string[]) ?? []).join(", ")}
              onChange={(v) => updateContent("techStack", v.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="React, Node.js"
            />
          </div>
          {field("Live URL", "liveUrl")}
          {field("Repo URL", "repoUrl")}
        </div>
      );
    case "experience_item":
      return (
        <div className="space-y-2.5">
          {field("Role", "role")}
          {field("Company", "company")}
          {field("Location", "location")}
          <div>
            <SubLabel>Duration</SubLabel>
            <div className="grid grid-cols-2 gap-1.5">
              <div>{field("Start", "startDate", { placeholder: "2023" })}</div>
              <div>{field("End", "endDate", { placeholder: "Present" })}</div>
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]" style={{ color: "var(--b-text-2)" }}>
            <input type="checkbox" checked={(content.current as boolean) ?? false} onChange={(e) => updateContent("current", e.target.checked)} className="rounded" />
            Current position
          </label>
          {field("Description", "description", { type: "textarea" })}
        </div>
      );
    case "rectangle":
    case "circle": {
      const fillType = (content.fillType as string) ?? "color";
      return (
        <div className="space-y-2.5">
          {/* Fill type toggle */}
          <div>
            <SubLabel>Fill Type</SubLabel>
            <ToggleGroup
              value={fillType}
              onChange={(v) => updateContent("fillType", v)}
              options={[
                { value: "color", label: "Color" },
                { value: "image", label: "Image" },
              ]}
            />
          </div>

          {fillType === "color" ? (
            <div>
              <SubLabel>Fill Color</SubLabel>
              <AdvancedColorInput value={(content.fill as string) ?? ""} onChange={(v) => updateContent("fill", v)} placeholder="#6366f1" />
            </div>
          ) : (
            <div>
              <SubLabel>Image</SubLabel>
              <ImageUpload
                value={(content.imageSrc as string) ?? ""}
                onChange={(v) => updateContent("imageSrc", v)}
              />
              {field("Object Fit", "objectFit", { type: "select", options: [
                { label: "Cover", value: "cover" },
                { label: "Contain", value: "contain" },
                { label: "Fill", value: "fill" },
              ]})}
            </div>
          )}

          <div>
            <SubLabel>Border Color</SubLabel>
            <AdvancedColorInput value={(content.borderColor as string) ?? ""} onChange={(v) => updateContent("borderColor", v)} placeholder="none" />
          </div>
          {field("Border Width", "borderWidth", { type: "number", placeholder: "0" })}
        </div>
      );
    }
    case "line":
      return (
        <div className="space-y-2.5">
          <div>
            <SubLabel>Color</SubLabel>
            <AdvancedColorInput value={(content.color as string) ?? ""} onChange={(v) => updateContent("color", v)} placeholder="#a1a1aa" />
          </div>
          {field("Thickness", "thickness", { type: "number", placeholder: "2" })}
          {field("Direction", "direction", { type: "select", options: [{ label: "Horizontal", value: "horizontal" }, { label: "Vertical", value: "vertical" }] })}
        </div>
      );
    case "embed":
      return (
        <div className="space-y-2.5">
          {field("Embed URL", "url", { placeholder: "https://..." })}
          {field("Height", "height", { type: "number", placeholder: "400" })}
        </div>
      );
    case "youtube":
      return (
        <div className="space-y-2.5">
          {field("YouTube URL", "url", { placeholder: "https://youtube.com/watch?v=..." })}
          <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]" style={{ color: "var(--b-text-2)" }}>
            <input type="checkbox" checked={(content.autoplay as boolean) ?? false} onChange={(e) => updateContent("autoplay", e.target.checked)} className="rounded" />
            Autoplay (muted)
          </label>
        </div>
      );
    case "spotify":
      return (
        <div className="space-y-2.5">
          {field("Spotify URL", "url", { placeholder: "https://open.spotify.com/track/..." })}
          <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]" style={{ color: "var(--b-text-2)" }}>
            <input type="checkbox" checked={(content.compact as boolean) ?? false} onChange={(e) => updateContent("compact", e.target.checked)} className="rounded" />
            Compact mode
          </label>
        </div>
      );
    case "google_map":
      return (
        <div className="space-y-2.5">
          {field("Location", "query", { placeholder: "New York, NY" })}
          {field("Zoom Level", "zoom", { type: "number", placeholder: "14" })}
        </div>
      );
    case "calendly":
      return (
        <div className="space-y-2.5">
          {field("Calendly URL", "url", { placeholder: "https://calendly.com/your-name" })}
        </div>
      );
    case "github_contrib":
      return (
        <div className="space-y-2.5">
          {field("GitHub Username", "username", { placeholder: "octocat" })}
        </div>
      );
    case "custom_html":
      return (
        <div className="space-y-2.5">
          {field("HTML Code", "html", { type: "textarea" })}
          {field("Height", "height", { type: "number", placeholder: "300" })}
        </div>
      );
    default:
      return (
        <div>
          <SubLabel>JSON</SubLabel>
          <textarea
            className="w-full rounded-md border px-2.5 py-2 font-mono text-[10px] outline-none transition-colors focus:border-[var(--b-accent)]"
            rows={12}
            value={JSON.stringify(content, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                Object.entries(parsed).forEach(([k, v]) => updateContent(k, v));
              } catch { /* invalid JSON */ }
            }}
            style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)", resize: "vertical" }}
          />
        </div>
      );
  }
}
