"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/lib/store";

export function PromptBar() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const store = useWorkspaceStore();
  const hasLyrics = Boolean(store.lyrics);

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    // Restore focus so user can edit immediately
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // Ctrl+C (or Cmd+C on Mac) cancels while a request is in flight
  useEffect(() => {
    if (!busy) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        cancel();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  async function submit() {
    const prompt = value.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

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
        signal: controller.signal,
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
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Network error — try again");
    } finally {
      abortRef.current = null;
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
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe your song… or ask for changes"
          aria-label="Lyrics prompt"
          disabled={busy}
        />
        {busy ? (
          <button
            type="button"
            className="prompt-cancel"
            onClick={cancel}
            aria-label="Cancel (Ctrl+C)"
            title="Cancel (Ctrl+C)"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            className="prompt-send"
            disabled={!value.trim()}
            aria-label={hasLyrics ? "Revise lyrics" : "Generate lyrics"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 14a.75.75 0 0 1-.75-.75V4.56L4.03 7.78a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 1 1-1.06 1.06L8.75 4.56v8.69A.75.75 0 0 1 8 14z" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}
