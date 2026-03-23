import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type {
  PortfolioWithRelations,
  PortfolioListItem,
  SectionWithBlocks,
  BlockWithStyles,
  ThemeTokens,
} from "@/types";

interface PortfolioState {
  portfolios: PortfolioListItem[];
  currentPortfolio: PortfolioWithRelations | null;
  isLoading: boolean;
  error: string | null;

  // Setters
  setPortfolios: (portfolios: PortfolioListItem[]) => void;
  setCurrentPortfolio: (portfolio: PortfolioWithRelations | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Portfolio list mutations
  addPortfolio: (portfolio: PortfolioListItem) => void;
  removePortfolio: (id: string) => void;
  updatePortfolioInList: (id: string, updates: Partial<PortfolioListItem>) => void;

  // Section mutations
  addSection: (section: SectionWithBlocks) => void;
  removeSection: (sectionId: string) => void;
  updateSection: (sectionId: string, updates: Partial<SectionWithBlocks>) => void;
  reorderSections: (orderedIds: string[]) => void;

  // Block mutations (Figma-like element operations)
  addBlockToSection: (sectionId: string, block: BlockWithStyles) => void;
  removeBlockFromSection: (sectionId: string, blockId: string) => void;
  updateBlockInSection: (sectionId: string, blockId: string, updates: Partial<BlockWithStyles>) => void;
  reorderBlocksInSection: (sectionId: string, orderedBlockIds: string[]) => void;

  // Theme
  updateTheme: (theme: Partial<ThemeTokens>) => void;

  // Snapshot restore
  replacePortfolio: (portfolio: PortfolioWithRelations) => void;

  reset: () => void;
}

const initialState = {
  portfolios: [],
  currentPortfolio: null,
  isLoading: false,
  error: null,
};

export const usePortfolioStore = create<PortfolioState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setPortfolios: (portfolios) => set({ portfolios }, false, "setPortfolios"),
      setCurrentPortfolio: (portfolio) => set({ currentPortfolio: portfolio }, false, "setCurrentPortfolio"),
      setLoading: (isLoading) => set({ isLoading }, false, "setLoading"),
      setError: (error) => set({ error }, false, "setError"),

      addPortfolio: (portfolio) =>
        set((s) => ({ portfolios: [portfolio, ...s.portfolios] }), false, "addPortfolio"),

      removePortfolio: (id) =>
        set((s) => ({ portfolios: s.portfolios.filter((p) => p.id !== id) }), false, "removePortfolio"),

      updatePortfolioInList: (id, updates) =>
        set((s) => ({ portfolios: s.portfolios.map((p) => (p.id === id ? { ...p, ...updates } : p)) }), false, "updatePortfolioInList"),

      // ── Section ─────────────────────────────────────────────────

      addSection: (section) => {
        const c = get().currentPortfolio;
        if (!c) return;
        set({ currentPortfolio: { ...c, sections: [...c.sections, section] } }, false, "addSection");
      },

      removeSection: (sectionId) => {
        const c = get().currentPortfolio;
        if (!c) return;
        set({ currentPortfolio: { ...c, sections: c.sections.filter((s) => s.id !== sectionId) } }, false, "removeSection");
      },

      updateSection: (sectionId, updates) => {
        const c = get().currentPortfolio;
        if (!c) return;
        set({
          currentPortfolio: {
            ...c,
            sections: c.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
          },
        }, false, "updateSection");
      },

      reorderSections: (orderedIds) => {
        const c = get().currentPortfolio;
        if (!c) return;
        const map = new Map(c.sections.map((s) => [s.id, s]));
        const reordered = orderedIds
          .map((id, idx) => {
            const s = map.get(id);
            return s ? { ...s, sortOrder: idx } : null;
          })
          .filter(Boolean) as SectionWithBlocks[];
        set({ currentPortfolio: { ...c, sections: reordered } }, false, "reorderSections");
      },

      // ── Block (element-level) ───────────────────────────────────

      addBlockToSection: (sectionId, block) => {
        const c = get().currentPortfolio;
        if (!c) return;
        set({
          currentPortfolio: {
            ...c,
            sections: c.sections.map((s) =>
              s.id === sectionId ? { ...s, blocks: [...s.blocks, block] } : s,
            ),
          },
        }, false, "addBlockToSection");
      },

      removeBlockFromSection: (sectionId, blockId) => {
        const c = get().currentPortfolio;
        if (!c) return;
        set({
          currentPortfolio: {
            ...c,
            sections: c.sections.map((s) =>
              s.id === sectionId
                ? { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) }
                : s,
            ),
          },
        }, false, "removeBlockFromSection");
      },

      updateBlockInSection: (sectionId, blockId, updates) => {
        const c = get().currentPortfolio;
        if (!c) return;
        set({
          currentPortfolio: {
            ...c,
            sections: c.sections.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    blocks: s.blocks.map((b) =>
                      b.id === blockId ? { ...b, ...updates } : b,
                    ),
                  }
                : s,
            ),
          },
        }, false, "updateBlockInSection");
      },

      reorderBlocksInSection: (sectionId, orderedBlockIds) => {
        const c = get().currentPortfolio;
        if (!c) return;
        set({
          currentPortfolio: {
            ...c,
            sections: c.sections.map((s) => {
              if (s.id !== sectionId) return s;
              const blockMap = new Map(s.blocks.map((b) => [b.id, b]));
              const reordered = orderedBlockIds
                .map((id, idx) => {
                  const b = blockMap.get(id);
                  return b ? { ...b, sortOrder: idx } : null;
                })
                .filter(Boolean) as BlockWithStyles[];
              return { ...s, blocks: reordered };
            }),
          },
        }, false, "reorderBlocksInSection");
      },

      // ── Theme ───────────────────────────────────────────────────

      updateTheme: (themeUpdates) => {
        const c = get().currentPortfolio;
        if (!c) return;
        // Merge partial updates into existing theme, creating one if null.
        // The cast is safe because callers always provide valid theme fields.
        const existing = c.theme ?? ({} as Record<string, unknown>);
        const merged = { ...existing, ...themeUpdates };
        set({
          currentPortfolio: {
            ...c,
            theme: merged as NonNullable<typeof c.theme>,
          },
        }, false, "updateTheme");
      },

      replacePortfolio: (portfolio) =>
        set({ currentPortfolio: portfolio }, false, "replacePortfolio"),

      reset: () => set(initialState, false, "reset"),
    }),
    { name: "portfolio-store" },
  ),
);
