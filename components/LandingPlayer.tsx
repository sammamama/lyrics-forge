"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";

const VERSIONS = [
  { label: "V1", src: "/lyricforge-1.mp3" },
  { label: "V2", src: "/lyricforge-2.mp3" },
];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function LandingPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeVersion, setActiveVersion] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const switchVersion = useCallback(
    (idx: number) => {
      if (idx === activeVersion && audioRef.current) {
        if (playing) {
          audioRef.current.pause();
          setPlaying(false);
        } else {
          audioRef.current.play();
          setPlaying(true);
        }
        return;
      }
      setActiveVersion(idx);
      setCurrentTime(0);
      setPlaying(true);
    },
    [activeVersion, playing]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (playing) {
      audio.play();
    }
  }, [activeVersion]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const fill = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-3 md:gap-5 w-full max-w-xs">
      <audio ref={audioRef} src={VERSIONS[activeVersion].src} preload="metadata" />

      {/* Cover */}
      <div className="relative w-36 h-36 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-lg">
        <Image
          src="/lyricforge-landing-cover.jpeg"
          alt="Don't Leave Me cover"
          fill
          className="object-cover"
        />
      </div>

      {/* Title */}
      <div className="text-center w-full">
        <div className="text-sm md:text-lg font-semibold text-[var(--color-text-primary)]">
          Don&apos;t Leave Me
        </div>
        <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
          Generated with LyricForge
        </div>
      </div>

      {/* Version pills */}
      <div className="flex gap-2">
        {VERSIONS.map((v, i) => (
          <button
            key={v.label}
            onClick={() => switchVersion(i)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              i === activeVersion
                ? "bg-[var(--color-accent)] text-[#0a0a0a]"
                : "bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Player controls */}
      <div className="flex items-center gap-3 w-full">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-[var(--color-accent)] text-[#0a0a0a] flex items-center justify-center flex-shrink-0 hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="3.5" height="12" rx="1" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5v11l9-5.5z" />
            </svg>
          )}
        </button>

        {/* Time + Seek */}
        <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] tabular-nums w-8 text-right flex-shrink-0">
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={onSeek}
          className="seek-bar flex-1"
          style={{ "--seek-fill": `${fill}%` } as React.CSSProperties}
        />

        <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] tabular-nums w-8 flex-shrink-0">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
