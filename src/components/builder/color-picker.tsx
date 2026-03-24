"use client";

import { Pipette, X } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

// ─── Color conversion utilities ─────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}

function normalizeHex(hex: string): string {
  if (!hex.startsWith("#")) hex = `#${hex}`;
  if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return hex.toLowerCase();
}

// ─── Theme color swatches ────────────────────────────────────────

const THEME_TOKENS = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Accent", value: "accent" },
  { label: "Text", value: "text" },
  { label: "Muted", value: "muted" },
  { label: "Surface", value: "surface" },
  { label: "Background", value: "background" },
];

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
  "#ffffff", "#f5f5f4", "#a8a29e", "#57534e", "#1c1917",
  "#000000",
];

// ─── Recent colors (persisted in localStorage) ───────────────────

const RECENT_KEY = "foliocraft-recent-colors";
const MAX_RECENT = 8;

function getRecentColors(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch { return []; }
}

function addRecentColor(color: string) {
  if (!isValidHex(color)) return;
  const recent = getRecentColors().filter((c) => c !== color);
  recent.unshift(color);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

// ─── Component ───────────────────────────────────────────────────

interface AdvancedColorInputProps {
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function AdvancedColorInput({ value, onChange, placeholder }: AdvancedColorInputProps) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const [hexInput, setHexInput] = useState(value ?? "");
  const [hsl, setHsl] = useState<[number, number, number]>(() => {
    if (value && isValidHex(value)) return hexToHsl(value);
    return [180, 70, 50];
  });
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const satAreaRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setHexInput(value ?? "");
    if (value && isValidHex(value)) {
      setHsl(hexToHsl(value));
    }
  }, [value]);

  useEffect(() => {
    if (open) setRecentColors(getRecentColors());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const applyColor = useCallback((hex: string) => {
    onChange(hex);
    setHexInput(hex);
    if (isValidHex(hex)) {
      setHsl(hexToHsl(hex));
      addRecentColor(hex);
      setRecentColors(getRecentColors());
    }
  }, [onChange]);

  const applyToken = useCallback((token: string) => {
    onChange(token);
    setHexInput(token);
    setOpen(false);
  }, [onChange]);

  const handleHueChange = (newHue: number) => {
    const newHsl: [number, number, number] = [newHue, hsl[1], hsl[2]];
    setHsl(newHsl);
    applyColor(hslToHex(newHsl[0], newHsl[1], newHsl[2]));
  };

  const handleSatLightChange = (s: number, l: number) => {
    const newHsl: [number, number, number] = [hsl[0], s, l];
    setHsl(newHsl);
    applyColor(hslToHex(newHsl[0], newHsl[1], newHsl[2]));
  };

  const handleSatAreaMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = satAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const s = Math.round((x / rect.width) * 100);
    const l = Math.round(100 - (y / rect.height) * 100);
    handleSatLightChange(s, l);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsl[0]]);

  const handleSatAreaDown = (e: React.MouseEvent) => {
    handleSatAreaMouse(e);
    const onMove = (ev: MouseEvent) => handleSatAreaMouse(ev);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Eyedropper (Browser EyeDropper API)
  const pickFromScreen = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) applyColor(result.sRGBHex);
    } catch {
      // User cancelled or API not supported
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in (window as any);

  // Smart positioning — open above if not enough space below
  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenAbove(spaceBelow < 420);
    }
    setOpen(!open);
  };

  const displayColor = value && isValidHex(value) ? value : (value?.startsWith("#") ? value : "#888888");
  const isToken = value && !value.startsWith("#") && THEME_TOKENS.some((t) => t.value === value);

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger */}
      <div className="flex items-center gap-2" ref={triggerRef}>
        <button
          type="button"
          onClick={toggleOpen}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border transition-colors"
          style={{
            borderColor: "var(--b-border)",
            backgroundColor: isToken ? "var(--b-surface)" : displayColor,
          }}
        >
          {isToken && (
            <Pipette className="h-3 w-3" style={{ color: "var(--b-text-3)" }} />
          )}
        </button>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => {
            setHexInput(e.target.value);
            const v = e.target.value;
            if (isValidHex(normalizeHex(v))) applyColor(normalizeHex(v));
            else if (THEME_TOKENS.some((t) => t.value === v)) applyToken(v);
          }}
          onBlur={() => {
            if (hexInput && isValidHex(normalizeHex(hexInput))) {
              applyColor(normalizeHex(hexInput));
            }
          }}
          placeholder={placeholder}
          className="h-7 flex-1 rounded-md border px-2.5 font-mono text-[11px] outline-none transition-colors focus:border-[var(--b-accent)]"
          style={{ backgroundColor: "var(--b-surface)", borderColor: "var(--b-border)", color: "var(--b-text)" }}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setHexInput(""); }}
            className="flex h-5 w-5 items-center justify-center rounded opacity-40 hover:opacity-100"
            style={{ color: "var(--b-text-3)" }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Popover */}
      {open && (
        <div
          className={`absolute left-0 z-[100] w-[240px] overflow-hidden rounded-xl border shadow-xl ${openAbove ? "bottom-full mb-2" : "top-full mt-2"}`}
          style={{
            backgroundColor: "var(--b-panel, var(--b-bg))",
            borderColor: "var(--b-border)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
          }}
        >
          {/* Saturation / Lightness area */}
          <div
            ref={satAreaRef}
            className="relative h-[140px] cursor-crosshair"
            style={{
              background: `
                linear-gradient(to top, #000, transparent),
                linear-gradient(to right, #fff, hsl(${hsl[0]}, 100%, 50%))
              `,
            }}
            onMouseDown={handleSatAreaDown}
          >
            {/* Picker dot */}
            <div
              className="pointer-events-none absolute h-3.5 w-3.5 rounded-full border-2 border-white"
              style={{
                left: `${hsl[1]}%`,
                top: `${100 - hsl[2]}%`,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                backgroundColor: hslToHex(hsl[0], hsl[1], hsl[2]),
              }}
            />
          </div>

          {/* Hue slider */}
          <div className="px-3 pt-3">
            <input
              type="range"
              min={0}
              max={360}
              value={hsl[0]}
              onChange={(e) => handleHueChange(Number(e.target.value))}
              className="hue-slider h-2.5 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
              }}
            />
          </div>

          {/* Theme tokens */}
          <div className="px-3 pt-3">
            <p className="mb-1.5 text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--b-text-4)" }}>
              Theme Colors
            </p>
            <div className="flex flex-wrap gap-1">
              {THEME_TOKENS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => applyToken(t.value)}
                  className="rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors"
                  style={{
                    backgroundColor: value === t.value ? "var(--b-accent-soft)" : "var(--b-surface)",
                    color: value === t.value ? "var(--b-accent)" : "var(--b-text-3)",
                    border: `1px solid ${value === t.value ? "var(--b-accent)" : "var(--b-border)"}`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preset colors */}
          <div className="px-3 pt-3">
            <p className="mb-1.5 text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--b-text-4)" }}>
              Presets
            </p>
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => applyColor(c)}
                  className="h-5 w-5 rounded-md border transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: c === "#ffffff" || c === "#f5f5f4" ? "var(--b-border)" : "transparent",
                    outline: value === c ? "2px solid var(--b-accent)" : "none",
                    outlineOffset: 1,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recent colors */}
          {recentColors.length > 0 && (
            <div className="px-3 pt-3">
              <p className="mb-1.5 text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--b-text-4)" }}>
                Recent
              </p>
              <div className="flex gap-1">
                {recentColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => applyColor(c)}
                    className="h-5 w-5 rounded-md border transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: "transparent" }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Current color preview + hex + eyedropper */}
          <div className="flex items-center gap-2 p-3">
            <div
              className="h-6 w-6 flex-shrink-0 rounded-md border"
              style={{ backgroundColor: hslToHex(hsl[0], hsl[1], hsl[2]), borderColor: "var(--b-border)" }}
            />
            <span className="font-mono text-[10px]" style={{ color: "var(--b-text-2)" }}>
              {hslToHex(hsl[0], hsl[1], hsl[2]).toUpperCase()}
            </span>
            <span className="flex-1 text-[9px]" style={{ color: "var(--b-text-4)" }}>
              H:{hsl[0]} S:{hsl[1]} L:{hsl[2]}
            </span>
            {hasEyeDropper && (
              <button
                type="button"
                onClick={pickFromScreen}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors"
                style={{ backgroundColor: "var(--b-surface)", color: "var(--b-text-3)" }}
                title="Pick color from screen"
              >
                <Pipette className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
