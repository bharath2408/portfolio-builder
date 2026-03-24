"use client";

import { FileText, Edit, Eye, Wrench, Plus, HelpCircle, Search, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { COMMANDS, COMMAND_CATEGORIES, type CommandDefinition } from "@/config/commands";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onExecute: (commandId: string) => void;
  dropdownColors: {
    bg: string;
    border: string;
    text: string;
    textMuted: string;
    hover: string;
    separator: string;
  };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  file: <FileText className="h-3 w-3" />,
  edit: <Edit className="h-3 w-3" />,
  view: <Eye className="h-3 w-3" />,
  tools: <Wrench className="h-3 w-3" />,
  add: <Plus className="h-3 w-3" />,
  help: <HelpCircle className="h-3 w-3" />,
};

export function CommandPalette({ open, onClose, onExecute, dropdownColors }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.keywords?.some((k) => k.includes(q)),
    );
  }, [query]);

  // Group filtered commands by category
  const grouped = useMemo(() => {
    const groups: { category: string; title: string; commands: CommandDefinition[] }[] = [];
    const catOrder = ["file", "edit", "view", "tools", "add", "help"];
    for (const cat of catOrder) {
      const cmds = filtered.filter((c) => c.category === cat);
      if (cmds.length > 0) {
        groups.push({ category: cat, title: COMMAND_CATEGORIES[cat] ?? cat, commands: cmds });
      }
    }
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => grouped.flatMap((g) => g.commands), [grouped]);

  const execute = useCallback(
    (cmd: CommandDefinition) => {
      onExecute(cmd.id);
      onClose();
      setQuery("");
    },
    [onExecute, onClose],
  );

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % flatList.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + flatList.length) % flatList.length);
      }
      if (e.key === "Enter" && flatList[activeIdx]) {
        e.preventDefault();
        execute(flatList[activeIdx]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, flatList, activeIdx, execute]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector("[data-active=true]");
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[350] bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="fixed left-1/2 top-[20%] z-[351] w-[480px] max-w-[95vw] -translate-x-1/2 overflow-hidden rounded-2xl"
        style={{
          backgroundColor: dropdownColors.bg,
          border: `1px solid ${dropdownColors.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: `1px solid ${dropdownColors.separator}` }}
        >
          <Search className="h-4 w-4 flex-shrink-0" style={{ color: dropdownColors.textMuted }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={flatList[activeIdx] ? `cmd-${flatList[activeIdx].id}` : undefined}
            role="combobox"
            aria-expanded="true"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:opacity-50"
            style={{ color: dropdownColors.text }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: dropdownColors.textMuted }}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd
            className="rounded px-1.5 py-0.5 font-mono text-[9px]"
            style={{
              backgroundColor: dropdownColors.hover,
              color: dropdownColors.textMuted,
              border: `1px solid ${dropdownColors.separator}`,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} id="command-list" role="listbox" aria-label="Commands" className="max-h-[50vh] overflow-y-auto p-2">
          {flatList.length === 0 && (
            <p className="py-8 text-center text-[12px]" style={{ color: dropdownColors.textMuted }}>
              No commands found
            </p>
          )}
          {grouped.map((group) => (
            <div key={group.category} className="mb-1">
              <p
                className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ color: dropdownColors.textMuted }}
              >
                {group.title}
              </p>
              {group.commands.map((cmd) => {
                const idx = flatList.indexOf(cmd);
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={cmd.id}
                    id={`cmd-${cmd.id}`}
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
                    style={{
                      backgroundColor: isActive ? dropdownColors.hover : "transparent",
                      color: dropdownColors.text,
                    }}
                  >
                    <span style={{ color: dropdownColors.textMuted }}>
                      {CATEGORY_ICONS[cmd.category]}
                    </span>
                    <span className="flex-1 text-[12px] font-medium">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd
                        className="rounded px-1.5 py-0.5 font-mono text-[9px]"
                        style={{
                          backgroundColor: isActive ? dropdownColors.separator : dropdownColors.hover,
                          color: dropdownColors.textMuted,
                          border: `1px solid ${dropdownColors.separator}`,
                        }}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center justify-between px-4 py-2 text-[10px]"
          style={{ borderTop: `1px solid ${dropdownColors.separator}`, color: dropdownColors.textMuted }}
        >
          <span>
            <kbd className="mr-1 rounded border px-1 font-mono text-[9px]" style={{ borderColor: dropdownColors.separator }}>↑↓</kbd>
            navigate
            <kbd className="mx-1 rounded border px-1 font-mono text-[9px]" style={{ borderColor: dropdownColors.separator }}>↵</kbd>
            select
          </span>
          <span>{flatList.length} commands</span>
        </div>
      </div>
    </>
  );
}
