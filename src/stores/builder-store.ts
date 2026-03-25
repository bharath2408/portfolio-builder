import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { usePortfolioStore } from "@/stores/portfolio-store";
import type { PortfolioWithRelations } from "@/types";

interface BuilderState {
  // Editor state
  activeSectionId: string | null;
  isPreviewMode: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;

  // Panel state
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  activeRightTab: "style" | "settings" | "theme";

  // Device preview
  devicePreview: "desktop" | "tablet" | "mobile";
  setDevicePreview: (device: "desktop" | "tablet" | "mobile") => void;

  // Grid / Snap
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  setGridSize: (size: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  setShowGrid: (show: boolean) => void;

  // Clipboard
  clipboard: BlockClipboard | null;
  copyBlock: (block: BlockClipboard) => void;

  // Undo / Redo
  undoStack: BuilderSnapshot[];
  redoStack: BuilderSnapshot[];

  // Actions
  setActiveSection: (id: string | null) => void;
  togglePreview: () => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  markSaved: () => void;

  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setActiveRightTab: (tab: "style" | "settings" | "theme") => void;

  pushSnapshot: (type: string) => void;
  undo: () => BuilderSnapshot | null;
  redo: () => BuilderSnapshot | null;
  clearHistory: () => void;

  reset: () => void;
}

interface BlockClipboard {
  type: string;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  tabletStyles: Record<string, unknown>;
  mobileStyles: Record<string, unknown>;
}

interface BuilderSnapshot {
  type: string;
  portfolioState: PortfolioWithRelations;
  timestamp: number;
}

const MAX_UNDO_STACK = 50;

const initialState = {
  activeSectionId: null,
  isPreviewMode: false,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  leftPanelOpen: true,
  rightPanelOpen: true,
  activeRightTab: "style" as const,
  devicePreview: "desktop" as const,
  clipboard: null as BlockClipboard | null,
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  undoStack: [] as BuilderSnapshot[],
  redoStack: [] as BuilderSnapshot[],
};

export const useBuilderStore = create<BuilderState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setActiveSection: (id) =>
        set({ activeSectionId: id }, false, "setActiveSection"),

      togglePreview: () =>
        set(
          (state) => ({ isPreviewMode: !state.isPreviewMode }),
          false,
          "togglePreview",
        ),

      setDirty: (dirty) => set({ isDirty: dirty }, false, "setDirty"),

      setSaving: (saving) => set({ isSaving: saving }, false, "setSaving"),

      markSaved: () =>
        set(
          { isDirty: false, isSaving: false, lastSavedAt: new Date() },
          false,
          "markSaved",
        ),

      toggleLeftPanel: () =>
        set(
          (state) => ({ leftPanelOpen: !state.leftPanelOpen }),
          false,
          "toggleLeftPanel",
        ),

      toggleRightPanel: () =>
        set(
          (state) => ({ rightPanelOpen: !state.rightPanelOpen }),
          false,
          "toggleRightPanel",
        ),

      setActiveRightTab: (tab) =>
        set({ activeRightTab: tab }, false, "setActiveRightTab"),

      setDevicePreview: (device) =>
        set({ devicePreview: device }, false, "setDevicePreview"),

      setGridSize: (size) => set({ gridSize: size }, false, "setGridSize"),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }, false, "setSnapToGrid"),
      setShowGrid: (show) => set({ showGrid: show }, false, "setShowGrid"),

      copyBlock: (block) => set({ clipboard: block }, false, "copyBlock"),

      pushSnapshot: (type: string) => {
        const currentPortfolio = usePortfolioStore.getState().currentPortfolio;
        if (!currentPortfolio) return;

        const snapshot: BuilderSnapshot = {
          type,
          portfolioState: structuredClone(currentPortfolio),
          timestamp: Date.now(),
        };

        set(
          (state) => ({
            undoStack: [snapshot, ...state.undoStack].slice(0, MAX_UNDO_STACK),
            redoStack: [],
            isDirty: true,
          }),
          false,
          "pushSnapshot",
        );
      },

      undo: () => {
        const { undoStack, redoStack } = get();
        if (undoStack.length === 0) return null;

        const currentPortfolio = usePortfolioStore.getState().currentPortfolio;
        if (!currentPortfolio) return null;

        const [snapshot, ...rest] = undoStack;
        if (!snapshot) return null;

        const currentSnapshot: BuilderSnapshot = {
          type: "undo-save",
          portfolioState: structuredClone(currentPortfolio),
          timestamp: Date.now(),
        };

        set(
          { undoStack: rest, redoStack: [currentSnapshot, ...redoStack] },
          false,
          "undo",
        );

        usePortfolioStore.getState().replacePortfolio(snapshot.portfolioState);
        return snapshot;
      },

      redo: () => {
        const { redoStack, undoStack } = get();
        if (redoStack.length === 0) return null;

        const currentPortfolio = usePortfolioStore.getState().currentPortfolio;
        if (!currentPortfolio) return null;

        const [snapshot, ...rest] = redoStack;
        if (!snapshot) return null;

        const currentSnapshot: BuilderSnapshot = {
          type: "redo-save",
          portfolioState: structuredClone(currentPortfolio),
          timestamp: Date.now(),
        };

        set(
          { redoStack: rest, undoStack: [currentSnapshot, ...undoStack] },
          false,
          "redo",
        );

        usePortfolioStore.getState().replacePortfolio(snapshot.portfolioState);
        return snapshot;
      },

      clearHistory: () =>
        set({ undoStack: [], redoStack: [] }, false, "clearHistory"),

      reset: () => set(initialState, false, "reset"),
    }),
    { name: "builder-store" },
  ),
);
