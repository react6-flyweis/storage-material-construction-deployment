import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TourId } from "./tour.types";

interface TourState {
  hasSeenWelcomeModal: boolean;
  completedTours: TourId[];
  isAudioMuted: boolean;
  activeTourId: TourId | null;
  currentStepIndex: number;

  setHasSeenWelcomeModal: (seen: boolean) => void;
  markTourCompleted: (tourId: TourId) => void;
  setAudioMuted: (muted: boolean) => void;
  toggleAudioMute: () => void;
  setActiveTour: (tourId: TourId | null) => void;
  setCurrentStepIndex: (index: number) => void;
  resetAllTours: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      hasSeenWelcomeModal: false,
      completedTours: [],
      isAudioMuted: false,
      activeTourId: null,
      currentStepIndex: 0,

      setHasSeenWelcomeModal: (seen) => set({ hasSeenWelcomeModal: seen }),
      markTourCompleted: (tourId) =>
        set((state) => ({
          completedTours: state.completedTours.includes(tourId)
            ? state.completedTours
            : [...state.completedTours, tourId],
          activeTourId: null,
          currentStepIndex: 0,
        })),
      setAudioMuted: (isAudioMuted) => set({ isAudioMuted }),
      toggleAudioMute: () =>
        set((state) => ({ isAudioMuted: !state.isAudioMuted })),
      setActiveTour: (tourId) =>
        set({ activeTourId: tourId, currentStepIndex: 0 }),
      setCurrentStepIndex: (currentStepIndex) => set({ currentStepIndex }),
      resetAllTours: () =>
        set({ completedTours: [], hasSeenWelcomeModal: false }),
    }),
    {
      name: "construction_panel_tour_storage",
      partialize: (state) => ({
        hasSeenWelcomeModal: state.hasSeenWelcomeModal,
        completedTours: state.completedTours,
        isAudioMuted: state.isAudioMuted,
      }),
    },
  ),
);
