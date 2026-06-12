"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store";

// Command bar acting on the canvas. First submit generates lyrics from the
// description + style inputs; once lyrics exist, submits become revision
// instructions ("make the chorus sadder").
export function PromptBar() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useWorkspaceStore();
  const hasLyrics = Boolean(store.lyrics);

  async function submit() {
    const prompt = value.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError(null);

    const body = hasLyrics
      ? { currentLyrics: store.lyrics, instruction: prompt }
      : {
          description: prompt,
          genres: store.genres,
          moods: store.moods,
          themes: store.themes,
          tempo: store.tempo,
          structure: store.structure ?? undefined,
        };

    try {
      const res = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After");
          setError(
            retry
              ? `Too many requests — try again in ${retry}s`
              : "Too many requests — slow down",
          );
        } else {
          setError(json?.error ?? "Something went wrong");
        }
        return;
      }

      if (!hasLyrics) {
        store.setDescription(prompt);
        store.setTitle(json.data.title);
      }
      store.setLyrics(json.data.lyrics);
      setValue("");
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="prompt-bar-wrap">
      {error && <p className="prompt-error">{error}</p>}
      <form
        className="prompt-bar"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe your song… or ask for changes"
          aria-label="Lyrics prompt"
          disabled={busy}
        />
        <button
          type="submit"
          className="prompt-send"
          disabled={busy || !value.trim()}
          aria-label={hasLyrics ? "Revise lyrics" : "Generate lyrics"}
        >
          {busy ? (
            <span className="spinner" aria-hidden />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 14a.75.75 0 0 1-.75-.75V4.56L4.03 7.78a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 1 1-1.06 1.06L8.75 4.56v8.69A.75.75 0 0 1 8 14z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
