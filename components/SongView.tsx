"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AudioPlayer } from "@/components/AudioPlayer";
import { parseLyrics } from "@/lib/lyrics";

interface Song {
  id: string;
  title: string;
  lyrics: string;
  audioUrl: string | null;
  status: "pending" | "processing" | "done" | "failed";
}

const POLL_INTERVAL_MS = 5_000;
const WAVEFORM_BARS = 24;

export function SongView({ initialSong }: { initialSong: Song }) {
  const [song, setSong] = useState(initialSong);
  const inFlight = song.status === "pending" || song.status === "processing";

  // Polling drives status updates server-side — no cron, no webhook.
  useEffect(() => {
    if (!inFlight) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/songs/${song.id}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json?.data) {
          setSong((prev) => ({ ...prev, ...json.data }));
        }
      } catch {
        // Transient network error — next tick retries.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [inFlight, song.id]);

  return (
    <div className="song-view">
      <h1 className="font-semibold" style={{ fontSize: "var(--text-h1)" }}>
        {song.title}
      </h1>

      {inFlight && (
        <div className="card generating-state">
          <div className="waveform" aria-hidden>
            {Array.from({ length: WAVEFORM_BARS }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <p className="text-muted-foreground" style={{ fontSize: "var(--text-body)" }}>
            Generating your song… this usually takes a minute or two.
          </p>
        </div>
      )}

      {song.status === "failed" && (
        <div className="card failed-state">
          <p style={{ fontSize: "var(--text-body)" }}>
            Generation failed — your credit was refunded.
          </p>
          <Link href="/dashboard/generate" className="btn-ghost inline-block">
            Try again
          </Link>
        </div>
      )}

      {song.status === "done" && song.audioUrl && (
        <AudioPlayer src={song.audioUrl} />
      )}

      <div className="song-lyrics">
        {parseLyrics(song.lyrics).map((section, i) => (
          <section key={i} className="lyrics-section">
            {section.tag && <span className="lyrics-tag">[{section.tag}]</span>}
            {section.lines.map((line, j) =>
              line ? <p key={j}>{line}</p> : <br key={j} />,
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
