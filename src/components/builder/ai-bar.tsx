"use client";

import { Loader2, Sparkles, ArrowUp, X, Wand2, Check, AlertCircle } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

interface AiBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export function AiBar({ onGenerate, isGenerating }: AiBarProps) {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "ai"; text: string; status?: "success" | "error" }>>([]);
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll history to bottom
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    const text = prompt.trim();
    setHistory((prev) => [...prev, { role: "user", text }]);
    setPrompt("");
    setExpanded(true);
    try {
      await onGenerate(text);
      setHistory((prev) => [...prev, { role: "ai", text: "Design applied to canvas", status: "success" }]);
    } catch {
      setHistory((prev) => [...prev, { role: "ai", text: "Generation failed — try rephrasing", status: "error" }]);
    }
  }, [prompt, isGenerating, onGenerate]);

  const clearHistory = () => {
    setHistory([]);
    setExpanded(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className="absolute bottom-[72px] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center"
      style={{
        width: "min(640px, calc(100% - 100px))",
        transition: "opacity 0.2s ease",
      }}
    >
      {/* ── Conversation History ──────────────────────────── */}
      {expanded && history.length > 0 && (
        <div
          ref={historyRef}
          className="mb-2.5 w-full max-h-[220px] overflow-y-auto rounded-2xl px-4 py-3"
          style={{
            backgroundColor: "rgba(from var(--b-panel) r g b / 0.92)",
            border: "1px solid var(--b-border)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            animation: "aiHistorySlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wand2 className="h-3 w-3" style={{ color: "var(--b-accent)" }} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--b-text-4)" }}>
                Vibe Session
              </span>
            </div>
            <button
              onClick={clearHistory}
              className="flex h-5 w-5 items-center justify-center rounded-md transition-colors"
              style={{ color: "var(--b-text-4)" }}
              title="Clear conversation"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            {history.map((msg, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5"
                style={{ animation: `aiFadeIn 0.2s ease ${i * 0.05}s both` }}
              >
                {/* Role indicator */}
                <div
                  className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
                  style={{
                    backgroundColor: msg.role === "user"
                      ? "var(--b-accent-soft)"
                      : msg.status === "error"
                        ? "rgba(244,63,94,0.1)"
                        : "rgba(16,185,129,0.1)",
                  }}
                >
                  {msg.role === "user" ? (
                    <Sparkles className="h-2 w-2" style={{ color: "var(--b-accent)" }} />
                  ) : msg.status === "error" ? (
                    <AlertCircle className="h-2 w-2" style={{ color: "#f43f5e" }} />
                  ) : (
                    <Check className="h-2 w-2" style={{ color: "#10b981" }} />
                  )}
                </div>
                <span
                  className="text-[11px] leading-relaxed"
                  style={{
                    color: msg.role === "user" ? "var(--b-text)" : "var(--b-text-3)",
                    fontStyle: msg.role === "ai" ? "italic" : "normal",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}

            {/* Generating indicator */}
            {isGenerating && (
              <div className="flex items-center gap-2.5" style={{ animation: "aiFadeIn 0.2s ease both" }}>
                <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: "var(--b-accent-soft)" }}>
                  <Loader2 className="h-2 w-2 animate-spin" style={{ color: "var(--b-accent)" }} />
                </div>
                <span className="text-[11px] italic" style={{ color: "var(--b-text-4)" }}>
                  Generating design...
                </span>
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      className="h-1 w-1 rounded-full"
                      style={{
                        backgroundColor: "var(--b-accent)",
                        animation: `aiDotPulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Input Bar ────────────────────────────────────── */}
      <div
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200"
        style={{
          backgroundColor: "rgba(from var(--b-panel) r g b / 0.88)",
          border: focused
            ? "1px solid var(--b-accent-mid)"
            : "1px solid var(--b-border)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: focused
            ? "0 8px 40px rgba(0,0,0,0.25), 0 0 0 1px var(--b-accent-mid), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Icon */}
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-200"
          style={{
            background: isGenerating
              ? "linear-gradient(135deg, var(--b-accent), #0891b2)"
              : "var(--b-accent-soft)",
            transform: isGenerating ? "scale(1.05)" : "scale(1)",
          }}
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--b-accent)" }} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={
            isGenerating
              ? "Designing your portfolio..."
              : history.length > 0
                ? "Refine — e.g. 'make the heading bigger'..."
                : "Describe your portfolio vibe..."
          }
          disabled={isGenerating}
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:transition-colors"
          style={{
            color: "var(--b-text)",
            caretColor: "var(--b-accent)",
          }}
        />

        {/* Keyboard hint or submit */}
        {!prompt.trim() && !isGenerating ? (
          <div
            className="flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5"
            style={{ backgroundColor: "var(--b-surface)", border: "1px solid var(--b-border)" }}
          >
            <span className="text-[9px] font-mono font-medium" style={{ color: "var(--b-text-4)" }}>
              Enter
            </span>
          </div>
        ) : !isGenerating ? (
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, var(--b-accent), #0891b2)",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(6,182,212,0.3)",
            }}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* ── CSS Animations ───────────────────────────────── */}
      <style jsx>{`
        @keyframes aiHistorySlide {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes aiFadeIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes aiDotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
