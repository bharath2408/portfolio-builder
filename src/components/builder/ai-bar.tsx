"use client";

import { Loader2, Sparkles, Send, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface AiBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export function AiBar({ onGenerate, isGenerating }: AiBarProps) {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    const text = prompt.trim();
    setHistory((prev) => [...prev, { role: "user", text }]);
    setPrompt("");
    setExpanded(true);
    try {
      await onGenerate(text);
      setHistory((prev) => [...prev, { role: "ai", text: "Design applied to canvas" }]);
    } catch {
      setHistory((prev) => [...prev, { role: "ai", text: "Failed to generate. Try again." }]);
    }
  }, [prompt, isGenerating, onGenerate]);

  return (
    <div
      className="absolute bottom-[72px] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center"
      style={{ width: "min(600px, calc(100% - 80px))" }}
    >
      {/* History */}
      {expanded && history.length > 0 && (
        <div
          className="mb-2 w-full max-h-[200px] overflow-y-auto rounded-xl p-3 space-y-2"
          style={{
            backgroundColor: "var(--b-panel)",
            border: "1px solid var(--b-border)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--b-text-4)" }}>Conversation</span>
            <button onClick={() => { setHistory([]); setExpanded(false); }} style={{ color: "var(--b-text-4)" }}>
              <X className="h-3 w-3" />
            </button>
          </div>
          {history.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "" : ""}`}>
              <span className="flex-shrink-0 text-[9px] font-bold uppercase" style={{ color: msg.role === "user" ? "var(--b-accent)" : "var(--b-success)", width: 24 }}>
                {msg.role === "user" ? "You" : "AI"}
              </span>
              <span className="text-[11px] leading-relaxed" style={{ color: "var(--b-text-2)" }}>
                {msg.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 shadow-xl"
        style={{
          backgroundColor: "var(--b-panel)",
          border: "1px solid var(--b-border-active)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: "var(--b-accent)" }} />
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder={history.length > 0 ? "Refine the design..." : "Describe your portfolio vibe..."}
          disabled={isGenerating}
          className="flex-1 bg-transparent text-[13px] outline-none"
          style={{ color: "var(--b-text)", caretColor: "var(--b-accent)" }}
        />
        {isGenerating ? (
          <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" style={{ color: "var(--b-accent)" }} />
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-30"
            style={{ backgroundColor: "var(--b-accent)", color: "#fff" }}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
