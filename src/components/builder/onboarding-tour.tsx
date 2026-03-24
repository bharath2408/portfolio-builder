"use client";

import { ArrowRight, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { apiPatch } from "@/lib/api";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "right" | "left" | "bottom" | "top";
}

const ALL_STEPS: TourStep[] = [
  {
    target: "[data-tour='top-bar']",
    title: "Welcome to the Studio!",
    description: "This is your command center. Save, undo/redo, preview, publish, and switch device views — all from this top bar.",
    position: "bottom",
  },
  {
    target: "[data-tour='left-panel']",
    title: "Layers & Elements",
    description: "Manage your sections in the Layers tab, or switch to Elements to browse 25+ block types you can add to your portfolio.",
    position: "right",
  },
  {
    target: "[data-tour='canvas']",
    title: "Your Canvas",
    description: "This is where your portfolio takes shape. Click blocks to select them, drag to move, and use scroll to zoom in and out.",
    position: "bottom",
  },
  {
    target: "[data-tour='right-panel']",
    title: "Properties Panel",
    description: "Select any block to edit its content, style, spacing, animations, and more. Every visual property is customizable here.",
    position: "left",
  },
];

export function OnboardingTour({ dropdownColors }: {
  dropdownColors: { bg: string; border: string; text: string; textMuted: string; hover: string; separator: string };
}) {
  const [hasCompleted, setHasCompleted] = useState(true); // default true to hide until loaded
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);

  // Fetch onboarding status from DB
  useEffect(() => {
    let cancelled = false;
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setHasCompleted(!!json?.data?.onboardingDone);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Delay showing tour, then filter steps to only those with elements in the DOM
  useEffect(() => {
    if (hasCompleted) return;
    const timer = setTimeout(() => {
      const available = ALL_STEPS.filter((s) => !!document.querySelector(s.target));
      if (available.length > 0) {
        setSteps(available);
        setVisible(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [hasCompleted]);

  const updateRect = useCallback(() => {
    const s = steps[step];
    if (!s) return;
    const el = document.querySelector(s.target);
    if (el) setRect(el.getBoundingClientRect());
  }, [step, steps]);

  useEffect(() => {
    if (!visible || hasCompleted || steps.length === 0) return;
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [visible, hasCompleted, updateRect, steps]);

  const completeOnboarding = useCallback(() => {
    setHasCompleted(true);
    apiPatch("/users/me", { onboardingDone: true }).catch(() => {});
  }, []);

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const skip = () => {
    completeOnboarding();
  };

  if (hasCompleted || !visible || !rect || steps.length === 0) return null;

  const currentStep = steps[step];
  if (!currentStep) return null;
  const pad = 8;

  // Calculate tooltip card position
  const cardStyle: React.CSSProperties = { position: "fixed", zIndex: 602, width: 280 };
  if (currentStep.position === "right") {
    cardStyle.left = rect.right + 16;
    cardStyle.top = rect.top + rect.height / 2 - 60;
  } else if (currentStep.position === "left") {
    cardStyle.right = window.innerWidth - rect.left + 16;
    cardStyle.top = rect.top + rect.height / 2 - 60;
  } else if (currentStep.position === "bottom") {
    const belowY = rect.bottom + 16;
    if (belowY + 180 > window.innerHeight) {
      cardStyle.left = rect.left + rect.width / 2 - 140;
      cardStyle.top = rect.top + rect.height / 2 - 90;
    } else {
      cardStyle.left = rect.left + rect.width / 2 - 140;
      cardStyle.top = belowY;
    }
  } else {
    cardStyle.left = rect.left + rect.width / 2 - 140;
    cardStyle.bottom = window.innerHeight - rect.top + 16;
  }

  return (
    <>
      {/* Overlay with cutout */}
      <div
        className="fixed inset-0 z-[600] transition-all duration-300"
        style={{
          boxShadow: `0 0 0 9999px rgba(0,0,0,0.55)`,
          clipPath: `polygon(
            0% 0%, 0% 100%,
            ${rect.left - pad}px 100%,
            ${rect.left - pad}px ${rect.top - pad}px,
            ${rect.right + pad}px ${rect.top - pad}px,
            ${rect.right + pad}px ${rect.bottom + pad}px,
            ${rect.left - pad}px ${rect.bottom + pad}px,
            ${rect.left - pad}px 100%,
            100% 100%, 100% 0%
          )`,
        }}
        onClick={skip}
      />

      {/* Highlight border */}
      <div
        className="pointer-events-none fixed z-[601] rounded-lg border-2 border-teal-400/60 transition-all duration-300"
        style={{
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: "0 0 20px rgba(20,184,166,0.2)",
        }}
      />

      {/* Tooltip card */}
      <div
        className="overflow-hidden rounded-xl"
        style={{
          ...cardStyle,
          backgroundColor: dropdownColors.bg,
          border: `1px solid ${dropdownColors.border}`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        }}
      >
        <div className="px-4 pt-4">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-bold" style={{ color: dropdownColors.text }}>
              {currentStep.title}
            </p>
            <button onClick={skip} className="opacity-50 hover:opacity-100" style={{ color: dropdownColors.textMuted }}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: dropdownColors.textMuted }}>
            {currentStep.description}
          </p>
        </div>
        <div
          className="mt-3 flex items-center justify-between px-4 py-3"
          style={{ borderTop: `1px solid ${dropdownColors.separator}` }}
        >
          <span className="text-[10px] font-medium" style={{ color: dropdownColors.textMuted }}>
            {step + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={skip}
              className="rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors hover:opacity-80"
              style={{ color: dropdownColors.textMuted }}
            >
              Skip
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-white transition-all hover:brightness-110"
              style={{ backgroundColor: "var(--b-accent, #14b8a6)" }}
            >
              {step === steps.length - 1 ? "Done" : "Next"}
              {step < steps.length - 1 && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
