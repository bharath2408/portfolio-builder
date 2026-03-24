"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { SHORTCUTS, SHORTCUT_CATEGORIES } from "@/config/shortcuts";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  dropdownColors: {
    bg: string;
    border: string;
    text: string;
    textMuted: string;
    hover: string;
    separator: string;
  };
}

export function KeyboardShortcutsModal({ open, onClose, dropdownColors }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const grouped = Object.entries(SHORTCUT_CATEGORIES).map(([key, title]) => ({
    title,
    shortcuts: SHORTCUTS.filter((s) => s.category === key),
  }));

  return (
    <>
      <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 z-[301] w-[540px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl"
        style={{
          backgroundColor: dropdownColors.bg,
          border: `1px solid ${dropdownColors.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${dropdownColors.separator}` }}
        >
          <h2 className="text-[15px] font-bold" style={{ color: dropdownColors.text }}>
            Keyboard Shortcuts
          </h2>
          <button onClick={onClose} style={{ color: dropdownColors.textMuted }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {grouped.map((group) => (
            <div key={group.title} className="mb-4 last:mb-0">
              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: dropdownColors.textMuted }}
              >
                {group.title}
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5">
                    <span className="text-[12px]" style={{ color: dropdownColors.textMuted }}>
                      {s.label}
                    </span>
                    <kbd
                      className="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold"
                      style={{
                        backgroundColor: dropdownColors.hover,
                        color: dropdownColors.text,
                        border: `1px solid ${dropdownColors.separator}`,
                      }}
                    >
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
