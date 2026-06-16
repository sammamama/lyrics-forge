"use client";

import { useEffect, useRef, useState } from "react";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, compact }: { src: string; compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play().catch(() => {});
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  return (
    <div className={compact ? "audio-player" : "audio-player card"}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        className="play-btn"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <rect x="2.5" y="2" width="4" height="12" rx="1" />
            <rect x="9.5" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M4 2.5a1 1 0 0 1 1.53-.85l9 5.5a1 1 0 0 1 0 1.7l-9 5.5A1 1 0 0 1 4 13.5v-11z" />
          </svg>
        )}
      </button>
      <input
        type="range"
        className="seek-bar"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Seek"
        style={{
          // Filled portion of the track up to the playhead.
          ["--seek-fill" as string]: `${duration ? (currentTime / duration) * 100 : 0}%`,
        }}
      />
      <span className="time-display" aria-live="off">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
