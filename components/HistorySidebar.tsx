"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditsBadge } from "@/components/CreditsBadge";
import { UserButton } from "@/components/UserButton";
import { useWorkspaceStore } from "@/lib/store";
import { parseLyrics } from "@/lib/lyrics";

interface SongItem {
  id: string;
  title: string;
  status: "pending" | "processing" | "done" | "failed";
  audioUrl: string | null;
  audioUrl2: string | null;
  lyrics: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Generating…",
  processing: "Generating…",
  done: "Done",
  failed: "Failed",
};

const MINI_WAVEFORM_BARS = 8;

function PlayIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 2.5a1 1 0 0 1 1.53-.85l9 5.5a1 1 0 0 1 0 1.7l-9 5.5A1 1 0 0 1 4 13.5v-11z" />
    </svg>
  );
}

function PauseIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="2.5" y="2" width="4" height="12" rx="1" />
      <rect x="9.5" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 12l-4-4h2.5V3h3v5H12L8 12z" />
      <rect x="3" y="13" width="10" height="1.5" rx="0.75" />
    </svg>
  );
}

function MiniWaveform({ playing }: { playing: boolean }) {
  return (
    <div className={`mini-waveform${playing ? " playing" : ""}`} aria-hidden>
      {Array.from({ length: MINI_WAVEFORM_BARS }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

export function HistorySidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [songs, setSongs] = useState<SongItem[] | null>(null);
  const [dialogSong, setDialogSong] = useState<SongItem | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingVersion, setPlayingVersion] = useState<1 | 2>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reset = useWorkspaceStore((s) => s.reset);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/songs")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && Array.isArray(json?.data?.songs)) {
          setSongs(json.data.songs);
        }
      })
      .catch(() => {
        if (!cancelled) setSongs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setPlayingId(null);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function togglePlay(song: SongItem, version: 1 | 2, e?: React.MouseEvent) {
    e?.stopPropagation();
    const url = version === 1 ? song.audioUrl : song.audioUrl2;
    if (!url) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === song.id && playingVersion === version) {
      if (isPlaying) audio.pause();
      else audio.play().catch(() => {});
    } else {
      audio.src = url;
      audio.play().catch(() => {});
      setPlayingId(song.id);
      setPlayingVersion(version);
    }
  }

  function isVersionPlaying(id: string, v: 1 | 2) {
    return playingId === id && playingVersion === v && isPlaying;
  }

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      <Sidebar className="w-[20%]" collapsible="offcanvas">
        <SidebarHeader className="gap-4 px-4 pt-5">
          <Link href="/dashboard" className="dash-logo">
            Lyric<span className="text-primary">Forge</span>
          </Link>
          <UserButton>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                reset();
                onNavigate?.();
              }}
            >
              + New song
            </Button>
          </UserButton>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <SidebarMenu>
              {songs === null ? (
                Array.from({ length: 4 }, (_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                ))
              ) : songs.length === 0 ? (
                <p className="px-2 py-3 text-tertiary" style={{ fontSize: "var(--text-label)" }}>
                  No songs yet
                </p>
              ) : (
                songs.map((song) => (
                  <SidebarMenuItem key={song.id}>
                    <SidebarMenuButton
                      className="gap-2"
                      onClick={() => setDialogSong(song)}
                      title={song.title}
                    >
                      <span className={`status-dot status-${song.status}`} aria-hidden />
                      <span className="truncate flex-1 text-left">{song.title}</span>
                    </SidebarMenuButton>

                    {/* Version cards — side by side, only when done */}
                    {song.status === "done" && (song.audioUrl || song.audioUrl2) && (
                      <div className="version-cards">
                        {song.audioUrl && (
                          <div
                            className="version-card"
                            onClick={() => setDialogSong(song)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && setDialogSong(song)}
                          >
                            <span className="version-label">V1</span>
                            <MiniWaveform playing={isVersionPlaying(song.id, 1)} />
                            <div className="version-card-actions">
                              <button
                                type="button"
                                className={`version-play-btn${isVersionPlaying(song.id, 1) ? " active" : ""}`}
                                onClick={(e) => togglePlay(song, 1, e)}
                                aria-label={isVersionPlaying(song.id, 1) ? "Pause version 1" : "Play version 1"}
                              >
                                {isVersionPlaying(song.id, 1) ? <PauseIcon /> : <PlayIcon />}
                              </button>
                              <a
                                href={song.audioUrl}
                                download={`${song.title} - Version 1.mp3`}
                                className="version-dl-btn"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Download version 1"
                              >
                                <DownloadIcon />
                              </a>
                            </div>
                          </div>
                        )}
                        {song.audioUrl2 && (
                          <div
                            className="version-card"
                            onClick={() => setDialogSong(song)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && setDialogSong(song)}
                          >
                            <span className="version-label">V2</span>
                            <MiniWaveform playing={isVersionPlaying(song.id, 2)} />
                            <div className="version-card-actions">
                              <button
                                type="button"
                                className={`version-play-btn${isVersionPlaying(song.id, 2) ? " active" : ""}`}
                                onClick={(e) => togglePlay(song, 2, e)}
                                aria-label={isVersionPlaying(song.id, 2) ? "Pause version 2" : "Play version 2"}
                              >
                                {isVersionPlaying(song.id, 2) ? <PauseIcon /> : <PlayIcon />}
                              </button>
                              <a
                                href={song.audioUrl2}
                                download={`${song.title} - Version 2.mp3`}
                                className="version-dl-btn"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Download version 2"
                              >
                                <DownloadIcon />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-4 pb-5">
          <div>
            <CreditsBadge />
          </div>
        </SidebarFooter>
      </Sidebar>

      <Dialog
        open={dialogSong !== null}
        onOpenChange={(open) => {
          if (!open) setDialogSong(null);
        }}
      >
        <DialogContent
          className="flex flex-col gap-0 p-0 sm:max-w-xl overflow-hidden"
          style={{ maxHeight: "80dvh" }}
        >
          {dialogSong && (
            <>
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                <div className="pr-6">
                  <DialogTitle className="truncate text-base font-semibold leading-snug">
                    {dialogSong.title}
                  </DialogTitle>
                  <span
                    className={`status-pill status-${dialogSong.status} mt-2`}
                    style={{ display: "inline-flex" }}
                  >
                    <span className={`status-dot status-${dialogSong.status}`} aria-hidden />
                    {STATUS_LABELS[dialogSong.status] ?? dialogSong.status}
                  </span>
                </div>
                <DialogDescription className="sr-only">
                  Song lyrics and playback
                </DialogDescription>
              </DialogHeader>

              {/* Scrollable lyrics */}
              <div className="flex-1 overflow-y-auto px-6 pb-2 thin-scrollbar min-h-0">
                {dialogSong.lyrics ? (
                  <div className="song-lyrics">
                    {parseLyrics(dialogSong.lyrics).map((section, i) => (
                      <section key={i} className="lyrics-section">
                        {section.tag && (
                          <span className="lyrics-tag">[{section.tag}]</span>
                        )}
                        {section.lines.map((line, j) =>
                          line ? <p key={j}>{line}</p> : <br key={j} />,
                        )}
                      </section>
                    ))}
                  </div>
                ) : (
                  <p className="text-tertiary py-4" style={{ fontSize: "var(--text-body)" }}>
                    No lyrics yet.
                  </p>
                )}
              </div>

              {/* Sticky footer — play + download per version */}
              {(dialogSong.audioUrl || dialogSong.audioUrl2) && (
                <div className="flex-shrink-0 border-t border-border px-6 py-4 flex items-center gap-4">
                  {dialogSong.audioUrl && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="play-btn"
                        style={{ width: 36, height: 36 }}
                        onClick={() => togglePlay(dialogSong, 1)}
                        aria-label={isVersionPlaying(dialogSong.id, 1) ? "Pause version 1" : "Play version 1"}
                      >
                        {isVersionPlaying(dialogSong.id, 1) ? (
                          <PauseIcon size={14} />
                        ) : (
                          <PlayIcon size={14} />
                        )}
                      </button>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-muted-foreground leading-none">
                          Version 1
                        </span>
                        {isVersionPlaying(dialogSong.id, 1) && (
                          <span className="text-xs text-tertiary leading-none">Playing…</span>
                        )}
                      </div>
                      <a
                        href={dialogSong.audioUrl}
                        download={`${dialogSong.title} - Version 1.mp3`}
                        className="version-dl-btn ml-1"
                        aria-label="Download version 1"
                      >
                        <DownloadIcon />
                      </a>
                    </div>
                  )}

                  {dialogSong.audioUrl && dialogSong.audioUrl2 && (
                    <div className="w-px h-8 bg-border flex-shrink-0" />
                  )}

                  {dialogSong.audioUrl2 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="play-btn"
                        style={{ width: 36, height: 36 }}
                        onClick={() => togglePlay(dialogSong, 2)}
                        aria-label={isVersionPlaying(dialogSong.id, 2) ? "Pause version 2" : "Play version 2"}
                      >
                        {isVersionPlaying(dialogSong.id, 2) ? (
                          <PauseIcon size={14} />
                        ) : (
                          <PlayIcon size={14} />
                        )}
                      </button>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-muted-foreground leading-none">
                          Version 2
                        </span>
                        {isVersionPlaying(dialogSong.id, 2) && (
                          <span className="text-xs text-tertiary leading-none">Playing…</span>
                        )}
                      </div>
                      <a
                        href={dialogSong.audioUrl2}
                        download={`${dialogSong.title} - Version 2.mp3`}
                        className="version-dl-btn ml-1"
                        aria-label="Download version 2"
                      >
                        <DownloadIcon />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
