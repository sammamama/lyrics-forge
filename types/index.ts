// Shared types for the LyricForge generation pipeline.

export type SongStatus = "pending" | "processing" | "done" | "failed";

/** Input for phase 1 — Claude lyrics generation. */
export interface LyricsInput {
  /** Free-text description of the song the user wants. */
  description: string;
  genres: string[];
  moods: string[];
  /** Tempo feel, e.g. "slow", "mid-tempo", "fast". */
  tempo: string;
  themes: string[];
  /**
   * Optional section order override, e.g. ["Verse 1", "Chorus", "Bridge"].
   * Defaults to verse/chorus/verse/chorus/bridge/chorus.
   */
  structure?: string[];
}

export interface LyricsResult {
  title: string;
  /** Suno-compatible lyrics with section tags like [Verse 1], [Chorus]. */
  lyrics: string;
}

/** Style inputs that get derived into a Suno style prompt. */
export interface StyleInput {
  genres: string[];
  moods: string[];
  tempo: string;
  /** e.g. "female", "male" — omitted from the style prompt when unset. */
  vocals?: string;
}

/** Input for phase 2 — Suno render. */
export interface CreateSongInput {
  lyrics: string;
  stylePrompt: string;
  title: string;
}

export interface SongStatusResult {
  status: SongStatus;
  audioUrl?: string;
}
