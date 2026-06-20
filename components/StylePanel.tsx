"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/lib/store";
import { Separator } from "./ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <h3 className="style-label">{children}</h3>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-default shrink-0" aria-label="Required field">
              <Info className="size-3.5 text-neutral-400" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">This is a necessary selection</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function StylePanel() {
  const router = useRouter();
  const store = useWorkspaceStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tempoIndex = Math.max(0, TEMPOS.indexOf(store.tempo));
  const canGenerate =
    !!store.lyrics &&
    store.genres.length > 0 &&
    store.moods.length > 0 &&
    store.themes.length > 0;

  function toastOutOfCredits() {
    toast.error("You're out of credits", {
      description: "You have no credits remaining.",
    });
  }

  async function generateSong() {
    if (busy || !canGenerate) return;
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
          <SectionLabel>Genre</SectionLabel>
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
          <SectionLabel>Mood</SectionLabel>
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
          <SectionLabel>Tempo</SectionLabel>
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
          <SectionLabel>Themes</SectionLabel>
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

      </div>

      <div className="style-cta">
        {error && <p className="prompt-error">{error}</p>}
        <Button
          size="lg"
          className="w-full h-11"
          disabled={busy || !canGenerate}
          onClick={generateSong}
        >
          {busy ? "Generating…" : "Generate Song · 1 credit"}
        </Button>
      </div>
    </div>
  );
}
