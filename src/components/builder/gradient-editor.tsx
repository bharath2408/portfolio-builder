"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import { AdvancedColorInput } from "@/components/builder/color-picker";
import { GRADIENT_PRESETS } from "@/config/constants";
import type { GradientStop, GradientState } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────

let _stopId = 0;
function uid(): string {
  return `gs-${Date.now()}-${++_stopId}`;
}

const RADIAL_POSITIONS = [
  "top left", "top center", "top right",
  "center left", "center center", "center right",
  "bottom left", "bottom center", "bottom right",
] as const;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ─── Parse / Serialize ────────────────────────────────────────────

function parseGradient(css: string | undefined): GradientState {
  const fallback: GradientState = {
    type: "linear",
    angle: 135,
    radialPosition: "center center",
    stops: [
      { id: uid(), color: "#06b6d4", position: 0 },
      { id: uid(), color: "#8b5cf6", position: 100 },
    ],
  };
  if (!css) return fallback;

  const isRadial = css.startsWith("radial-gradient");
  const type = isRadial ? "radial" : "linear";

  // Extract content between parentheses
  const match = css.match(/\(([\s\S]+)\)/);
  if (!match?.[1]) return fallback;

  const inner = match[1];

  let angle = 135;
  let radialPosition = "center center";
  let colorPart: string = inner;

  if (isRadial) {
    // radial-gradient(circle at center center, #aaa 0%, ...)
    const radialMatch = inner.match(/^(?:circle|ellipse)\s+at\s+([^,]+),\s*([\s\S]+)$/);
    if (radialMatch?.[1] && radialMatch[2]) {
      radialPosition = radialMatch[1].trim();
      colorPart = radialMatch[2];
    } else {
      // Try simpler pattern without shape keyword
      const simpleMatch = inner.match(/^at\s+([^,]+),\s*([\s\S]+)$/);
      if (simpleMatch?.[1] && simpleMatch[2]) {
        radialPosition = simpleMatch[1].trim();
        colorPart = simpleMatch[2];
      }
    }
  } else {
    // linear-gradient(135deg, ...)
    const linearMatch = inner.match(/^([\d.]+)deg,\s*([\s\S]+)$/);
    if (linearMatch?.[1] && linearMatch[2]) {
      angle = parseFloat(linearMatch[1]);
      colorPart = linearMatch[2];
    }
  }

  // Parse color stops: "#hex 50%, rgba(...) 100%"
  const stopRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)\s+([\d.]+)%/g;
  const stops: GradientStop[] = [];
  let m: RegExpExecArray | null;
  while ((m = stopRegex.exec(colorPart)) !== null) {
    stops.push({ id: uid(), color: m[1]!, position: parseFloat(m[2]!) });
  }

  if (stops.length < 2) return fallback;
  return { type, angle, radialPosition, stops };
}

function serializeGradient(state: GradientState): string {
  const sorted = [...state.stops].sort((a, b) => a.position - b.position);
  const colorStops = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");

  if (state.type === "radial") {
    return `radial-gradient(circle at ${state.radialPosition}, ${colorStops})`;
  }
  return `linear-gradient(${state.angle}deg, ${colorStops})`;
}

// ─── Component ────────────────────────────────────────────────────

interface GradientEditorProps {
  value: string | undefined;
  onChange: (css: string | undefined) => void;
}

