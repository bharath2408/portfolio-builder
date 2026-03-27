"use client";

import { Search, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";

import {
  ICON_CATEGORIES,
  getRecentIcons,
  addRecentIcon,
} from "@/config/icon-categories";

// ─── Get all valid Lucide icon names ────────────────────────────

const _icons = LucideIcons as unknown as Record<string, unknown>;
const ALL_ICON_NAMES: string[] = Object.keys(_icons).filter(
  (key) =>
    key.length > 0 &&
    typeof _icons[key] === "object" &&
    _icons[key] !== null &&
    key[0] === key[0]!.toUpperCase() &&
    key !== "default" &&
    key !== "createLucideIcon" &&
    key !== "icons" &&
    !key.startsWith("Lucide") &&
    !key.endsWith("Icon"),
);

// ─── Props ──────────────────────────────────────────────────────

interface IconPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
}

// ─── Component ──────────────────────────────────────────────────

export function IconPicker({ open, onClose, onSelect, currentIcon }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("popular");
  const [selected, setSelected] = useState<string | null>(currentIcon ?? null);
  const [recentIcons, setRecentIcons] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRecentIcons(getRecentIcons());
      setSelected(currentIcon ?? null);
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open, currentIcon]);

  const filteredIcons = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return ALL_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
    }
    if (activeCategory === "recent") {
      return recentIcons.filter((n) => ALL_ICON_NAMES.includes(n));
    }
    const cat = ICON_CATEGORIES.find((c) => c.id === activeCategory);
    if (cat) return cat.icons.filter((n) => ALL_ICON_NAMES.includes(n));
    return ALL_ICON_NAMES;
  }, [search, activeCategory, recentIcons]);

  const handleSelect = useCallback(
    (name: string) => {
      setSelected(name);
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    if (selected) {
      addRecentIcon(selected);
      onSelect(selected);
      onClose();
    }
  }, [selected, onSelect, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex h-[520px] w-[440px] flex-col overflow-hidden rounded-xl"
        style={{
          backgroundColor: "var(--b-panel)",
          border: "1px solid var(--b-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--b-border)" }}
        >
          <span className="text-[13px] font-semibold" style={{ color: "var(--b-text)" }}>
            Choose Icon
          </span>
          <button onClick={onClose} className="rounded-md p-1" style={{ color: "var(--b-text-3)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--b-border)" }}>
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              style={{ color: "var(--b-text-4)" }}
            />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="h-8 w-full rounded-md border-0 pl-8 pr-3 text-[12px] outline-none"
              style={{
                backgroundColor: "var(--b-surface)",
                color: "var(--b-text)",
              }}
            />
          </div>
        </div>

        {/* Category tabs */}
        {!search.trim() && (
          <div
            className="flex gap-0.5 overflow-x-auto px-3 py-2 scrollbar-thin"
            style={{ borderBottom: "1px solid var(--b-border)" }}
          >
            {[
              { id: "popular", label: "Popular" },
              ...(recentIcons.length > 0 ? [{ id: "recent", label: "Recent" }] : []),
              ...ICON_CATEGORIES.filter((c) => c.id !== "popular"),
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex-shrink-0 rounded-md px-2.5 py-1 text-[10px] font-semibold transition-colors"
                style={{
                  color: activeCategory === cat.id ? "var(--b-accent)" : "var(--b-text-4)",
                  backgroundColor: activeCategory === cat.id ? "var(--b-accent-soft)" : "transparent",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Icon grid */}
        <div
          className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin"
          style={{ contentVisibility: "auto" }}
        >
          {filteredIcons.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[12px]" style={{ color: "var(--b-text-4)" }}>
              No icons found
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-1">
              {filteredIcons.slice(0, 200).map((name) => {
                const IconComp = (_icons[name] as React.ComponentType<{ size?: number; className?: string }>) ?? null;
                if (!IconComp) return null;
                const isSelected = selected === name;
                return (
                  <button
                    key={name}
                    onClick={() => handleSelect(name)}
                    onDoubleClick={() => { setSelected(name); handleConfirm(); }}
                    title={name}
                    className="flex h-10 w-10 items-center justify-center rounded-md transition-all"
                    style={{
                      backgroundColor: isSelected ? "var(--b-accent-soft)" : "transparent",
                      border: isSelected ? "1.5px solid var(--b-accent)" : "1px solid transparent",
                      color: isSelected ? "var(--b-accent)" : "var(--b-text-3)",
                    }}
                  >
                    <IconComp size={20} />
                  </button>
                );
              })}
            </div>
          )}
          {filteredIcons.length > 200 && (
            <div className="mt-2 text-center text-[10px]" style={{ color: "var(--b-text-4)" }}>
              Showing 200 of {filteredIcons.length} — refine your search
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid var(--b-border)" }}
        >
          <span className="text-[11px]" style={{ color: "var(--b-text-3)" }}>
            {selected ? (
              <>Selected: <strong style={{ color: "var(--b-text)" }}>{selected}</strong></>
            ) : (
              "Click an icon to select"
            )}
          </span>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="rounded-lg px-4 py-1.5 text-[11px] font-semibold text-white transition-all disabled:opacity-30"
            style={{
              backgroundColor: "var(--b-accent)",
            }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
