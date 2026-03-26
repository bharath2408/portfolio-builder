"use client";

import { memo, useEffect, useRef } from "react";

import type { CanvasTransform } from "./canvas-engine";

const RULER_SIZE = 24;
const TICK_COLOR = "rgba(148,163,184,0.45)";
const LABEL_COLOR = "rgba(148,163,184,0.7)";
const BG_COLOR = "var(--b-surface, #1e293b)";
const BORDER_COLOR = "var(--b-border, rgba(148,163,184,0.1))";

function getTickInterval(scale: number): { major: number; minor: number } {
  const base = 100 / scale;
  if (base > 800) return { major: 1000, minor: 200 };
  if (base > 400) return { major: 500, minor: 100 };
  if (base > 150) return { major: 200, minor: 50 };
  if (base > 60) return { major: 100, minor: 20 };
  if (base > 25) return { major: 50, minor: 10 };
  return { major: 20, minor: 5 };
}

// ── Horizontal Ruler ──────────────────────────────────────────────

export const HorizontalRuler = memo(function HorizontalRuler({
  transform,
  width,
}: {
  transform: CanvasTransform;
  width: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = RULER_SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, RULER_SIZE);

    const { major, minor } = getTickInterval(transform.scale);

    // Calculate visible range in canvas space
    const startX = -transform.x / transform.scale;
    const endX = (width - transform.x) / transform.scale;

    // Round to minor interval
    const firstTick = Math.floor(startX / minor) * minor;

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let canvasX = firstTick; canvasX <= endX; canvasX += minor) {
      const screenX = canvasX * transform.scale + transform.x;
      if (screenX < 0 || screenX > width) continue;

      const isMajor = Math.abs(canvasX % major) < 0.01;

      ctx.beginPath();
      ctx.moveTo(screenX, isMajor ? 0 : RULER_SIZE * 0.6);
      ctx.lineTo(screenX, RULER_SIZE);
      ctx.strokeStyle = TICK_COLOR;
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = LABEL_COLOR;
        ctx.font = "9px -apple-system, sans-serif";
        ctx.fillText(String(Math.round(canvasX)), screenX, 2);
      }
    }
  }, [transform, width]);

  return (
    <div
      className="absolute left-0 top-0 z-[5]"
      style={{
        height: RULER_SIZE,
        width,
        marginLeft: RULER_SIZE,
        background: BG_COLOR,
        borderBottom: `1px solid ${BORDER_COLOR}`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: RULER_SIZE }}
      />
    </div>
  );
});

// ── Vertical Ruler ────────────────────────────────────────────────

export const VerticalRuler = memo(function VerticalRuler({
  transform,
  height,
}: {
  transform: CanvasTransform;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = RULER_SIZE * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, RULER_SIZE, height);

    const { major, minor } = getTickInterval(transform.scale);

    const startY = -transform.y / transform.scale;
    const endY = (height - transform.y) / transform.scale;
    const firstTick = Math.floor(startY / minor) * minor;

    for (let canvasY = firstTick; canvasY <= endY; canvasY += minor) {
      const screenY = canvasY * transform.scale + transform.y;
      if (screenY < 0 || screenY > height) continue;

      const isMajor = Math.abs(canvasY % major) < 0.01;

      ctx.beginPath();
      ctx.moveTo(isMajor ? 0 : RULER_SIZE * 0.6, screenY);
      ctx.lineTo(RULER_SIZE, screenY);
      ctx.strokeStyle = TICK_COLOR;
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.stroke();

      if (isMajor) {
        ctx.save();
        ctx.fillStyle = LABEL_COLOR;
        ctx.font = "9px -apple-system, sans-serif";
        ctx.translate(2, screenY);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(String(Math.round(canvasY)), 0, 0);
        ctx.restore();
      }
    }
  }, [transform, height]);

  return (
    <div
      className="absolute left-0 top-0 z-[5]"
      style={{
        width: RULER_SIZE,
        height,
        marginTop: RULER_SIZE,
        background: BG_COLOR,
        borderRight: `1px solid ${BORDER_COLOR}`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: RULER_SIZE, height: "100%" }}
      />
    </div>
  );
});

// ── Corner Square (top-left where rulers meet) ────────────────────

export const RulerCorner = memo(function RulerCorner() {
  return (
    <div
      className="absolute left-0 top-0 z-[6]"
      style={{
        width: RULER_SIZE,
        height: RULER_SIZE,
        background: BG_COLOR,
        borderRight: `1px solid ${BORDER_COLOR}`,
        borderBottom: `1px solid ${BORDER_COLOR}`,
      }}
    />
  );
});