export function GradientEditor({ value, onChange }: GradientEditorProps) {
  const [state, setState] = useState<GradientState>(() => parseGradient(value));
  const [selectedStopId, setSelectedStopId] = useState<string>(
    () => state.stops[0]?.id ?? ""
  );
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<string | null>(null);

  // Sync external value changes
  useEffect(() => {
    const parsed = parseGradient(value);
    setState(parsed);
    setSelectedStopId((prev) => {
      if (parsed.stops.find((s) => s.id === prev)) return prev;
      return parsed.stops[0]?.id ?? "";
    });
  }, [value]);

  const emit = useCallback(
    (next: GradientState) => {
      setState(next);
      onChange(serializeGradient(next));
    },
    [onChange]
  );

  const selectedStop = state.stops.find((s) => s.id === selectedStopId);

  // ── Drag logic ───────────────────────────────────────────────
  const getPositionFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const bar = barRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      return clamp(Math.round((x / rect.width) * 100), 0, 100);
    },
    []
  );

  const handlePointerDown = useCallback(
    (stopId: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = stopId;
      setSelectedStopId(stopId);

      const onMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        const pos = getPositionFromEvent(ev);
        setState((prev) => {
          const next = {
            ...prev,
            stops: prev.stops.map((s) =>
              s.id === draggingRef.current ? { ...s, position: pos } : s
            ),
          };
          onChange(serializeGradient(next));
          return next;
        });
      };
      const onUp = () => {
        draggingRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [getPositionFromEvent, onChange]
  );

  // Add stop on bar click
  const handleBarClick = useCallback(
    (e: React.MouseEvent) => {
      // Ignore if we clicked on a stop handle
      if ((e.target as HTMLElement).closest("[data-stop]")) return;
      if (state.stops.length >= 6) return;
      const pos = getPositionFromEvent(e);
      const newStop: GradientStop = { id: uid(), color: "#ffffff", position: pos };
      const next = { ...state, stops: [...state.stops, newStop] };
      setSelectedStopId(newStop.id);
      emit(next);
    },
    [state, getPositionFromEvent, emit]
  );

  const removeStop = useCallback(
    (stopId: string) => {
      if (state.stops.length <= 2) return;
      const next = {
        ...state,
        stops: state.stops.filter((s) => s.id !== stopId),
      };
      if (selectedStopId === stopId) {
        setSelectedStopId(next.stops[0]?.id ?? "");
      }
      emit(next);
    },
    [state, selectedStopId, emit]
  );

  const updateStopColor = useCallback(
    (color: string) => {
      if (!selectedStopId) return;
      const next = {
        ...state,
        stops: state.stops.map((s) =>
          s.id === selectedStopId ? { ...s, color } : s
        ),
      };
      emit(next);
    },
    [state, selectedStopId, emit]
  );

  const setType = useCallback(
    (type: "linear" | "radial") => {
      emit({ ...state, type });
    },
    [state, emit]
  );

  const setAngle = useCallback(
    (angle: number) => {
      emit({ ...state, angle });
    },
    [state, emit]
  );

  const setRadialPosition = useCallback(
    (pos: string) => {
      emit({ ...state, radialPosition: pos });
    },
    [state, emit]
  );

  const applyPreset = useCallback(
    (css: string) => {
      const parsed = parseGradient(css);
      setSelectedStopId(parsed.stops[0]?.id ?? "");
      emit(parsed);
    },
    [emit]
  );

  const cssOutput = serializeGradient(state);

  return (
    <div className="space-y-3">
      {/* ── Preview bar with stops ──────────────────────────── */}
      <div>
        <div
          ref={barRef}
          onClick={handleBarClick}
          className="relative h-8 cursor-crosshair rounded-md"
          style={{
            background: cssOutput,
            border: "1px solid var(--b-border)",
          }}
        >
          {state.stops.map((stop) => (
            <div
              key={stop.id}
              data-stop
              onMouseDown={handlePointerDown(stop.id)}
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full"
              style={{
                left: `${stop.position}%`,
                backgroundColor: stop.color,
                border:
                  stop.id === selectedStopId
                    ? "2px solid var(--b-accent)"
                    : "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
            />
          ))}
        </div>
        <p
          className="mt-1 text-[9px]"
          style={{ color: "var(--b-text-4)" }}
        >
          Click bar to add stop ({state.stops.length}/6)
        </p>
      </div>

      {/* ── Type toggle ────────────────────────────────────── */}
      <div>
        <div
          className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--b-text-4)" }}
        >
          Type
        </div>
        <div className="flex gap-1">
          {(["linear", "radial"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="flex-1 rounded px-2 py-1 text-[10px] font-semibold capitalize transition-colors"
              style={{
                backgroundColor:
                  state.type === t
                    ? "var(--b-accent-soft)"
                    : "var(--b-surface)",
                color:
                  state.type === t ? "var(--b-accent)" : "var(--b-text-4)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Angle slider (linear) ──────────────────────────── */}
      {state.type === "linear" && (
        <div>
          <div
            className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--b-text-4)" }}
          >
            Angle
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={360}
              value={state.angle}
              onChange={(e) => setAngle(parseInt(e.target.value, 10))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full"
              style={{ accentColor: "var(--b-accent)" }}
            />
            <span
              className="w-8 text-right text-[10px] font-medium tabular-nums"
              style={{ color: "var(--b-text-3)" }}
            >
              {state.angle}°
            </span>
          </div>
        </div>
      )}

      {/* ── Radial position picker ─────────────────────────── */}
      {state.type === "radial" && (
        <div>
          <div
            className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--b-text-4)" }}
          >
            Position
          </div>
          <div className="grid grid-cols-3 gap-1">
            {RADIAL_POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setRadialPosition(pos)}
                className="flex h-6 items-center justify-center rounded transition-colors"
                style={{
                  backgroundColor:
                    state.radialPosition === pos
                      ? "var(--b-accent-soft)"
                      : "var(--b-surface)",
                  border:
                    state.radialPosition === pos
                      ? "1px solid var(--b-accent-mid)"
                      : "1px solid var(--b-border)",
                }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      state.radialPosition === pos
                        ? "var(--b-accent)"
                        : "var(--b-text-4)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Selected stop color ────────────────────────────── */}
      {selectedStop && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--b-text-4)" }}
            >
              Stop Color
            </span>
            {state.stops.length > 2 && (
              <button
                onClick={() => removeStop(selectedStopId)}
                className="rounded p-0.5 transition-colors hover:brightness-110"
                style={{ color: "var(--b-danger)" }}
                title="Remove stop"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <AdvancedColorInput
            value={selectedStop.color}
            onChange={updateStopColor}
          />
        </div>
      )}

      {/* ── Presets ────────────────────────────────────────── */}
      <div>
        <div
          className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--b-text-4)" }}
        >
          Presets
        </div>
        <div className="grid grid-cols-4 gap-1">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.value)}
              className="group relative h-6 rounded transition-transform hover:scale-105"
              style={{
                background: preset.value,
                border: "1px solid var(--b-border)",
              }}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* ── CSS output ─────────────────────────────────────── */}
      <div>
        <div
          className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--b-text-4)" }}
        >
          CSS
        </div>
        <div
          className="select-all rounded p-1.5 text-[9px] leading-relaxed break-all"
          style={{
            backgroundColor: "var(--b-surface)",
            color: "var(--b-text-3)",
            border: "1px solid var(--b-border)",
          }}
        >
          {cssOutput}
        </div>
      </div>
    </div>
  );
}
