"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Workspace draft for /dashboard/generate. Persisted to localStorage so the
// draft survives refresh (per-device only — no DB draft rows in v1).
// Cleared after a successful render.

export interface WorkspaceState {
  description: string;
  genres: string[];
  moods: string[];
  themes: string[];
  tempo: string;
  /** Section order override; null = default verse/chorus/… structure. */
  structure: string[] | null;
  title: string;
  lyrics: string;

  setDescription: (description: string) => void;
  toggleGenre: (genre: string) => void;
  toggleMood: (mood: string) => void;
  toggleTheme: (theme: string) => void;
  setTempo: (tempo: string) => void;
  setStructure: (structure: string[] | null) => void;
  setTitle: (title: string) => void;
  setLyrics: (lyrics: string) => void;
  reset: () => void;
}

const initialDraft = {
  description: "",
  genres: [] as string[],
  moods: [] as string[],
  themes: [] as string[],
  tempo: "mid-tempo",
  structure: null as string[] | null,
  title: "",
  lyrics: "",
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      ...initialDraft,
      setDescription: (description) => set({ description }),
      toggleGenre: (genre) =>
        set((state) => ({ genres: toggle(state.genres, genre) })),
      toggleMood: (mood) =>
        set((state) => ({ moods: toggle(state.moods, mood) })),
      toggleTheme: (theme) =>
        set((state) => ({ themes: toggle(state.themes, theme) })),
      setTempo: (tempo) => set({ tempo }),
      setStructure: (structure) => set({ structure }),
      setTitle: (title) => set({ title }),
      setLyrics: (lyrics) => set({ lyrics }),
      reset: () => set(initialDraft),
    }),
    { name: "lyricforge-workspace" },
  ),
);
