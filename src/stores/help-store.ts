import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface HelpState {
  hasCompletedOnboarding: boolean;
  dismissedTips: Record<string, boolean>;

  completeOnboarding: () => void;
  dismissTip: (id: string) => void;
  resetTips: () => void;
  isTipDismissed: (id: string) => boolean;
}

export const useHelpStore = create<HelpState>()(
  devtools(
    persist(
      (set, get) => ({
        hasCompletedOnboarding: false,
        dismissedTips: {},

        completeOnboarding: () => set({ hasCompletedOnboarding: true }, false, "completeOnboarding"),
        dismissTip: (id) =>
          set(
            (state) => ({
              dismissedTips: { ...state.dismissedTips, [id]: true },
            }),
            false,
            "dismissTip",
          ),
        resetTips: () => set({ dismissedTips: {}, hasCompletedOnboarding: false }, false, "resetTips"),
        isTipDismissed: (id) => !!get().dismissedTips[id],
      }),
      { name: "foliocraft-help" },
    ),
    { name: "HelpStore" },
  ),
);
