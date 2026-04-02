import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerStore {
  currentLectureId: string | null;
  playbackProgress: Record<string, number>; // lectureId → seconds
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isTheaterMode: boolean;
  setCurrentLecture: (id: string) => void;
  setProgress: (lectureId: string, seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleTheaterMode: () => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      currentLectureId: null,
      playbackProgress: {},
      playbackRate: 1,
      volume: 1,
      isMuted: false,
      isTheaterMode: false,

      setCurrentLecture: (id) => set({ currentLectureId: id }),

      setProgress: (lectureId, seconds) =>
        set((s) => ({
          playbackProgress: { ...s.playbackProgress, [lectureId]: seconds },
        })),

      setPlaybackRate: (playbackRate) => set({ playbackRate }),

      setVolume: (volume) => set({ volume }),

      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

      toggleTheaterMode: () =>
        set((s) => ({ isTheaterMode: !s.isTheaterMode })),
    }),
    {
      name: "player-storage",
      partialize: (s) => ({
        playbackProgress: s.playbackProgress,
        playbackRate: s.playbackRate,
        volume: s.volume,
      }),
    }
  )
);
