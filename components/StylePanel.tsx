"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/lib/store";
import { Separator } from "./ui/separator";

const GENRES = [
  "pop",
  "rock",
  "hip-hop",
  "R&B",
  "country",
  "electronic",
  "indie",
  "jazz",
  "lo-fi",
  "metal",
];

const MOODS = [
  "happy",
  "melancholic",
  "energetic",
  "dreamy",
  "dark",
  "romantic",
  "nostalgic",
  "triumphant",
];

const THEMES = [
  "love",
  "heartbreak",
  "freedom",
  "nostalgia",
  "summer",
  "night drives",
  "hope",
  "letting go",
];

const TEMPOS = ["slow", "mid-tempo", "fast"];

const DEFAULT_STRUCTURE =
  "Verse 1\nChorus\nVerse 2\nChorus\nBridge\nChorus";

export function StylePanel() {
  const router = useRouter();
  const store = useWorkspaceStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tempoIndex = Math.max(0, TEMPOS.indexOf(store.tempo));

  function toastOutOfCredits() {
    toast.error("You're out of credits", {
      description: "Buy a credit pack to generate this song.",
      action: {
        label: "Buy credits",
        onClick: () => router.push("/dashboard/credits"),
      },
    });
  }

  async function generateSong() {
    if (busy || !store.lyrics) return;
    setBusy(true);
    setError(null);

    try {
      // Check the balance up front so we can fail fast with a toast.
      const creditsRes = await fetch("/api/credits");
      const creditsJson = await creditsRes.json();
      if (
        creditsRes.ok &&
        typeof creditsJson?.data?.balance === "number" &&
        creditsJson.data.balance < 1
      ) {
        toastOutOfCredits();
        setBusy(false);
        return;
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: store.description || store.title || "Untitled song",
          genres: store.genres,
          moods: store.moods,
          themes: store.themes,
          tempo: store.tempo,
          structure: store.structure ?? undefined,
          lyrics: store.lyrics,
          title: store.title || "Untitled",
        }),
      });
      const json = await res.json();

      if (res.status === 402) {
        toastOutOfCredits();
        setBusy(false);
        return;
      }
      if (!res.ok) {
        setError(json?.error ?? "Something went wrong");
        setBusy(false);
        return;
      }

      store.reset();
      router.push(`/song/${json.data.songId}`);
    } catch {
      setError("Network error — try again");
      setBusy(false);
      return;
    }
    // Keep the button in its loading state through the redirect.
  }

  return (
    <div className="bg-neutral-900 backdrop-blur-lg">
      <div className="style-sections">
        <section className="bg-neutral-800 p-3 rounded-xl">
          <h3 className="style-label">Genre</h3>
          <Separator className="mb-3 bg-neutral-300" />
          <div className="chip-row ">
            {GENRES.map((genre) => (
              <Chip
                key={genre}
                active={store.genres.includes(genre)}
                onClick={() => store.toggleGenre(genre)}
              >
                {genre}
              </Chip>
            ))}
          </div>
        </section>
          
        <section className="bg-neutral-800 p-3 rounded-xl">
          <h3 className="style-label font-bold">Mood</h3>
          <Separator className="mb-3 bg-neutral-300" />
          <div className="mood-grid font-extralight">
            {MOODS.map((mood) => (
              <Chip
                key={mood}
                active={store.moods.includes(mood)}
                onClick={() => store.toggleMood(mood)}
              >
                {mood}
              </Chip>
            ))}
          </div>
        </section>

        <section className="bg-neutral-800 p-3 rounded-xl">
          <h3 className="style-label">Tempo</h3>
          <Separator className="mb-3 bg-neutral-300" />
          <input
            type="range"
            className="tempo-slider"
            min={0}
            max={TEMPOS.length - 1}
            step={1}
            value={tempoIndex}
            onChange={(e) => store.setTempo(TEMPOS[Number(e.target.value)])}
            aria-label="Tempo"
            aria-valuetext={store.tempo}
          />
          <div className="tempo-labels">
            {TEMPOS.map((tempo) => (
              <span
                key={tempo}
                className={tempo === store.tempo ? "text-neutral-200" : undefined}
              >
                {tempo}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-neutral-800 p-3 rounded-xl">
          <h3 className="style-label">Themes</h3>
          <Separator className="mb-3 bg-neutral-300" />
          <div className="chip-row">
            {THEMES.map((theme) => (
              <Chip
                key={theme}
                active={store.themes.includes(theme)}
                onClick={() => store.toggleTheme(theme)}
              >
                {theme}
              </Chip>
            ))}
          </div>
        </section>

        <details className="structure-section">
          <summary className="style-label">Song structure</summary>
          <p className="structure-hint">One section per line.</p>
          <Textarea
            className="resize-none bg-subtle"
            rows={6}
            value={
              store.structure ? store.structure.join("\n") : DEFAULT_STRUCTURE
            }
            onChange={(e) => {
              const sections = e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              store.setStructure(sections.length ? sections : null);
            }}
            aria-label="Song structure"
          />
        </details>
      </div>

      <div className="style-cta">
        {error && <p className="prompt-error">{error}</p>}
        <Button
          size="lg"
          className="w-full h-11"
          disabled={busy || !store.lyrics}
          onClick={generateSong}
        >
          {busy ? "Generating…" : "Generate Song · 1 credit"}
        </Button>
      </div>
    </div>
  );
}
