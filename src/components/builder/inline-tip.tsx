"use client";

import { Lightbulb, X } from "lucide-react";

import { useHelpStore } from "@/stores/help-store";

interface InlineTipProps {
  id: string;
  children: React.ReactNode;
}

export function InlineTip({ id, children }: InlineTipProps) {
  const dismissed = useHelpStore((s) => s.dismissedTips[id]);
  const dismissTip = useHelpStore((s) => s.dismissTip);

  if (dismissed) return null;

  return (
    <div
      className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-[10px] leading-relaxed"
      style={{
        backgroundColor: "var(--b-accent-soft, rgba(20,184,166,0.08))",
        color: "var(--b-accent, #14b8a6)",
      }}
    >
      <Lightbulb className="mt-0.5 h-3 w-3 flex-shrink-0 opacity-70" />
      <span className="flex-1 font-medium">{children}</span>
      <button
        onClick={() => dismissTip(id)}
        className="mt-0.5 flex-shrink-0 opacity-50 transition-opacity hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
