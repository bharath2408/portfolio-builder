"use client";

import { ChevronRight, Save, Droplets } from "lucide-react";
import { useState, useEffect, useCallback, type ReactNode } from "react";

import { COLOR_PRESETS, FONT_OPTIONS } from "@/config/constants";
import { useBuilderStore } from "@/stores/builder-store";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { apiPatch } from "@/lib/api";
import type { Theme, ThemeMode } from "@/types";

// ─── Props ───────────────────────────────────────────────────────

interface ThemeEditorProps {
  portfolioId: string;
  theme: Theme | null;
}

// ─── Compact Section ─────────────────────────────────────────────

function Section({
  title, children, defaultOpen = true,
}: {
  title: string; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--b-border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors"
        style={{ color: "var(--b-text-3)" }}
      >
        <ChevronRight
          className="h-2.5 w-2.5 transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
        {title}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// ─── Color Row ───────────────────────────────────────────────────

function ColorRow({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-[60px] flex-shrink-0 text-[10px] font-medium"
        style={{ color: "var(--b-text-3)" }}
      >
        {label}
      </span>
      <input
        type="color"
        value={value && value.startsWith("#") ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-6 flex-shrink-0 cursor-pointer rounded border-0 p-0"
        style={{ backgroundColor: "var(--b-surface)" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 flex-1 rounded border-0 px-1.5 font-mono text-[10px] uppercase outline-none"
        style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text)" }}
      />
    </div>
  );
}

// ─── Theme Editor ────────────────────────────────────────────────

export function ThemeEditor({ portfolioId, theme }: ThemeEditorProps) {
  const { setDirty } = useBuilderStore();
  const { updateTheme } = usePortfolioStore();
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState<ThemeMode>(theme?.mode ?? "DARK");
  const [primaryColor, setPrimaryColor] = useState(theme?.primaryColor ?? "#06b6d4");
  const [secondaryColor, setSecondaryColor] = useState(theme?.secondaryColor ?? "#8b5cf6");
  const [accentColor, setAccentColor] = useState(theme?.accentColor ?? "#f43f5e");
  const [backgroundColor, setBackgroundColor] = useState(theme?.backgroundColor ?? "#0f172a");
  const [textColor, setTextColor] = useState(theme?.textColor ?? "#f8fafc");
  const [fontHeading, setFontHeading] = useState(theme?.fontHeading ?? "Outfit");
  const [fontBody, setFontBody] = useState(theme?.fontBody ?? "DM Sans");
  const [borderRadius, setBorderRadius] = useState(theme?.borderRadius ?? "0.5rem");

  useEffect(() => {
    if (theme) {
      setMode(theme.mode);
      setPrimaryColor(theme.primaryColor);
      setSecondaryColor(theme.secondaryColor);
      setAccentColor(theme.accentColor);
      setBackgroundColor(theme.backgroundColor);
      setTextColor(theme.textColor);
      setFontHeading(theme.fontHeading);
      setFontBody(theme.fontBody);
      setBorderRadius(theme.borderRadius);
    }
  }, [theme]);

  // Push a single field change to the store immediately.
  // Only sends the changed field as a partial update — no stale closures.
  const pushToStore = useCallback((field: string, value: string) => {
    updateTheme({ [field]: value });
    setDirty(true);
  }, [updateTheme, setDirty]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch(`/portfolios/${portfolioId}/theme`, {
        mode, primaryColor, secondaryColor, accentColor,
        backgroundColor, textColor, fontHeading, fontBody, borderRadius,
      });
      setDirty(false);
    } catch {
      console.error("Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: (typeof COLOR_PRESETS)[number]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
    updateTheme({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    });
    setDirty(true);
  };

  // Apply a full mode preset (Light / Dark)
  const applyMode = (m: ThemeMode) => {
    setMode(m);
    pushToStore("mode", m);

    if (m === "LIGHT") {
      const light = {
        backgroundColor: "#ffffff",
        textColor: "#1a1a2e",
        surfaceColor: "#f5f5f7",
        mutedColor: "#6b7280",
      };
      setBackgroundColor(light.backgroundColor);
      setTextColor(light.textColor);
      updateTheme({ mode: m, ...light });
      setDirty(true);
    } else if (m === "DARK") {
      const dark = {
        backgroundColor: "#0f172a",
        textColor: "#f8fafc",
        surfaceColor: "#1e293b",
        mutedColor: "#94a3b8",
      };
      setBackgroundColor(dark.backgroundColor);
      setTextColor(dark.textColor);
      updateTheme({ mode: m, ...dark });
      setDirty(true);
    }
    // CUSTOM: keep current colors, just change mode
  };

  // Helper: update local state + push to store in one call
  const change = (field: string, setter: (v: string) => void, value: string) => {
    setter(value);
    pushToStore(field, value);
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: "1px solid var(--b-border)" }}
      >
        <div className="flex items-center gap-2">
          <Droplets className="h-3.5 w-3.5" style={{ color: "var(--b-accent)" }} />
          <span className="text-[12px] font-semibold" style={{ color: "var(--b-text)" }}>
            Portfolio Style
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-semibold transition-colors"
          style={{
            backgroundColor: "var(--b-accent-soft)",
            color: "var(--b-accent)",
            border: "1px solid var(--b-accent-mid)",
            opacity: saving ? 0.5 : 1,
          }}
        >
          <Save className="h-2.5 w-2.5" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Mode ─────────────────────────────────────────────── */}
        <Section title="Mode">
          <div className="flex gap-1.5">
            {([
              { id: "LIGHT" as ThemeMode, label: "Light", desc: "White background", bg: "#ffffff", fg: "#1a1a2e" },
              { id: "DARK" as ThemeMode, label: "Dark", desc: "Dark background", bg: "#0f172a", fg: "#f8fafc" },
              { id: "CUSTOM" as ThemeMode, label: "Custom", desc: "Your own colors", bg: backgroundColor, fg: textColor },
            ]).map((m) => (
              <button
                key={m.id}
                onClick={() => applyMode(m.id)}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-lg p-2 transition-all"
                style={{
                  backgroundColor: mode === m.id ? "var(--b-accent-soft)" : "var(--b-surface)",
                  border: mode === m.id ? "1px solid var(--b-accent-mid)" : "1px solid var(--b-border)",
                }}
              >
                <div
                  className="h-8 w-full rounded-md"
                  style={{
                    backgroundColor: m.bg,
                    border: "1px solid var(--b-border)",
                  }}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-0.5 px-1">
                    <div className="h-1 w-6 rounded-full" style={{ backgroundColor: m.fg, opacity: 0.8 }} />
                    <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: m.fg, opacity: 0.3 }} />
                  </div>
                </div>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: mode === m.id ? "var(--b-accent)" : "var(--b-text-4)" }}
                >
                  {m.label}
                </span>
              </button>
            ))}
          </div>
          {mode !== "CUSTOM" && (
            <p className="mt-2 text-center text-[9px]" style={{ color: "var(--b-text-4)" }}>
              Switch to Custom for full color control
            </p>
          )}
        </Section>

        {/* ── Presets ──────────────────────────────────────────── */}
        <Section title="Presets">
          <div className="grid grid-cols-3 gap-1.5">
            {COLOR_PRESETS.map((preset) => {
              const isActive =
                primaryColor === preset.primary &&
                secondaryColor === preset.secondary;
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="group flex flex-col items-center gap-1.5 rounded-lg py-2 transition-all"
                  style={{
                    backgroundColor: isActive ? "var(--b-accent-soft)" : "var(--b-surface)",
                    border: isActive
                      ? "1px solid var(--b-accent-mid)"
                      : "1px solid var(--b-border)",
                  }}
                >
                  <div className="flex -space-x-1">
                    <div className="h-4 w-4 rounded-full ring-1 ring-black/20" style={{ backgroundColor: preset.primary }} />
                    <div className="h-4 w-4 rounded-full ring-1 ring-black/20" style={{ backgroundColor: preset.secondary }} />
                    <div className="h-4 w-4 rounded-full ring-1 ring-black/20" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider"
                    style={{ color: isActive ? "var(--b-accent)" : "var(--b-text-4)" }}
                  >
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Colors ──────────────────────────────────────────── */}
        <Section title={mode === "CUSTOM" ? "Colors (Full Control)" : "Accent Colors"}>
          <div className="space-y-2">
            <ColorRow label="Primary" value={primaryColor} onChange={(v) => change("primaryColor", setPrimaryColor, v)} />
            <ColorRow label="Secondary" value={secondaryColor} onChange={(v) => change("secondaryColor", setSecondaryColor, v)} />
            <ColorRow label="Accent" value={accentColor} onChange={(v) => change("accentColor", setAccentColor, v)} />
            {mode === "CUSTOM" && (
              <>
                <div className="my-1.5 h-px" style={{ backgroundColor: "var(--b-border)" }} />
                <ColorRow label="Background" value={backgroundColor} onChange={(v) => change("backgroundColor", setBackgroundColor, v)} />
                <ColorRow label="Text" value={textColor} onChange={(v) => change("textColor", setTextColor, v)} />
              </>
            )}
          </div>
        </Section>

        {/* ── Typography ──────────────────────────────────────── */}
        <Section title="Typography">
          <div className="space-y-2.5">
            <div>
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-4)" }}>
                Heading
              </span>
              <select
                value={fontHeading}
                onChange={(e) => change("fontHeading", setFontHeading, e.target.value)}
                className="h-7 w-full rounded-md border-0 px-2 text-[11px] outline-none"
                style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text)" }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-4)" }}>
                Body
              </span>
              <select
                value={fontBody}
                onChange={(e) => change("fontBody", setFontBody, e.target.value)}
                className="h-7 w-full rounded-md border-0 px-2 text-[11px] outline-none"
                style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text)" }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-4)" }}>
                Border Radius
              </span>
              <input
                type="text"
                value={borderRadius}
                onChange={(e) => change("borderRadius", setBorderRadius, e.target.value)}
                placeholder="0.5rem"
                className="h-7 w-full rounded-md border-0 px-2 text-[11px] outline-none"
                style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text)" }}
              />
            </div>
          </div>
        </Section>

        {/* ── Live Preview ────────────────────────────────────── */}
        <Section title="Preview">
          <div
            className="overflow-hidden rounded-lg p-4"
            style={{ backgroundColor, color: textColor }}
          >
            <div
              className="text-[14px] font-bold"
              style={{ color: primaryColor, fontFamily: fontHeading }}
            >
              Heading
            </div>
            <div
              className="mt-1 text-[11px] leading-relaxed opacity-70"
              style={{ fontFamily: fontBody }}
            >
              Body text preview with your chosen typography.
            </div>
            <div className="mt-3 flex gap-1.5">
              <div
                className="px-3 py-1 text-[10px] font-semibold text-white"
                style={{ backgroundColor: primaryColor, borderRadius }}
              >
                Primary
              </div>
              <div
                className="border px-3 py-1 text-[10px] font-semibold"
                style={{ borderColor: accentColor, color: accentColor, borderRadius }}
              >
                Accent
              </div>
            </div>
            <div className="mt-3 flex gap-1">
              {[primaryColor, secondaryColor, accentColor, backgroundColor, textColor].map((c, i) => (
                <div
                  key={i}
                  className="h-3 w-3 rounded-full ring-1 ring-white/10"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
