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
  showRulers: boolean;
  showMinimap: boolean;
  setGridSize: (size: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setShowRulers: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;

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

  loadPrefsFromDb: () => Promise<void>;
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

// ── Persisted editor preferences (localStorage + DB sync) ────────

const PREFS_KEY = "foliocraft:editor-prefs";

interface EditorPrefs {
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  showMinimap: boolean;
}

const defaultPrefs: EditorPrefs = {
  showGrid: true,
  showRulers: false,
  snapToGrid: true,
  gridSize: 20,
  leftPanelOpen: true,
  rightPanelOpen: true,
  showMinimap: true,
};

function loadPrefsFromLocal(): EditorPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {}
  return defaultPrefs;
}

function savePrefsToLocal(prefs: Partial<EditorPrefs>) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadPrefsFromLocal();
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...existing, ...prefs }));
  } catch {}
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function syncPrefsToDb(prefs: Partial<EditorPrefs>) {
  savePrefsToLocal(prefs);
  // Debounce DB sync — save after 3s of no changes
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const full = loadPrefsFromLocal();
      await fetch("/api/user/editor-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(full),
      });
    } catch {}
  }, 3000);
}

const savedPrefs = loadPrefsFromLocal();

const initialState = {
  activeSectionId: null,
  isPreviewMode: false,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  leftPanelOpen: savedPrefs.leftPanelOpen,
  rightPanelOpen: savedPrefs.rightPanelOpen,
  activeRightTab: "style" as const,
  devicePreview: "desktop" as const,
  clipboard: null as BlockClipboard | null,
  gridSize: savedPrefs.gridSize,
  snapToGrid: savedPrefs.snapToGrid,
  showGrid: savedPrefs.showGrid,
  showRulers: savedPrefs.showRulers,
  showMinimap: savedPrefs.showMinimap,
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

      toggleLeftPanel: () => {
        const next = !get().leftPanelOpen;
        set({ leftPanelOpen: next }, false, "toggleLeftPanel");
        syncPrefsToDb({ leftPanelOpen: next });
      },

      toggleRightPanel: () => {
        const next = !get().rightPanelOpen;
        set({ rightPanelOpen: next }, false, "toggleRightPanel");
        syncPrefsToDb({ rightPanelOpen: next });
      },

      setActiveRightTab: (tab) =>
        set({ activeRightTab: tab }, false, "setActiveRightTab"),

      setDevicePreview: (device) =>
        set({ devicePreview: device }, false, "setDevicePreview"),

      setGridSize: (size) => { set({ gridSize: size }, false, "setGridSize"); syncPrefsToDb({ gridSize: size }); },
      setSnapToGrid: (snap) => { set({ snapToGrid: snap }, false, "setSnapToGrid"); syncPrefsToDb({ snapToGrid: snap }); },
      setShowGrid: (show) => { set({ showGrid: show }, false, "setShowGrid"); syncPrefsToDb({ showGrid: show }); },
      setShowRulers: (show) => { set({ showRulers: show }, false, "setShowRulers"); syncPrefsToDb({ showRulers: show }); },
      setShowMinimap: (show) => { set({ showMinimap: show }, false, "setShowMinimap"); syncPrefsToDb({ showMinimap: show }); },

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

      loadPrefsFromDb: async () => {
        // Only fetch from DB if localStorage is empty (new device/browser)
        const local = localStorage.getItem(PREFS_KEY);
        if (local) return; // Already have local prefs
        try {
          const res = await fetch("/api/user/editor-preferences");
          if (!res.ok) return;
          const json = await res.json();
          const prefs = json.data ?? json;
          if (prefs && typeof prefs === "object" && Object.keys(prefs).length > 0) {
            const merged = { ...defaultPrefs, ...prefs } as EditorPrefs;
            savePrefsToLocal(merged);
            set({
              showGrid: merged.showGrid,
              showRulers: merged.showRulers,
              showMinimap: merged.showMinimap,
              snapToGrid: merged.snapToGrid,
              gridSize: merged.gridSize,
              leftPanelOpen: merged.leftPanelOpen,
              rightPanelOpen: merged.rightPanelOpen,
            }, false, "loadPrefsFromDb");
          }
        } catch {}
      },

      reset: () => set(initialState, false, "reset"),
    }),
    { name: "builder-store" },
  ),
);
